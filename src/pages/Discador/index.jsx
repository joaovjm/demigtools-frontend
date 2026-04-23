import React, { useContext, useEffect, useMemo, useState } from "react";
import { FaPhone, FaPhoneSlash } from "react-icons/fa";
import { UserContext } from "../../context/UserContext";
import { useVoipWebRtcCall } from "../../hooks/useVoipWebRtcCall";
import styles from "./discador.module.css";

const PAD_ROWS = [
  [
    { d: "1", sub: "" },
    { d: "2", sub: "ABC" },
    { d: "3", sub: "DEF" },
  ],
  [
    { d: "4", sub: "GHI" },
    { d: "5", sub: "JKL" },
    { d: "6", sub: "MNO" },
  ],
  [
    { d: "7", sub: "PQRS" },
    { d: "8", sub: "TUV" },
    { d: "9", sub: "WXYZ" },
  ],
  [
    { d: "*", sub: "" },
    { d: "0", sub: "+" },
    { d: "#", sub: "" },
  ],
];

function digitsOnly(s) {
  return String(s || "").replace(/\D/g, "");
}

/** Exibe dígitos em cartões (visual estilo display do número). */
function DigitDisplay({ value, placeholder }) {
  const chars = value ? String(value).split("") : [];
  if (!chars.length) {
    return (
      <div className={styles.digitRow} aria-live="polite">
        <span className={styles.digitTileMuted}>{placeholder}</span>
      </div>
    );
  }
  return (
    <div className={styles.digitRow} aria-live="polite">
      {chars.map((ch, i) => (
        <span key={`${i}-${ch}`} className={styles.digitTile}>
          {ch}
        </span>
      ))}
    </div>
  );
}

const Discador = () => {
  const { operatorData } = useContext(UserContext);
  const [dialed, setDialed] = useState("");

  const {
    voipRemoteAudioRef,
    voipCallLoadingKey,
    voipLastError,
    voipUaStatus,
    voipStatusLabel,
    voipModal,
    voipCallStatus,
    voipCallDurationSec,
    voipDurationActive,
    voipCanHangup,
    openVoipModalAndCall,
    handleVoipHangupClick,
    formatVoipDuration,
  } = useVoipWebRtcCall({
    operatorData,
    openCallOverlayWhenDialing: false,
    autoCloseCallUiOnEnd: false,
  });

  const rawDigits = useMemo(() => digitsOnly(dialed), [dialed]);
  const activeCallNumber = voipModal.phone || "";
  const displayValue = activeCallNumber || rawDigits;
  const callBusy = voipCallLoadingKey !== null;

  const append = (ch) => {
    setDialed((prev) => prev + ch);
  };

  useEffect(() => {
    const dialCharFromEvent = (e) => {
      const { key, code } = e;
      if (key >= "0" && key <= "9") return key;
      if (key === "*" || key === "#" || key === "+") return key;
      if (code === "NumpadMultiply") return "*";
      if (code === "NumpadAdd") return "+";
      return null;
    };

    const isTypingInField = (target) => {
      if (!target || typeof target !== "object") return false;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (target.isContentEditable) return true;
      return false;
    };

    const onKeyDown = (e) => {
      if (callBusy) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (isTypingInField(e.target)) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        setDialed((prev) => prev.slice(0, -1));
        return;
      }

      const ch = dialCharFromEvent(e);
      if (ch) {
        e.preventDefault();
        setDialed((prev) => prev + ch);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [callBusy]);

  const backspace = () => {
    setDialed((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    if (voipCanHangup) return;
    setDialed("");
  };

  const onCall = () => {
    if (!rawDigits) return;
    openVoipModalAndCall(dialed, "discador");
  };

  const showDuration = voipDurationActive || voipCallDurationSec > 0;

  return (
    <main className={styles.page}>
      <audio ref={voipRemoteAudioRef} autoPlay playsInline hidden aria-hidden="true" />
      <h1 className={styles.title}>Discador</h1>

      <section className={styles.displayFrame} aria-label="Número digitado">
        <div className={styles.displayLabel}>Número</div>
        <DigitDisplay value={displayValue} placeholder="Toque nos dígitos ou use o teclado" />
        <div className={styles.durationRow}>
          <span>Duração da chamada</span>
          <span className={styles.durationValue}>
            {showDuration ? formatVoipDuration(voipCallDurationSec) : "—"}
          </span>
        </div>
      </section>

      <div className={styles.padWrap}>
        <div className={styles.padGrid}>
          {PAD_ROWS.flat().map((cell) => (
            <button
              key={cell.d}
              type="button"
              className={styles.padKey}
              disabled={callBusy}
              onClick={() => append(cell.d)}
              aria-label={cell.d === "*" ? "asterisco" : cell.d === "#" ? "sustenido" : `dígito ${cell.d}`}
            >
              {cell.d}
              {cell.sub ? <span className={styles.padKeySub}>{cell.sub}</span> : null}
            </button>
          ))}
        </div>

        <div className={styles.auxKeys}>
          <button type="button" className={styles.auxBtn} onClick={backspace} disabled={callBusy || !dialed}>
            Apagar
          </button>
          <button type="button" className={styles.auxBtn} onClick={clearAll} disabled={callBusy || !dialed}>
            Limpar
          </button>
        </div>

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.callBtn}
            title="Ligar"
            disabled={callBusy || !rawDigits}
            onClick={onCall}
            aria-label="Ligar"
          >
            <FaPhone />
          </button>
          <button
            type="button"
            className={styles.hangupBtn}
            title="Desligar"
            disabled={!voipCanHangup || callBusy}
            onClick={handleVoipHangupClick}
            aria-label="Desligar"
          >
            <FaPhoneSlash />
          </button>
        </div>
      </div>

      <section className={styles.statusSection}>
        <div className={styles.voipStatusBox}>
          <strong>Status SIP/WebRTC:</strong>
          <span className={`${styles.voipStatusPill} ${styles[`voipStatus_${voipUaStatus}`]}`}>
            {voipStatusLabel}
          </span>
        </div>
        {voipLastError ? (
          <div className={styles.voipErrorBox}>
            <strong>Último erro VoIP:</strong> {voipLastError}
          </div>
        ) : null}
        <div className={styles.voipCallStatusBox}>
          <strong>Status da chamada:</strong> {voipCallStatus}
        </div>
      </section>
    </main>
  );
};

export default Discador;
