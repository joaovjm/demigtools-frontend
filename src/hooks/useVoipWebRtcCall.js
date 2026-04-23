import { useEffect, useRef, useState } from "react";
import { fetchVoipWebrtcConfig } from "../api/voipApi";
import {
  attachJssipRemoteAudioToElement,
  callWithWebrtcUa,
  ensureWebrtcUa,
  getWebrtcUaState,
} from "../services/webrtcJssipService";
import { normalizeBrWebRtcDial } from "../utils/normalizeBrWebRtcDial.js";
import {
  formatVoipDuration,
  getVoipErrorMessage,
  voipCallStatusWithTimestamp,
  VOIP_UA_STATUS_LABELS,
} from "../utils/voipWebRtcHelpers.js";

const VOIP_CALL_STAGE_RANK = {
  idle: 0,
  starting: 10,
  config_loaded: 20,
  ua_connecting: 30,
  dialing: 40,
  ringing: 50,
  media_pending: 57,
  answered: 60,
  ended: 100,
  failed: 100,
  error: 100,
};

/**
 * @param {object} params
 * @param {object|null|undefined} params.operatorData
 * @param {boolean} [params.openCallOverlayWhenDialing=true] — se false, não abre overlay/modal (ex.: discador em página)
 * @param {boolean} [params.autoCloseCallUiOnEnd=true] — se false, não agenda fechamento automático ao encerrar
 */
