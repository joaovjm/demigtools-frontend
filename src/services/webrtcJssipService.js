import JsSIPModule from "jssip";

let ua = null;
let currentConfigKey = "";
let currentState = "idle";
let loadPromise = null;

/** Tempo máximo só para o WebSocket SIP abrir (antes do REGISTER terminar). */
const SIP_WS_CONNECT_TIMEOUT_MS = 20000;
/**
 * Depois que o WebSocket está OK, espera no máximo isto pelo 200 do REGISTER.
 * Se o PBX demorar muito só no REGISTER, ainda assim tentamos o INVITE — em muitos
 * Asterisk+pjsip o INVITE segue no mesmo transporte sem precisar bloquear ~40s.
 */
const REGISTER_POST_CONNECT_GRACE_MS = 4000;

/** CDNs só como fallback; sem timeout cada URL pode travar ~10–15s se a rede bloquear. */
const JSSIP_SCRIPT_TIMEOUT_MS = 6000;
const JSSIP_SOURCES = [
  "https://cdn.jsdelivr.net/npm/jssip@3.10.1/dist/jssip.min.js",
  "https://unpkg.com/jssip@3.10.1/dist/jssip.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jssip/3.10.1/jssip.min.js",
];

function getGlobalJssip() {
  if (typeof window === "undefined") return null;
  return window.JsSIP || null;
}

function getBundledJssip() {
  const candidate = JsSIPModule?.default ?? JsSIPModule;
  if (
    candidate &&
    typeof candidate.UA === "function" &&
    typeof candidate.WebSocketInterface === "function"
  ) {
    return candidate;
  }
  return null;
}

function appendScriptWithTimeout(src, timeoutMs) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      try {
        script.onload = null;
        script.onerror = null;
        script.remove();
      } catch {
        // ignora
      }
      reject(new Error(`Timeout (${timeoutMs}ms) ao carregar ${src}`));
    }, timeoutMs);
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error(`Falha ao carregar ${src}`));
    };
    script.src = src;
    document.head.appendChild(script);
  });
}

function loadJssipFromCdn() {
  const bundled = getBundledJssip();
  if (bundled) return Promise.resolve(bundled);
  if (getGlobalJssip()) return Promise.resolve(getGlobalJssip());
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      for (const src of JSSIP_SOURCES) {
        try {
          await appendScriptWithTimeout(src, JSSIP_SCRIPT_TIMEOUT_MS);
          const lib = getGlobalJssip();
          if (lib) return lib;
        } catch {
          // tenta a próxima origem
        }
      }
      throw new Error(
        "Não foi possível carregar JsSIP pelos CDNs. O pacote npm 'jssip' deveria vir no bundle; verifique o build ou a rede."
      );
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

function normalizeIceServers(servers) {
  if (!Array.isArray(servers)) return [];
  return servers
    .map((s) => {
      if (typeof s === "string") return { urls: s };
      if (s && typeof s === "object" && s.urls) return s;
      return null;
    })
    .filter(Boolean);
}

function buildDisplayName(template, operatorData, sipUser) {
  const src = String(template || "").trim();
  if (!src) return operatorData?.operator_name || sipUser;
  return src
    .replace(/\{operator_name\}/g, operatorData?.operator_name || "")
    .replace(/\{operator_code_id\}/g, String(operatorData?.operator_code_id || ""))
    .replace(/\{sip_user\}/g, sipUser || "");
}

export function getWebrtcUaState() {
  return currentState;
}

/**
 * Reproduz o áudio remoto no elemento informado. Sem isso, o microfone envia mas o
 * navegador não toca a voz da outra parte (stream recebido no RTCPeerConnection).
 * @param {object | null | undefined} session instância RTCSession do JsSIP
 * @param {HTMLAudioElement | null | undefined} audioElement
 * @returns {() => void} função para remover listeners e limpar srcObject
 */
export function attachJssipRemoteAudioToElement(session, audioElement) {
  if (!session || !audioElement) {
    return () => {};
  }

  const cleaners = [];
  const wiredPeerConnections = new WeakSet();

  const tryPlay = () => {
    const p = audioElement.play?.();
    if (p && typeof p.catch === "function") {
      p.catch(() => {});
    }
  };

  const setRemoteStream = (stream) => {
    if (!stream) return;
    audioElement.srcObject = stream;
    tryPlay();
  };

  const wirePeerConnection = (pc) => {
    if (!pc || typeof pc.addEventListener !== "function") return;
    if (wiredPeerConnections.has(pc)) return;
    wiredPeerConnections.add(pc);

    const onTrack = (e) => {
      const track = e.track;
      if (!track || track.kind !== "audio") return;
      const stream =
        (e.streams && e.streams[0]) || (typeof MediaStream === "function" ? new MediaStream([track]) : null);
      if (stream) setRemoteStream(stream);
    };

    pc.addEventListener("track", onTrack);
    cleaners.push(() => pc.removeEventListener("track", onTrack));

    try {
      const receivers = typeof pc.getReceivers === "function" ? pc.getReceivers() : [];
      const audioTracks = receivers
        .map((r) => r.track)
        .filter((t) => t && t.kind === "audio" && t.readyState !== "ended");
      if (audioTracks.length) {
        setRemoteStream(new MediaStream(audioTracks));
      }
    } catch {
      // ignora
    }
  };

  const initialPc = session.connection;
  if (initialPc) wirePeerConnection(initialPc);

  const onPeerconnection = (data) => {
    if (data?.peerconnection) wirePeerConnection(data.peerconnection);
  };
  session.on("peerconnection", onPeerconnection);
  cleaners.push(() => {
    try {
      if (typeof session.removeListener === "function") {
        session.removeListener("peerconnection", onPeerconnection);
      }
    } catch {
      // ignora
    }
  });

  return () => {
    cleaners.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignora
      }
    });
    try {
      audioElement.srcObject = null;
    } catch {
      // ignora
    }
  };
}

