import styles from "./donor.module.css";
import React, { useState, useEffect, useContext, useRef } from "react";

import TableDonor from "../../components/TableDonor";
import { useParams } from "react-router";
import { editDonor } from "../../helper/editDonor";
import { getInfoDonor } from "../../helper/getDonor";
import ModalDonation from "../../components/ModalDonation";
import {
  BUTTON_TEXTS,
  DONOR_TYPES,
  FORM_LABELS,
  getDonorTypeOptions,
  ICONS,
} from "../../constants/constants";

import FormTextArea from "../../components/forms/FormTextArea";
import FormDonorInput from "../../components/forms/FormDonorInput";
import FormListSelect from "../../components/forms/FormListSelect";
import { UserContext } from "../../context/UserContext";
import ModalEditDonation from "../../components/ModalEditDonation";
import { setActivityHistoric } from "../../helper/setActivityHistoric";
import { FaEnvelope, FaTable, FaHistory } from "react-icons/fa";
import ModalSendEmail from "../../components/ModalSendEmail";
import TabNavigation from "../../components/TabNavigation";
import DonorActivityHistory from "../../components/DonorActivityHistory";
import { logDonorActivity } from "../../helper/logDonorActivity";
import ActionDropdown from "../../components/ActionDropdown";
import ModalScheduleDonor from "../../components/ModalScheduleDonor";
import ModalCreateTask from "../../components/ModalCreateTask";
import { fetchDonorActiveRequest, deactivateDonorMensalRequest } from "../../api/donorApi";
import { fetchVoipWebrtcConfig } from "../../api/voipApi";
import { FaPhone } from "react-icons/fa";
import {
  attachJssipRemoteAudioToElement,
  callWithWebrtcUa,
  ensureWebrtcUa,
  getWebrtcUaState,
} from "../../services/webrtcJssipService";
import { normalizeBrWebRtcDial } from "../../utils/normalizeBrWebRtcDial.js";

function sipResponseSummary(sipMsg) {
  if (!sipMsg || typeof sipMsg !== "object") return "";
  const code = sipMsg.status_code;
  if (code == null || code === "") return "";
  const phrase = sipMsg.reason_phrase != null ? String(sipMsg.reason_phrase).trim() : "";
  return phrase ? `SIP ${code} ${phrase}` : `SIP ${code}`;
}

function getVoipErrorMessage(eventOrError) {
  if (!eventOrError) return "Erro desconhecido";
  if (typeof eventOrError === "string") return eventOrError;
  if (eventOrError instanceof Error) {
    return eventOrError.message || "Erro desconhecido";
  }

  const cause = eventOrError.cause != null ? String(eventOrError.cause) : "";
  // JsSIP session "failed": { originator, message, cause } — resposta SIP vem em `message`.
  const fromMessage = sipResponseSummary(eventOrError.message);
  const fromResponse = sipResponseSummary(eventOrError.response);
  const sipPart = fromMessage || fromResponse;

  if (cause && sipPart) return `${cause} (${sipPart})`;
  if (cause) return cause;
  if (sipPart) return sipPart;

  const plainMsg = eventOrError.message;
  if (typeof plainMsg === "string" && plainMsg.trim()) return plainMsg.trim();

  return eventOrError?.data?.cause || "Erro desconhecido";
}

