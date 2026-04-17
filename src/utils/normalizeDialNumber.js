/**
 * Extrai apenas dígitos para discagem SIP/PSTN (Brasil).
 * Remove formatação; não adiciona código do país automaticamente.
 */
export function normalizeDialNumber(raw) {
  if (raw == null) return "";
  const d = String(raw).replace(/\D/g, "");
  return d;
}

export function buildSipUri(digits, sipHost) {
  const n = normalizeDialNumber(digits);
  if (!n || !sipHost) return null;
  return `sip:${n}@${sipHost}`;
}
