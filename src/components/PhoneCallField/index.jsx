import React, { useEffect, useRef, useState } from "react";
import { FaExclamationTriangle, FaPhone, FaPhoneSlash, FaUserTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { hangupVoipCall, placeVoipCall } from "../../services/voipSipClient.js";
import { normalizeDialNumber } from "../../utils/normalizeDialNumber.js";
import styles from "./phoneCallField.module.css";

/**
 * Campo de telefone com botão para discar via WebRTC (FreePBX / JsSIP).
 */
export function PhoneCallField({
  label,
  value,
  onChange,
  readOnly,
  operatorCodeId,
}) {
  const [calling, setCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("idle");
  const [callOutcome, setCallOutcome] = useState("");
  const [statusDetail, setStatusDetail] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [hangingUp, setHangingUp] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const timerRef = useRef(null);
  const modalCloseTimeoutRef = useRef(null);
  const endingByUserRef = useRef(false);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    setElapsedSec(0);
    timerRef.current = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (modalCloseTimeoutRef.current) {
        clearTimeout(modalCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    if (modalCloseTimeoutRef.current) {
      clearTimeout(modalCloseTimeoutRef.current);
      modalCloseTimeoutRef.current = null;
    }
    if (callStatus === "notCompleted") {
      modalCloseTimeoutRef.current = setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);
    } else if (callStatus === "ended") {
      modalCloseTimeoutRef.current = setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);
    }
    return () => {
      if (modalCloseTimeoutRef.current) {
        clearTimeout(modalCloseTimeoutRef.current);
      }
    };
  }, [callStatus, isModalOpen]);

  const canHangup = callStatus === "calling" || callStatus === "answered";
  const canCloseModal = !calling && !canHangup && !hangingUp;

  const handleHangup = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canHangup) return;
    setHangingUp(true);
    endingByUserRef.current = true;
    try {
      hangupVoipCall();
      stopTimer();
      setCallStatus("ended");
      setCallOutcome("operatorEnded");
      setStatusDetail("Chamada encerrada pelo operador.");
    } catch {
      toast.error("Não foi possível encerrar a chamada.");
    } finally {
      setHangingUp(false);
    }
  };

  const handleCloseModal = () => {
    if (!canCloseModal) return;
    setIsModalOpen(false);
  };

  const handleCall = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const digits = normalizeDialNumber(value);
    if (!digits) {
      toast.warning("Informe um número para ligar.");
      return;
    }
    if (!operatorCodeId) {
      toast.error("Sessão de operador inválida.");
      return;
    }
    setIsModalOpen(true);
    setCalling(true);
    setHangingUp(false);
    endingByUserRef.current = false;
    setCallStatus("calling");
    setCallOutcome("");
    setStatusDetail("Aguardando atendimento.");
    setElapsedSec(0);
    stopTimer();

    try {
      const { session, state } = await placeVoipCall(operatorCodeId, digits);

      const markAnswered = () => {
        setCallStatus("answered");
        setCallOutcome("");
        setStatusDetail("Chamada atendida.");
        startTimer();
      };

      session.once("accepted", markAnswered);
      session.once("confirmed", markAnswered);
      session.once("failed", () => {
        stopTimer();
        setCallStatus("notCompleted");
        setCallOutcome("notAnswered");
        setStatusDetail("Chamada nao completada ou nao atendida.");
      });
      session.once("ended", () => {
        stopTimer();
        if (endingByUserRef.current) {
          setCallStatus("ended");
          setCallOutcome("operatorEnded");
          return;
        }
        setCallStatus("ended");
        setCallOutcome("remoteEnded");
        setStatusDetail("A outra pessoa encerrou a chamada.");
      });

      if (state === "answered") {
        markAnswered();
      } else {
        setCallStatus("calling");
        setStatusDetail("Aguardando atendimento.");
      }
    } catch (err) {
      stopTimer();
      setCallStatus("notCompleted");
      setCallOutcome("notAnswered");
      setStatusDetail(err?.message || "Nao foi possivel completar a chamada.");
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.field}>
        <label>{label}</label>
        <input type="text" value={value ?? ""} onChange={onChange} readOnly={readOnly} />
      </div>
      <button
        type="button"
        className={styles.callBtn}
        onClick={handleCall}
        disabled={calling}
        title="Ligar com VoIP"
        aria-label={`Ligar para ${label}`}
      >
        <FaPhone />
      </button>
      {isModalOpen ? (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Status da ligação para ${label}`}
        >
          <div className={styles.modalCard}>
            <h4 className={styles.modalTitle}>Ligação VoIP</h4>
            <p className={styles.modalNumber}>{label}</p>
            <div className={styles.statusBox} aria-live="polite">
              {callOutcome === "operatorEnded" ? (
                <span className={`${styles.statusBadge} ${styles.badgeOperatorEnded}`}>
                  <FaPhoneSlash className={styles.badgeIcon} aria-hidden="true" />
                  Encerrada pelo operador
                </span>
              ) : null}
              {callOutcome === "remoteEnded" ? (
                <span className={`${styles.statusBadge} ${styles.badgeRemoteEnded}`}>
                  <FaUserTimes className={styles.badgeIcon} aria-hidden="true" />
                  Encerrada pela outra pessoa
                </span>
              ) : null}
              {callOutcome === "notAnswered" ? (
                <span className={`${styles.statusBadge} ${styles.badgeNotAnswered}`}>
                  <FaExclamationTriangle className={styles.badgeIcon} aria-hidden="true" />
                  Nao atendida / nao completada
                </span>
              ) : null}
              {callStatus === "calling" ? <span className={styles.calling}>Chamando...</span> : null}
              {callStatus === "answered" ? (
                <span className={styles.answered}>Em chamada: {formatDuration(elapsedSec)}</span>
              ) : null}
              {callStatus === "ended" ? (
                <span className={styles.finished}>Chamada encerrada ({formatDuration(elapsedSec)})</span>
              ) : null}
              {callStatus === "notCompleted" ? (
                <span className={styles.notCompleted}>Chamada não completada</span>
              ) : null}
              {statusDetail ? <p className={styles.statusDetail}>{statusDetail}</p> : null}
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.hangupBtn}
                onClick={handleHangup}
                disabled={!canHangup || hangingUp}
                title="Encerrar chamada"
                aria-label={`Encerrar ligação para ${label}`}
              >
                <FaPhoneSlash />
              </button>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleCloseModal}
                disabled={!canCloseModal}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