function waitForSocketConnected(userAgent, timeoutMs) {
  if (typeof userAgent?.isConnected === "function" && userAgent.isConnected()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let done = false;
    let timer = null;

    const cleanup = () => {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
      try {
        userAgent.removeListener("connected", onConnected);
        userAgent.removeListener("disconnected", onDisconnected);
        userAgent.removeListener("registrationFailed", onRegistrationFailed);
      } catch {
        // ignora
      }
    };

    const finishOk = () => {
      if (done) return;
      done = true;
      cleanup();
      resolve();
    };
    const finishErr = (message) => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error(message));
    };

    const onConnected = () => finishOk();
    const onDisconnected = (event) => {
      finishErr(`WebSocket SIP desconectado: ${event?.cause || "motivo desconhecido"}`);
    };
    const onRegistrationFailed = (event) => {
      finishErr(`Falha no registro SIP: ${event?.cause || "motivo desconhecido"}`);
    };

    timer = setTimeout(() => {
      timer = null;
      const conn = typeof userAgent?.isConnected === "function" ? userAgent.isConnected() : false;
      finishErr(
        `Timeout (${timeoutMs}ms) ao abrir WebSocket SIP (ws_url). ws_conectado=${conn}. Verifique rede, firewall e se a URL usa wss na mesma origem do site.`
      );
    }, timeoutMs);

    userAgent.on("connected", onConnected);
    userAgent.on("disconnected", onDisconnected);
    userAgent.on("registrationFailed", onRegistrationFailed);

    queueMicrotask(() => {
      if (typeof userAgent.isConnected === "function" && userAgent.isConnected()) {
        finishOk();
      }
    });
  });
}

/**
 * Garante transporte SIP (WebSocket) pronto; REGISTER 200 é desejável mas não pode
 * segurar a UI dezenas de segundos em cenários onde o INVITE já seria aceito.
 */