function formatVoipClockTime(d = new Date()) {
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatVoipDuration(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function voipCallStatusWithTimestamp(text) {
  return `[${formatVoipClockTime()}] ${text}`;
}

const Donor = () => {
  const { id } = useParams();
  const { operatorData, setOperatorData } = useContext(UserContext);
  const [donorData, SetDonorData] = useState({
    nome: "",
    tipo: "",
    cpf: "",
    email: "",
    endereco: "",
    cidade: "",
    bairro: "",
    telefone1: "",
    telefone2: "",
    telefone3: "",
    dia: "",
    mensalidade: "",
    media: "",
    observacao: "",
    referencia: "",
  });
  const [donation, setDonation] = useState([]);
  const [workListRequest, setWorkListRequest] = useState([]);

  const [uiState, setUiState] = useState({
    edit: true,
    btnEdit: BUTTON_TEXTS.EDIT,
    showBtn: true,
    modalShow: false,
    loading: false,
    modalEdit: false,
    modalSendEmail: false,
    modalSchedule: false,
    modalCreateTask: false,
  });
  
  const [activeTab, setActiveTab] = useState("donations");
  const [originalDonorData, setOriginalDonorData] = useState({});
  const accessLoggedRef = useRef(false);
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

  const params = {};
  if (id) params.id = id;

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
    // Só re-disparar quando a config ou o operador (id) mudarem — evita re-registrar
    // a cada re-render se `operatorData` trocar de referência com os mesmos dados.
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

      setVoipModal((prev) => ({ ...prev, open: true, phone: normalized }));

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
          scheduleVoipModalClose(flowId, delayMs);
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
    setVoipModal({ open: true, phone: String(phoneValue || "") });
    handleVoipCall(phoneValue, key);
  };

  useEffect(() => {
    // Resetar a flag quando o ID do doador mudar
    accessLoggedRef.current = false;
    
    const loadDonorData = async () => {
      try {
        const data = await getInfoDonor(id);
        const donor = data[0];

        const donorDataObject = {
          nome: donor.donor_name,
          endereco: donor.donor_address,
          cidade: donor.donor_city,
          bairro: donor.donor_neighborhood,
          telefone1: donor.donor_tel_1,
          cpf: donor.donor_cpf?.donor_cpf || null,
          email: donor.donor_email?.donor_email || null,
          telefone2: donor.donor_tel_2?.donor_tel_2 || null,
          telefone3: donor.donor_tel_3?.donor_tel_3 || null,
          dia: donor.donor_mensal?.donor_mensal_day || null,
          mensalidade: donor.donor_mensal?.donor_mensal_monthly_fee || null,
          observacao: donor.donor_observation?.donor_observation || "",
          referencia: donor.donor_reference?.donor_reference || "",
          tipo: donor.donor_type,
        };

        SetDonorData(donorDataObject);
        setOriginalDonorData(donorDataObject);

        // Registrar acesso ao doador apenas uma vez por carregamento
        if (operatorData?.operator_code_id && !accessLoggedRef.current) {
          accessLoggedRef.current = true;
          logDonorActivity({
            donor_id: id,
            operator_code_id: operatorData.operator_code_id,
            action_type: "donor_access",
            action_description: "Acessou a página do doador",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar os dados do doador: ", error.message);
      }
    };

    loadDonorData();
  }, [id, operatorData?.operator_code_id]);

  useEffect(() => {
    const fetchWorkListRequest = async () => {
      try {
        const data = await fetchDonorActiveRequest(id);
        setWorkListRequest(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar lista de trabalho:", error.message);
        setWorkListRequest([]);
      }
    };
    if (id) fetchWorkListRequest();
  }, [id]);

  const handleInputChange = (field, value) => {
    SetDonorData((prev) => ({ ...prev, [field]: value }));
  };

  // Responsável por editar e salvar as informações do doador
  const handleEditDonor = async () => {
    if (uiState.btnEdit === BUTTON_TEXTS.SAVE) {
      if (
        donorData.tipo === DONOR_TYPES.MONTHLY &&
        (donorData.dia === null || donorData.mensalidade === null)
      ) {
        window.alert(
          "Os campos DIA e MENSALIDADE precisam ser preenchidos corretamente!"
        );
        return;
      }

      setUiState((prev) => ({ ...prev, loading: true }));

      try {
        const previousDonorType = originalDonorData?.tipo;

        const success = await editDonor(
          id,
          donorData.nome,
          donorData.tipo,
          donorData.cpf,
          donorData.email,
          donorData.endereco,
          donorData.cidade,
          donorData.bairro,
          donorData.telefone1,
          donorData.telefone2,
          donorData.telefone3,
          donorData.dia,
          donorData.mensalidade,
          donorData.observacao,
          donorData.referencia
        );

        if (success) {
          // Se o doador era Mensal e foi alterado para Avulso,
          // remover o registro correspondente na tabela donor_mensal
          if (
            previousDonorType === DONOR_TYPES.MONTHLY &&
            donorData.tipo === DONOR_TYPES.CASUAL
          ) {
            try {
              await deactivateDonorMensalRequest(id);
            } catch (error) {
              console.error(
                "Erro inesperado ao remover dados de mensal do doador:",
                error.message
              );
            }
          }

          setActivityHistoric({
            dbID: id,
            dataBase: "donor",
            operatorID: operatorData.operator_code_id,
          });

          // Registrar edição do doador no histórico
          logDonorActivity({
            donor_id: id,
            operator_code_id: operatorData.operator_code_id,
            action_type: "donor_edit",
            action_description: "Editou as informações do doador",
            old_values: originalDonorData,
            new_values: donorData,
          });

          // Atualizar os dados originais para refletir a edição
          setOriginalDonorData(donorData);

          setUiState({
            edit: true,
            btnEdit: BUTTON_TEXTS.EDIT,
            showBtn: true,
            loading: false,
            modalShow: uiState.modalShow,
          });
        }
      } catch (error) {
        console.error("Erro ao editar o doador: ", error.message);
        setUiState((prev) => ({ ...prev, loading: false }));
      }
    } else {
      setUiState((prev) => ({
        ...prev,
        edit: false,
        btnEdit: BUTTON_TEXTS.SAVE,
        showBtn: false,
      }));
    }
  };

  const handleBack = () => window.history.back();
  const voipStatusLabel = {
    idle: "Idle",
    configured: "Configurado",
    not_configured: "Nao configurado",
    connecting: "Conectando",
    connected: "Conectado",
    registered: "Registrado",
    registration_failed: "Falha de registro",
    disconnected: "Desconectado",
    error: "Erro",
  }[voipUaStatus] || voipUaStatus;

  return (
    <main className={styles.containerDonor}>
      <audio ref={voipRemoteAudioRef} autoPlay playsInline hidden aria-hidden="true" />
      <div className={styles.donorContent}>
        {/* Cabeçalho com botões */}
        <header className={styles.donorHeader}>
          <h2 className={styles.donorTitle}>{ICONS.MONEY} Doador</h2>
          <div className={styles.donorActions}>
            {workListRequest.length > 0 && workListRequest[0].operator?.operator_name && (
              <span className={styles.workListBadge}>
                Está na requisição de {workListRequest[0].operator.operator_name}
              </span>
            )}
            <button onClick={handleBack} className={`${styles.donorBtn} ${styles.secondary}`}>
              {ICONS.BACK} {BUTTON_TEXTS.BACK}
            </button>
            <ActionDropdown
              onCriarMovimento={() =>
                setUiState((prev) => ({ ...prev, modalShow: true }))
              }
              onEditar={handleEditDonor}
              onEnviarEmail={() =>
                setUiState((prev) => ({ ...prev, modalSendEmail: true }))
              }
              onAgendar={() =>
                setUiState((prev) => ({ ...prev, modalSchedule: true }))
              }
              onCriarTarefa={() =>
                setUiState((prev) => ({ ...prev, modalCreateTask: true }))
              }
              showBtnCriarMovimento={uiState.showBtn}
              showBtnCriarTarefa={true}
              isLoading={uiState.loading}
              isEditMode={uiState.btnEdit === BUTTON_TEXTS.SAVE}
              editButtonText={uiState.btnEdit}
            />
          </div>
        </header>

        {/* Formulario com informações do doador */}
        <div className={styles.donorFormContainer}>
          <form className={styles.donorForm}>
            {/* Informações Básicas */}
            <div className={styles.donorSection}>
              <h4>Informações Básicas</h4>
              <div className={styles.formRow}>
                <FormDonorInput
                  label={FORM_LABELS.NAME}
                  value={donorData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  readOnly={uiState.edit}
                />

                <FormListSelect
                  label={FORM_LABELS.TYPE}
                  value={donorData.tipo}
                  onChange={(e) => handleInputChange("tipo", e.target.value)}
                  disabled={(uiState.edit && operatorData?.operator_type !== "Admin" && operatorData?.operator_code_id !== 521) || uiState.edit}
                  options={Object.values(getDonorTypeOptions(operatorData.operator_type))}
                />

                <FormDonorInput
                  label="Email"
                  value={donorData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  readOnly={uiState.edit}
                />

                {operatorData?.operator_type === "Admin" && (
                  <FormDonorInput
                    label={FORM_LABELS.CPF}
                    value={donorData?.cpf?.replace(
                      /(\d{3})(\d{3})(\d{3})(\d{2})/,
                      "$1.$2.$3-$4"
                    )}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    readOnly={uiState.edit}
                  />
                )}
              </div>
            </div>

            {/* Informações de Endereço e contato*/}
            <div className={styles.donorSection}>
              <h4>Endereço e Contato</h4>
              <div className={styles.formRow}>
                <FormDonorInput
                  label={FORM_LABELS.ADDRESS}
                  value={donorData.endereco}
                  onChange={(e) =>
                    handleInputChange("endereco", e.target.value)
                  }
                  readOnly={uiState.edit}
                />
                  
                <FormDonorInput
                  label={FORM_LABELS.CITY}
                  value={donorData.cidade}
                  onChange={(e) => handleInputChange("cidade", e.target.value)}
                  readOnly={uiState.edit}
                />

                <FormDonorInput
                  label={FORM_LABELS.NEIGHBORHOOD}
                  value={donorData.bairro}
                  onChange={(e) => handleInputChange("bairro", e.target.value)}
                  readOnly={uiState.edit}
                />
                <div className={styles.donorPhoneFieldRow}>
                  <FormDonorInput
                    label={FORM_LABELS.PHONE1}
                    value={donorData.telefone1}
                    onChange={(e) => handleInputChange("telefone1", e.target.value)}
                    readOnly={uiState.edit}
                  />
                  {donorData.telefone1 && (
                    <button
                      type="button"
                      className={styles.donorCallBtn}
                      title="Ligar via WebRTC (navegador)"
                      disabled={voipCallLoadingKey !== null}
                      onClick={() => openVoipModalAndCall(donorData.telefone1, "t1")}
                      aria-label="Ligar para telefone 1"
                    >
                      {voipCallLoadingKey === "t1" ? "…" : <FaPhone size={14} />}
                    </button>
                  )}
                </div>

                <div className={styles.donorPhoneFieldRow}>
                  <FormDonorInput
                    label={FORM_LABELS.PHONE2}
                    value={donorData.telefone2 ?? ""}
                    onChange={(e) => handleInputChange("telefone2", e.target.value)}
                    readOnly={uiState.edit}
                  />
                  {donorData.telefone2 && (
                    <button
                      type="button"
                      className={styles.donorCallBtn}
                      title="Ligar via WebRTC (navegador)"
                      disabled={voipCallLoadingKey !== null}
                      onClick={() => openVoipModalAndCall(donorData.telefone2, "t2")}
                      aria-label="Ligar para telefone 2"
                    >
                      {voipCallLoadingKey === "t2" ? "…" : <FaPhone size={14} />}
                    </button>
                  )}
                </div>

                <div className={styles.donorPhoneFieldRow}>
                  <FormDonorInput
                    label={FORM_LABELS.PHONE3}
                    value={donorData.telefone3 ?? ""}
                    onChange={(e) => handleInputChange("telefone3", e.target.value)}
                    readOnly={uiState.edit}
                  />
                  {donorData.telefone3 && (
                    <button
                      type="button"
                      className={styles.donorCallBtn}
                      title="Ligar via WebRTC (navegador)"
                      disabled={voipCallLoadingKey !== null}
                      onClick={() => openVoipModalAndCall(donorData.telefone3, "t3")}
                      aria-label="Ligar para telefone 3"
                    >
                      {voipCallLoadingKey === "t3" ? "…" : <FaPhone size={14} />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Informações de Doação */}
            {donorData.tipo === DONOR_TYPES.MONTHLY && (
            <div className={styles.donorSection}>
              <h4>Informações do Mensal</h4>
              <div className={styles.formRow}>
                <FormDonorInput
                  label={FORM_LABELS.DAY}
                  value={donorData.dia}
                  onChange={(e) => handleInputChange("dia", e.target.value)}
                  readOnly={uiState.edit}
                  disabled={donorData.tipo !== DONOR_TYPES.MONTHLY}
                  style={{ width: "100%", maxWidth: 100 }}
                />

                <FormDonorInput
                  label={FORM_LABELS.FEE}
                  value={donorData.mensalidade}
                  onChange={(e) =>
                    handleInputChange("mensalidade", e.target.value)
                  }
                  readOnly={uiState.edit}
                  disabled={donorData.tipo != DONOR_TYPES.MONTHLY}
                  style={{ width: "100%", maxWidth: 100 }}
                />

                <FormDonorInput
                  label={FORM_LABELS.AVERAGE}
                  value={donorData.media}
                  onChange={(e) => handleInputChange("media", e.target.value)}
                  readOnly={uiState.edit}
                  disabled={donorData.tipo !== DONOR_TYPES.MONTHLY}
                  style={{ width: "100%", maxWidth: 100 }}
                />
              </div>
            </div>
            )} 

            {/* Observações */}
            <div className={styles.donorSection}>
              <h4>Observações e Referências</h4>
              <div className={styles.formRow}>
                <FormTextArea
                  label={FORM_LABELS.OBSERVATION}
                  value={donorData.observacao}
                  onChange={(e) =>
                    handleInputChange("observacao", e.target.value)
                  }
                  readOnly={uiState.edit}
                  name="observacao"
                />
                <FormTextArea
                label={FORM_LABELS.REFERENCE}
                value={donorData.referencia}
                onChange={(e) =>
                  handleInputChange("referencia", e.target.value)
                }
                readOnly={uiState.edit}
                name="referencia"
                />
              </div>

              
            </div>
          </form>
        </div>
        {uiState.showBtn && (
          <TabNavigation
            tabs={[
              {
                id: "donations",
                label: "Doações",
                icon: <FaTable />,
                content: (
                  <TableDonor
                    idDonor={id}
                    modalShow={uiState.modalShow}
                    setModalEdit={(showEdit) =>
                      setUiState((prev) => ({ ...prev, modalEdit: true }))
                    }
                    setDonation={setDonation}
                    modalEdit={uiState.modalEdit}
                  />
                ),
              },
              {
                id: "history",
                label: "Histórico de Ações",
                icon: <FaHistory />,
                content: <DonorActivityHistory donorId={id} />,
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}
      </div>

      {uiState.modalShow && (
        <ModalDonation
          modalShow={uiState.modalShow}
          setModalShow={(show) =>
            setUiState((prev) => ({ ...prev, modalShow: show }))
          }
          mensalidade={donorData.mensalidade}
          tipo={donorData.tipo}
          donor_id={id}
        />
      )}
      {uiState.modalEdit && (
        <ModalEditDonation
          setModalEdit={(showEdit) =>
            setUiState((prev) => ({ ...prev, modalEdit: showEdit }))
          }
          donation={donation}
          donorData={donorData}
          idDonor={id}
        />
      )}
      {uiState.modalSendEmail && (
        <ModalSendEmail
          donor_email={donorData.email}
          donor_name={donorData.nome}
          setModalSendEmail={(show) =>
            setUiState((prev) => ({ ...prev, modalSendEmail: show }))
          }
        />
      )}
      {uiState.modalSchedule && (
        <ModalScheduleDonor
          isOpen={uiState.modalSchedule}
          onClose={() =>
            setUiState((prev) => ({ ...prev, modalSchedule: false }))
          }
          donorId={id}
        />
      )}
      {uiState.modalCreateTask && (
        <ModalCreateTask
          isOpen={uiState.modalCreateTask}
          onClose={() =>
            setUiState((prev) => ({ ...prev, modalCreateTask: false }))
          }
          donorId={id}
          donorName={donorData.nome}
        />
      )}
      {voipModal.open && (
        <div className={styles.callPopupOverlay}>
          <div className={styles.callPopup}>
            <div className={styles.callPopupHeader}>
              <h3>Ligação WebRTC</h3>
              <button
                type="button"
                className={styles.callPopupClose}
                onClick={() => {
                  clearVoipAutoCloseTimer();
                  terminateVoipSession();
                  voipSessionRef.current = null;
                  setVoipCanHangup(false);
                  stopVoipCallDuration();
                  setVoipModal({ open: false, phone: "" });
                }}
                aria-label="Fechar modal de ligação"
              >
                ×
              </button>
            </div>
            <div className={styles.callPopupContent}>
              <p className={styles.callPopupPhone}>Número: {voipModal.phone || "—"}</p>
              <div className={styles.voipCallDurationRow}>
                <strong>Duração:</strong>{" "}
                <span className={styles.voipCallDurationValue}>
                  {voipDurationActive || voipCallDurationSec > 0
                    ? formatVoipDuration(voipCallDurationSec)
                    : "—"}
                </span>
              </div>
              <div className={styles.voipStatusBox}>
                <strong>Status SIP/WebRTC:</strong>{" "}
                <span className={`${styles.voipStatusPill} ${styles[`voipStatus_${voipUaStatus}`]}`}>
                  {voipStatusLabel}
                </span>
              </div>
              {voipLastError && (
                <div className={styles.voipErrorBox}>
                  <strong>Ultimo erro VoIP:</strong> {voipLastError}
                </div>
              )}
              <div className={styles.voipCallStatusBox}>
                <strong>Status da chamada:</strong> {voipCallStatus}
              </div>
              <div className={styles.voipModalActions}>
                <button
                  type="button"
                  className={styles.voipHangupBtn}
                  onClick={handleVoipHangupClick}
                  disabled={!voipCanHangup || voipCallLoadingKey !== null}
                >
                  Encerrar ou cancelar chamada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Donor;