export function useVoipWebRtcCall({
  operatorData,
  openCallOverlayWhenDialing = true,
  autoCloseCallUiOnEnd = true,
} = {}) {
  const [voipCallLoadingKey, setVoipCallLoadingKey] = useState(null);
  const [voipWebrtcConfig, setVoipWebrtcConfig] = useState(null);
  const [voipLastError, setVoipLastError] = useState("");
  const [voipUaStatus, setVoipUaStatus] = useState("idle");
  const [voipModal, setVoipModal] = useState({ open: false, phone: "" });
  const [voipCallStatus, setVoipCallStatus] = useState("Aguardando chamada...");
  const [voipCallDurationSec, setVoipCallDurationSec] = useState(0);
  const [voipDurationActive, setVoipDurationActive] = useState(false);
  const voipCallFlowRef = useRef({ id: 0, rank: 0, terminal: false });
  const voipDurationTimerRef = useRef(null);
  const voipAnsweredAtRef = useRef(null);
  const voipSessionRef = useRef(null);
  const voipRemoteAudioRef = useRef(null);
  const voipRemoteAudioDetachRef = useRef(null);
  const voipAutoCloseTimerRef = useRef(null);
  const [voipCanHangup, setVoipCanHangup] = useState(false);
  const voipIceListenerRef = useRef(null);
  const voipIceWatchdogRef = useRef(null);
  const voipMediaAnsweredRef = useRef(false);

  const beginVoipCallFlow = () => {
    const nextId = voipCallFlowRef.current.id + 1;
    voipCallFlowRef.current = { id: nextId, rank: 0, terminal: false };
    return nextId;
  };

  const updateVoipCallStatus = (flowId, stage, text) => {
    if (flowId !== voipCallFlowRef.current.id) return;
    const nextRank = VOIP_CALL_STAGE_RANK[stage] ?? 0;
    const current = voipCallFlowRef.current;
    if (current.terminal && nextRank < 100) return;
    if (nextRank < current.rank) return;
    voipCallFlowRef.current = {
      ...current,
      rank: nextRank,
      terminal: nextRank >= 100,
    };
    setVoipCallStatus(voipCallStatusWithTimestamp(text));
  };

  const stopVoipCallDuration = () => {
    if (voipDurationTimerRef.current) {
      clearInterval(voipDurationTimerRef.current);
      voipDurationTimerRef.current = null;
    }
    setVoipDurationActive(false);
    voipAnsweredAtRef.current = null;
  };

  const startVoipCallDuration = (flowId) => {
    stopVoipCallDuration();
    if (flowId !== voipCallFlowRef.current.id) return;
    voipAnsweredAtRef.current = Date.now();
    setVoipCallDurationSec(0);
    setVoipDurationActive(true);
    voipDurationTimerRef.current = setInterval(() => {
      if (flowId !== voipCallFlowRef.current.id) {
        if (voipDurationTimerRef.current) clearInterval(voipDurationTimerRef.current);
        voipDurationTimerRef.current = null;
        return;
      }
      const start = voipAnsweredAtRef.current;
      if (!start) return;
      setVoipCallDurationSec(Math.floor((Date.now() - start) / 1000));
    }, 250);
  };

  const finalizeVoipCallDuration = () => {
    const start = voipAnsweredAtRef.current;
    if (voipDurationTimerRef.current) {
      clearInterval(voipDurationTimerRef.current);
      voipDurationTimerRef.current = null;
    }
    setVoipDurationActive(false);
    if (start) {
      const sec = Math.floor((Date.now() - start) / 1000);
      setVoipCallDurationSec(sec);
    }
    voipAnsweredAtRef.current = null;
  };

  const clearVoipAutoCloseTimer = () => {
    if (voipAutoCloseTimerRef.current) {
      clearTimeout(voipAutoCloseTimerRef.current);
      voipAutoCloseTimerRef.current = null;
    }
  };

  const scheduleVoipModalClose = (flowId, delayMs) => {
    clearVoipAutoCloseTimer();
    voipAutoCloseTimerRef.current = setTimeout(() => {
      voipAutoCloseTimerRef.current = null;
      if (flowId !== voipCallFlowRef.current.id) return;
      stopVoipCallDuration();
      voipSessionRef.current = null;
      setVoipCanHangup(false);
      setVoipModal({ open: false, phone: "" });
    }, delayMs);
  };

  const detachVoipRemoteAudio = () => {
    const detach = voipRemoteAudioDetachRef.current;
    voipRemoteAudioDetachRef.current = null;
    if (typeof detach === "function") {
      try {
        detach();
      } catch {
        // ignora
      }
    }
  };

  const terminateVoipSession = () => {
    detachVoipRemoteAudio();
    const s = voipSessionRef.current;
    if (!s) return;
    try {
      if (typeof s.terminate === "function") s.terminate();
    } catch {
      // ignora
    }
  };

  const clearVoipMediaWatch = () => {
    if (voipIceWatchdogRef.current) {
      clearTimeout(voipIceWatchdogRef.current);
      voipIceWatchdogRef.current = null;
    }
    const li = voipIceListenerRef.current;
    if (li?.removers?.length) {
      li.removers.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignora
        }
      });
    }
    voipIceListenerRef.current = null;
  };

  const markVoipMediaAnswered = (fid) => {
    if (fid !== voipCallFlowRef.current.id || voipMediaAnsweredRef.current) return;
    voipMediaAnsweredRef.current = true;
    clearVoipMediaWatch();
    startVoipCallDuration(fid);
    updateVoipCallStatus(fid, "answered", "Chamada atendida.");
  };

  useEffect(() => {
    return () => {
      if (voipDurationTimerRef.current) clearInterval(voipDurationTimerRef.current);
      clearVoipAutoCloseTimer();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchVoipWebrtcConfig(operatorData?.operator_code_id);
        if (!cancelled && res?.success && res.data?.enabled && res.data?.configured) {
          setVoipWebrtcConfig(res.data);
          setVoipUaStatus("configured");
        } else if (!cancelled) {
          setVoipWebrtcConfig(null);
          setVoipUaStatus("not_configured");
        }
      } catch {
        if (!cancelled) {
          setVoipWebrtcConfig(null);
          setVoipUaStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [operatorData?.operator_code_id]);

  useEffect(() => {
    if (!voipWebrtcConfig?.sip_user || !voipWebrtcConfig?.sip_password || !operatorData) return;
    ensureWebrtcUa(voipWebrtcConfig, operatorData).catch(() => {});
  }, [voipWebrtcConfig, operatorData?.operator_code_id]);

  const handleVoipCall = async (phoneValue, key) => {
    const flowId = beginVoipCallFlow();
    clearVoipAutoCloseTimer();
    clearVoipMediaWatch();
    voipMediaAnsweredRef.current = false;
    terminateVoipSession();
    voipSessionRef.current = null;
    setVoipCanHangup(false);
    stopVoipCallDuration();
    setVoipCallDurationSec(0);
    const rawQuick = String(phoneValue || "").replace(/\D/g, "");
    if (!rawQuick) {
      setVoipLastError("Informe um número de telefone para discar.");
      updateVoipCallStatus(flowId, "error", "Informe um número de telefone para discar.");
      return;
    }
    setVoipCallLoadingKey(key);
    try {
      setVoipUaStatus("connecting");
      updateVoipCallStatus(flowId, "starting", "Iniciando chamada via navegador...");
      let config = voipWebrtcConfig;
      if (!config) {
        const res = await fetchVoipWebrtcConfig(operatorData?.operator_code_id);
        if (res?.success && res.data?.enabled && res.data?.configured) {
          config = res.data;
          setVoipWebrtcConfig(res.data);
          setVoipUaStatus("configured");
          updateVoipCallStatus(flowId, "config_loaded", "Configuração WebRTC carregada.");
        }
      }
      if (!config) {
        setVoipUaStatus("not_configured");
        throw new Error(
          "WebRTC não configurado para este operador. Verifique VoIP > WebRTC e vínculo de ramal."
        );
      }

      const normalized = normalizeBrWebRtcDial(phoneValue, config.default_ddd || "");
      if (!normalized) {
        throw new Error(
          "Não foi possível normalizar o número. Configure o DDD padrão em Admin > VoIP > WebRTC (2 dígitos) ou inclua DDD/código 55 no cadastro."
        );
      }
      if (normalized.length < 12) {
        throw new Error("Número incompleto após normalização (mínimo 12 dígitos com 55 + DDD + número).");
      }

      setVoipModal((prev) => ({
        ...prev,
        open: openCallOverlayWhenDialing ? true : false,
        phone: normalized,
      }));

      const dialConfig = { ...config, dial_prefix: "" };
      const micPromise = navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const session = await callWithWebrtcUa(
        dialConfig,
        normalized,
        operatorData,
        {
          onProgress: () => updateVoipCallStatus(flowId, "ringing", "Chamando..."),
          onAccepted: () => {
            if (flowId !== voipCallFlowRef.current.id) return;
            markVoipMediaAnswered(flowId);
          },
          onConfirmed: (_ev, sess) => {
            if (flowId !== voipCallFlowRef.current.id) return;
            if (voipMediaAnsweredRef.current) {
              clearVoipMediaWatch();
              return;
            }
            updateVoipCallStatus(
              flowId,
              "media_pending",
              "SIP confirmado (ACK); aguardando mídia estável para considerar atendida..."
            );
            const pc = sess?.connection;
            const mediaReady = () => {
              const ice = pc?.iceConnectionState;
              const conn = pc?.connectionState;
              const iceOk = ice === "connected" || ice === "completed";
              const connOk = conn === "connected" || conn === "completed";
              return iceOk && connOk;
            };
            if (!pc || typeof pc.addEventListener !== "function") {
              markVoipMediaAnswered(flowId);
              return;
            }
            if (mediaReady()) {
              markVoipMediaAnswered(flowId);
              return;
            }
            const tryMark = () => {
              if (flowId !== voipCallFlowRef.current.id) return;
              if (mediaReady()) markVoipMediaAnswered(flowId);
            };
            const removers = [];
            pc.addEventListener("iceconnectionstatechange", tryMark);
            removers.push(() => pc.removeEventListener("iceconnectionstatechange", tryMark));
            pc.addEventListener("connectionstatechange", tryMark);
            removers.push(() => pc.removeEventListener("connectionstatechange", tryMark));
            voipIceListenerRef.current = { removers };
            voipIceWatchdogRef.current = setTimeout(() => {
              voipIceWatchdogRef.current = null;
              if (flowId !== voipCallFlowRef.current.id || voipMediaAnsweredRef.current) return;
              updateVoipCallStatus(
                flowId,
                "media_pending",
                "Mídia ainda não estabilizou; em caso de recusa no celular, a chamada deve cair em seguida..."
              );
            }, 12000);
          },
          onEnded: (event) => {
            clearVoipMediaWatch();
            detachVoipRemoteAudio();
            const originator = event?.originator;
            const start = voipAnsweredAtRef.current;
            finalizeVoipCallDuration();
            const durSec = start ? Math.floor((Date.now() - start) / 1000) : 0;
            const durText = start ? ` Duração: ${formatVoipDuration(durSec)}.` : "";
            const who =
              originator === "local"
                ? " Encerrada pelo operador."
                : originator === "remote"
                  ? " Encerrada pela outra parte."
                  : "";
            updateVoipCallStatus(flowId, "ended", `Chamada encerrada.${who}${durText}`);
            voipSessionRef.current = null;
            setVoipCanHangup(false);
            const delayMs = originator === "local" ? 600 : 900;
            if (autoCloseCallUiOnEnd) {
              scheduleVoipModalClose(flowId, delayMs);
            }
          },
          onFailed: (event) => {
            clearVoipMediaWatch();
            detachVoipRemoteAudio();
            const reason = getVoipErrorMessage(event);
            const start = voipAnsweredAtRef.current;
            finalizeVoipCallDuration();
            const durSec = start ? Math.floor((Date.now() - start) / 1000) : 0;
            const durText = start ? ` Duração: ${formatVoipDuration(durSec)}.` : "";
            const text = `Falha na chamada: ${reason}${durText}`;
            setVoipLastError(text);
            updateVoipCallStatus(flowId, "failed", text);
            voipSessionRef.current = null;
            setVoipCanHangup(false);
            console.error("VoIP session failed:", reason, event);
          },
          onUaRegistrationFailed: (event) => {
            clearVoipMediaWatch();
            detachVoipRemoteAudio();
            finalizeVoipCallDuration();
            const reason = getVoipErrorMessage(event);
            const text = `Falha no registro SIP: ${reason}`;
            setVoipUaStatus("registration_failed");
            setVoipLastError(text);
            updateVoipCallStatus(flowId, "error", "Falha ao conectar SIP.");
            voipSessionRef.current = null;
            setVoipCanHangup(false);
            console.error("VoIP registration failed", event);
          },
          onUaDisconnected: (event) => {
            const reason = getVoipErrorMessage(event);
            if (!reason || reason === "Erro desconhecido") return;
            clearVoipMediaWatch();
            detachVoipRemoteAudio();
            finalizeVoipCallDuration();
            const text = `SIP desconectado: ${reason}`;
            setVoipUaStatus("disconnected");
            setVoipLastError(text);
            updateVoipCallStatus(flowId, "error", "SIP desconectado.");
            voipSessionRef.current = null;
            setVoipCanHangup(false);
            console.warn("VoIP UA disconnected", event);
          },
          onUaState: (state) => {
            if (state) setVoipUaStatus(state);
          },
        },
        { mediaStreamPromise: micPromise }
      );
      voipSessionRef.current = session;
      voipRemoteAudioDetachRef.current = attachJssipRemoteAudioToElement(
        session,
        voipRemoteAudioRef.current
      );
      setVoipCanHangup(true);
      const state = getWebrtcUaState();
      if (state === "registered" || state === "connected") {
        if (state === "registered") setVoipUaStatus("registered");
        if (state === "connected") setVoipUaStatus("connected");
        updateVoipCallStatus(flowId, "dialing", "Discando pelo navegador...");
      } else {
        updateVoipCallStatus(
          flowId,
          "ua_connecting",
          "Conectando ramal WebRTC e iniciando chamada..."
        );
      }
    } catch (e) {
      clearVoipMediaWatch();
      detachVoipRemoteAudio();
      finalizeVoipCallDuration();
      voipSessionRef.current = null;
      setVoipCanHangup(false);
      const reason = getVoipErrorMessage(e);
      const text = `Erro ao iniciar chamada WebRTC: ${reason}`;
      setVoipUaStatus("error");
      setVoipLastError(text);
      updateVoipCallStatus(flowId, "error", text);
      console.error("VoIP start call error", e);
    } finally {
      setVoipCallLoadingKey(null);
    }
  };

  const handleVoipHangupClick = () => {
    terminateVoipSession();
  };

  const openVoipModalAndCall = (phoneValue, key) => {
    clearVoipAutoCloseTimer();
    clearVoipMediaWatch();
    voipMediaAnsweredRef.current = false;
    stopVoipCallDuration();
    setVoipCallDurationSec(0);
    setVoipLastError("");
    setVoipCallStatus(voipCallStatusWithTimestamp("Aguardando chamada..."));
    setVoipModal({ open: !!openCallOverlayWhenDialing, phone: String(phoneValue || "") });
    handleVoipCall(phoneValue, key);
  };

  const voipStatusLabel = VOIP_UA_STATUS_LABELS[voipUaStatus] || voipUaStatus;

  return {
    voipRemoteAudioRef,
    voipCallLoadingKey,
    voipWebrtcConfig,
    voipLastError,
    voipUaStatus,
    voipStatusLabel,
    voipModal,
    setVoipModal,
    voipCallStatus,
    voipCallDurationSec,
    voipDurationActive,
    voipCanHangup,
    openVoipModalAndCall,
    handleVoipHangupClick,
    terminateVoipSession,
    voipSessionRef,
    stopVoipCallDuration,
    setVoipCanHangup,
    formatVoipDuration,
  };
}