function waitForRegisteredOrGrace(userAgent, graceMs) {
  if (typeof userAgent?.isRegistered === "function" && userAgent.isRegistered()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let done = false;
    let graceTimer = null;

    const cleanup = () => {
      if (graceTimer != null) {
        clearTimeout(graceTimer);
        graceTimer = null;
      }
      try {
        userAgent.removeListener("registered", onRegistered);
        userAgent.removeListener("registrationFailed", onRegistrationFailed);
        userAgent.removeListener("disconnected", onDisconnected);
      } catch {
        // ignora
      }
    };

    const finishOk = () => {
      if (done) return;
      done = true;
      cleanup();
      resolve();
    };
    const finishErr = (message) => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error(message));
    };

    const onRegistered = () => finishOk();
    const onRegistrationFailed = (event) => {
      finishErr(`Falha no registro SIP: ${event?.cause || "motivo desconhecido"}`);
    };
    const onDisconnected = (event) => {
      finishErr(`WebSocket SIP desconectado: ${event?.cause || "motivo desconhecido"}`);
    };

    graceTimer = setTimeout(() => {
      graceTimer = null;
      finishOk();
    }, graceMs);

    userAgent.on("registered", onRegistered);
    userAgent.on("registrationFailed", onRegistrationFailed);
    userAgent.on("disconnected", onDisconnected);

    queueMicrotask(() => {
      if (typeof userAgent.isRegistered === "function" && userAgent.isRegistered()) {
        finishOk();
      }
    });
  });
}

async function waitForUaReady(userAgent) {
  if (typeof userAgent?.isRegistered === "function" && userAgent.isRegistered()) {
    return;
  }

  await waitForSocketConnected(userAgent, SIP_WS_CONNECT_TIMEOUT_MS);

  if (typeof userAgent?.isRegistered === "function" && userAgent.isRegistered()) {
    return;
  }

  await waitForRegisteredOrGrace(userAgent, REGISTER_POST_CONNECT_GRACE_MS);
}

export async function ensureWebrtcUa(config, operatorData) {
  const JsSIP = await loadJssipFromCdn();

  const sipUser = String(config?.sip_user || "").trim();
  const sipPassword = String(config?.sip_password || "");
  const sipDomain = String(config?.sip_domain || "").trim();
  const wsUrl = String(config?.ws_url || "").trim();
  const registerExpires = Number(config?.register_expires) || 300;
  const displayName = buildDisplayName(config?.display_name_template, operatorData, sipUser);

  if (!sipUser || !sipPassword || !sipDomain || !wsUrl) {
    throw new Error("Configuração WebRTC incompleta para este operador.");
  }

  // Não incluir displayName: quando operatorData chega depois o nome muda e recriar o UA
  // força novo WebSocket + REGISTER (~dezenas de segundos) sem necessidade.
  const configKey = `${sipUser}|${sipDomain}|${wsUrl}|${registerExpires}`;
  if (ua && currentConfigKey === configKey) return ua;

  if (ua) {
    try {
      ua.stop();
    } catch {
      // ignora erro de encerramento
    }
  }

  const socket = new JsSIP.WebSocketInterface(wsUrl);
  ua = new JsSIP.UA({
    sockets: [socket],
    uri: `sip:${sipUser}@${sipDomain}`,
    password: sipPassword,
    display_name: displayName,
    session_timers: false,
    register: true,
    register_expires: registerExpires,
    // Padrão JsSIP: até 30s entre tentativas de reconexão WebSocket — reduz a sensação de “travou”.
    connection_recovery_min_interval: 1,
    connection_recovery_max_interval: 5,
  });

  currentConfigKey = configKey;
  currentState = "connecting";
  ua.on("connected", () => {
    currentState = "connected";
  });
  ua.on("registered", () => {
    currentState = "registered";
  });
  ua.on("registrationFailed", () => {
    currentState = "registration_failed";
  });
  ua.on("disconnected", () => {
    currentState = "disconnected";
  });
  ua.start();
  return ua;
}

/**
 * @param {object} handlers
 * @param {{ mediaStream?: MediaStream, mediaStreamPromise?: Promise<MediaStream> }} [mediaOptions]
 */
