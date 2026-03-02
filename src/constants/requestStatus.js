/**
 * Constantes de Status de Requisição
 * Define todos os status possíveis para uma requisição
 */

export const REQUEST_STATUS = {
  NA: 'NA',
  NP: 'NP',
  AGENDADO: 'Agendado',
  WHATSAPP: 'Whatsapp',
  EMAIL: 'Email',
  SUCESSO: 'Sucesso',
  RECEBIDO: 'Recebido',
};

/**
 * Labels amigáveis para exibição dos status
 */
export const STATUS_LABELS = {
  [REQUEST_STATUS.NA]: 'Não Atendeu',
  [REQUEST_STATUS.NP]: 'Não Pode Ajudar',
  [REQUEST_STATUS.AGENDADO]: 'Agendado',
  [REQUEST_STATUS.WHATSAPP]: 'WhatsApp',
  [REQUEST_STATUS.EMAIL]: 'Email',
  [REQUEST_STATUS.SUCESSO]: 'Sucesso',
  [REQUEST_STATUS.RECEBIDO]: 'Recebido',
};

/**
 * Status que quando selecionado substitui todos os outros
 */
export const EXCLUSIVE_STATUS = [REQUEST_STATUS.AGENDADO];

/**
 * Lista de todos os status disponíveis para seleção
 */
export const AVAILABLE_STATUS = [
  { value: REQUEST_STATUS.NA, label: STATUS_LABELS[REQUEST_STATUS.NA] },
  { value: REQUEST_STATUS.NP, label: STATUS_LABELS[REQUEST_STATUS.NP] },
  { value: REQUEST_STATUS.AGENDADO, label: STATUS_LABELS[REQUEST_STATUS.AGENDADO] },
  { value: REQUEST_STATUS.WHATSAPP, label: STATUS_LABELS[REQUEST_STATUS.WHATSAPP] },
  { value: REQUEST_STATUS.EMAIL, label: STATUS_LABELS[REQUEST_STATUS.EMAIL] },
];

/**
 * Classes CSS para cada status
 */
export const STATUS_CLASSES = {
  [REQUEST_STATUS.NA]: 'statusNa',
  [REQUEST_STATUS.NP]: 'statusNp',
  [REQUEST_STATUS.AGENDADO]: 'statusScheduled',
  [REQUEST_STATUS.WHATSAPP]: 'statusWhatsapp',
  [REQUEST_STATUS.SUCESSO]: 'statusSuccess',
  [REQUEST_STATUS.RECEBIDO]: 'statusReceived',
  [REQUEST_STATUS.EMAIL]: 'statusEmail',
};
