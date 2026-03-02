/**
 * Formata número de telefone para o padrão internacional do WhatsApp
 * @param {string} phoneNumber - Número de telefone
 * @returns {string} - Número formatado (+5511999999999)
 */
export function formatPhoneForWhatsApp(phoneNumber) {
  if (!phoneNumber) return null;

  // Remove todos os caracteres não numéricos
  let cleanNumber = phoneNumber.toString().replace(/\D/g, '');
  
  // Se já tem o código do país (Brasil = 55), adiciona apenas o +
  if (cleanNumber.startsWith('55') && cleanNumber.length >= 12) {
    return '+' + cleanNumber;
  }
  
  // Se não tem código do país, adiciona +55 (Brasil)
  if (cleanNumber.length >= 10) {
    return '+55' + cleanNumber;
  }
  
  // Se o número for muito curto, retorna null
  return null;
}

/**
 * Valida se o número de telefone está no formato correto
 * @param {string} phoneNumber - Número de telefone
 * @returns {boolean} - True se válido
 */
export function isValidPhoneNumber(phoneNumber) {
  if (!phoneNumber) return false;
  
  const formatted = formatPhoneForWhatsApp(phoneNumber);
  if (!formatted) return false;
  
  // Verifica se tem entre 13 e 15 dígitos (incluindo +55)
  const digits = formatted.replace(/\D/g, '');
  return digits.length >= 12 && digits.length <= 15;
}