export function callWithWebrtcUa(config, phoneDigits, operatorData, handlers = {}, mediaOptions = {}) {
  const rawDigits = String(phoneDigits || "").replace(/\D/g, "");
  if (!rawDigits || rawDigits.length < 8) {
    throw new Error("Telefone inválido para chamada.");
  }
  const dialPrefix = String(config?.dial_prefix || "").replace(/\D/g, "");
  const fullNumber = `${dialPrefix}${rawDigits}`;
  const targetTemplate =
    String(config?.target_template || "").trim() || "sip:{number}@{sip_domain}";
  const targetUri = targetTemplate
    .replace(/\{number\}/g, fullNumber)
    .replace(/\{raw_number\}/g, rawDigits)
    .replace(/\{sip_domain\}/g, String(config?.sip_domain || "").trim());

  if (!/^sip:/i.test(targetUri)) {
    throw new Error("Template WebRTC invalido: deve gerar URI SIP (ex.: sip:{number}@{sip_domain})");
  }

  const micPromise =
    mediaOptions?.mediaStream != null
      ? Promise.resolve(mediaOptions.mediaStream)
      : mediaOptions?.mediaStreamPromise != null
        ? mediaOptions.mediaStreamPromise
        : typeof navigator !== "undefined" && navigator.mediaDevices
          ? navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          : Promise.reject(new Error("MediaDevices indisponível."));

  const stopMicTracks = (stream) => {
    stream?.getTracks?.().forEach((t) => {
      try {
        t.stop();
      } catch {
        // ignora
      }
    });
  };

  // Antes: Promise.all([ensure, mic]) e só depois waitForUaReady → tempo = max(ensure,mic) + wait (série).
  // Agora: ensure; em seguida waitForUaReady e microfone em paralelo (mic já pode ter começado no clique).
  return ensureWebrtcUa(config, operatorData)
    .catch((err) => {
      micPromise.then(stopMicTracks).catch(() => {});
      throw err;
    })
    .then(async (userAgent) => {
      if (handlers?.onUaState) handlers.onUaState(currentState);

      userAgent.on("registrationFailed", (event) => {
        if (handlers?.onUaRegistrationFailed) handlers.onUaRegistrationFailed(event);
      });
      userAgent.on("disconnected", (event) => {
        if (handlers?.onUaDisconnected) handlers.onUaDisconnected(event);
      });

      let micStream;
      try {
        const [, stream] = await Promise.all([waitForUaReady(userAgent), micPromise]);
        micStream = stream;
      } catch (e) {
        micPromise.then(stopMicTracks).catch(() => {});
        throw e;
      }

      const iceServers = normalizeIceServers(config?.ice_servers);
      console.log('UA conectado?', userAgent.isConnected());
      console.log('UA registrado?', userAgent.isRegistered());
      const session = userAgent.call(targetUri, {
        mediaStream: micStream,
        mediaConstraints: { audio: true, video: false },
        rtcOfferConstraints: {
          offerToReceiveAudio: 1,
          offerToReceiveVideo: 0,
        },
        pcConfig: {
          iceServers,
          bundlePolicy: "max-bundle",
          rtcpMuxPolicy: "require",
        },
        eventHandlers: {
          peerconnection: (event) => {
            const pc = event.peerconnection;
            console.log('ICE gathering state:', pc.iceGatheringState);
            pc.onicegatheringstatechange = () => {
              console.log('ICE state mudou:', pc.iceGatheringState, new Date().toISOString());
            };
            pc.onicecandidate = (e) => {
              console.log('Candidate:', e.candidate?.type, e.candidate?.address);
            };
          },
        },
      });
      // Registrar na mesma volta de event loop para não perder 180/200 muito rápidos.
      if (handlers?.onProgress) session.on("progress", (event) => handlers.onProgress(event));
      if (handlers?.onAccepted) session.on("accepted", (event) => handlers.onAccepted(event));
      if (handlers?.onConfirmed) session.on("confirmed", (event) => handlers.onConfirmed(event, session));
      if (handlers?.onEnded) session.on("ended", (event) => handlers.onEnded(event));
      if (handlers?.onFailed) session.on("failed", (event) => handlers.onFailed(event));
      return session;
    });
}
