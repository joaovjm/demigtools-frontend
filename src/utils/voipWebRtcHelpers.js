export function sipResponseSummary(sipMsg) {
  if (!sipMsg || typeof sipMsg !== "object") return "";
  const code = sipMsg.status_code;
  if (code == null || code === "") return "";
  const phrase = sipMsg.reason_phrase != null ? String(sipMsg.reason_phrase).trim() : "";
  return phrase ? `SIP ${code} ${phrase}` : `SIP ${code}`;
}

export function getVoipErrorMessage(eventOrError) {
  if (!eventOrError) return "Erro desconhecido";
  if (typeof eventOrError === "string") return eventOrError;
  if (eventOrError instanceof Error) {
    return eventOrError.message || "Erro desconhecido";
  }

  const cause = eventOrError.cause != null ? String(eventOrError.cause) : "";
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

export function formatVoipClockTime(d = new Date()) {
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatVoipDuration(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function voipCallStatusWithTimestamp(text) {
  return `[${formatVoipClockTime()}] ${text}`;
}

export const VOIP_UA_STATUS_LABELS = {
  idle: "Idle",
  configured: "Configurado",
  not_configured: "Nao configurado",
  connecting: "Conectando",
  connected: "Conectado",
  registered: "Registrado",
  registration_failed: "Falha de registro",
  disconnected: "Desconectado",
  error: "Erro",
};
