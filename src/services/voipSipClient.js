import JsSIP from "jssip";
import { fetchVoipClientConfig } from "../api/voipApi.js";
import { buildSipUri } from "../utils/normalizeDialNumber.js";

if (import.meta.env.PROD) {
  JsSIP.debug.disableAll();
}

function parseIceServers(stunUrls) {
  if (!stunUrls || typeof stunUrls !== "string") return [{ urls: "stun:stun.l.google.com:19302" }];
  const parts = stunUrls
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return [{ urls: "stun:stun.l.google.com:19302" }];
  return parts.map((urls) => ({ urls }));
}

/** Opções de RTCPeerConnection alinhadas ao uso com Asterisk/FreePBX (bundle + rtcp-mux). */
function rtcPeerConnectionConfig(iceServers) {
  return {
    iceServers,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
  };
}

function resolveSipWebSocketUrl(rawUrl) {
  const url = String(rawUrl || "").trim();
  if (!url) return url;
  if (window.location.protocol === "https:" && url.startsWith("ws://")) {
    return `wss://${url.slice(5)}`;
  }
  return url;
}

let ua = null;
let currentOperatorId = null;
let registerPromise = null;
let activeSession = null;

function stopUa() {
  if (activeSession && !activeSession.isEnded()) {
    try {
      activeSession.terminate();
    } catch {
      /* ignore */
    }
  }
  activeSession = null;
  if (ua) {
    try {
      ua.stop();
    } catch {
      /* ignore */
    }
  }
  ua = null;
  registerPromise = null;
  currentOperatorId = null;
}

function createUa(config) {
  const wsUrl = resolveSipWebSocketUrl(config.wssUrl);
  const socket = new JsSIP.WebSocketInterface(wsUrl);

  const uri = `sip:${config.sipUser}@${config.sipHost}`;
  return new JsSIP.UA({
    sockets: [socket],
    uri,
    password: config.sipPassword,
    display_name: config.displayName || config.sipUser,
    session_timers: false,
    register: true,
    connection_recovery_max_interval: 30,
    connection_recovery_min_interval: 2,
  });
}

function waitUntilRegistered(instance) {
  return new Promise((resolve, reject) => {
    const ms = 18000;
    const timer = setTimeout(() => {
      reject(new Error("Tempo esgotado ao registrar no PBX"));
    }, ms);

    const done = (fn) => {
      clearTimeout(timer);
      fn();
    };

    instance.once("registered", () => done(() => resolve()));
    instance.once("registrationFailed", (e) =>
      done(() => reject(new Error(e?.cause || "Falha no registro SIP")))
    );
  });
}

/**
 * Garante UA registrado para o operador (recria se mudar o operador).
 */
export async function ensureVoipRegistered(operatorCodeId) {
  const oid = Number(operatorCodeId);
  if (!Number.isFinite(oid)) throw new Error("Operador inválido");

  const envelope = await fetchVoipClientConfig(oid);
  if (!envelope?.success || !envelope?.data) {
    const d = envelope?.data;
    throw new Error(d?.message || envelope?.message || "Não foi possível obter configuração VoIP");
  }
  const cfg = envelope.data;

  if (currentOperatorId === oid && ua && registerPromise) {
    await registerPromise;
    return cfg;
  }

  stopUa();
  currentOperatorId = oid;

  ua = createUa(cfg);
  registerPromise = new Promise((resolve, reject) => {
    ua.on("disconnected", () => {
      /* reconexão automática do JsSIP */
    });
    ua.start();
    waitUntilRegistered(ua).then(resolve).catch(reject);
  });

  await registerPromise;
  return cfg;
}

export function hangupVoipCall() {
  if (activeSession && !activeSession.isEnded()) {
    try {
      activeSession.terminate();
    } catch {
      /* ignore */
    }
  }
  activeSession = null;
}

/**
 * Inicia chamada de voz para o número informado (usa host SIP da API).
 */
export async function placeVoipCall(operatorCodeId, phoneRaw) {
  const cfg = await ensureVoipRegistered(operatorCodeId);
  const target = buildSipUri(phoneRaw, cfg.sipHost);
  if (!target) throw new Error("Número inválido");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
  } catch (err) {
    const code = err?.name || err?.message || "";
    if (code === "NotAllowedError" || code === "PermissionDeniedError") {
      throw new Error("Acesso ao microfone negado. Libere a permissão do navegador para realizar chamadas.");
    }
    if (code === "NotFoundError" || code === "DevicesNotFoundError") {
      throw new Error("Nenhum microfone encontrado. Conecte um dispositivo de áudio e tente novamente.");
    }
    throw new Error("Não foi possível acessar o microfone para iniciar a chamada.");
  }

  hangupVoipCall();

  const iceServers = parseIceServers(cfg.stunUrls);

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (ok, val) => {
      if (settled) return;
      settled = true;
      if (ok) resolve(val);
      else reject(val);
    };
    const finishSuccess = (state) => finish(true, { session, state });

    const session = ua.call(target, {
      mediaConstraints: { audio: true, video: false },
      pcConfig: rtcPeerConnectionConfig(iceServers),
      eventHandlers: {
        failed: (e) => {
          activeSession = null;
          finish(false, new Error(e?.cause || "Chamada falhou"));
        },
        ended: () => {
          activeSession = null;
        },
      },
    });
    activeSession = session;
    session.once("progress", () => finishSuccess("calling"));
    session.once("accepted", () => finishSuccess("answered"));
    session.once("confirmed", () => finishSuccess("answered"));
    setTimeout(() => finishSuccess("calling"), 400);
  });
}

export function getVoipActiveSession() {
  return activeSession;
}

export function disposeVoipClient() {
  stopUa();
}
