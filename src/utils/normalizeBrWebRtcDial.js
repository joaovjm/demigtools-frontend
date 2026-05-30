/**
 * Normaliza número para discagem WebRTC no padrão Brasil (55 + DDD + assinante).
 * @param {string} rawInput telefone com ou sem máscara
 * @param {string} defaultDddRaw DDD padrão (2 dígitos), ex.: "21"
 * @returns {string|null} só dígitos começando em 55, ou null se faltar DDD configurado quando necessário
 */
export function normalizeBrWebRtcDial(rawInput, defaultDddRaw) {
  let d = String(rawInput || "").replace(/\D/g, "");
  const ddd = String(defaultDddRaw || "")
    .replace(/\D/g, "")
    .slice(0, 2);

  while (d.startsWith("0")) d = d.slice(1);
  if (!d) return null;

  const hasDdd = () => ddd.length === 2;

  if (d.startsWith("55")) {
    const rest = d.slice(2);
    if (!rest) return null;
    if (rest.length >= 10 && rest.length <= 11) return `55${rest}`;
    if (rest.length === 8 || rest.length === 9) {
      if (!hasDdd()) return null;
      return `55${ddd}${rest}`;
    }
    if (rest.length >= 12) return `55${rest}`;
    if (!hasDdd()) return null;
    return `55${ddd}${rest}`;
  }

  if (d.length === 10 || d.length === 11) return `55${d}`;
  if (d.length === 8 || d.length === 9) {
    if (!hasDdd()) return null;
    return `55${ddd}${d}`;
  }

  return null;
}
