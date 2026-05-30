import { REQUEST_STATUS, EXCLUSIVE_STATUS, STATUS_LABELS } from '../constants/requestStatus';

/**
 * Converte o status do formato antigo (string) para o novo formato (array)
 * @param {string|array} status - Status no formato antigo ou novo
 * @returns {array} - Array de status
 */
export const normalizeStatus = (status) => {
  if (!status) return [];
  if (Array.isArray(status)) return status;
  if (typeof status === 'string') return [status];
  return [];
};

/**
 * Adiciona um novo status à lista de status existentes
 * Se o novo status for exclusivo (ex: Agendado), substitui todos os outros
 * Se já existir um status exclusivo, remove-o antes de adicionar o novo
 * @param {array} currentStatuses - Array de status atuais
 * @param {string} newStatus - Novo status a ser adicionado
 * @returns {array} - Novo array de status
 */
export const addStatus = (currentStatuses, newStatus) => {
  const statuses = normalizeStatus(currentStatuses);
  
  // Se o novo status for exclusivo (Agendado), retorna apenas ele
  if (EXCLUSIVE_STATUS.includes(newStatus)) {
    return [newStatus];
  }
  
  // Remove status exclusivos existentes antes de adicionar o novo
  const filteredStatuses = statuses.filter(
    status => !EXCLUSIVE_STATUS.includes(status)
  );
  
  // Adiciona o novo status se ainda não existir
  if (!filteredStatuses.includes(newStatus)) {
    return [...filteredStatuses, newStatus];
  }
  
  return filteredStatuses;
};

/**
 * Remove um status da lista de status existentes
 * @param {array} currentStatuses - Array de status atuais
 * @param {string} statusToRemove - Status a ser removido
 * @returns {array} - Novo array de status
 */
export const removeStatus = (currentStatuses, statusToRemove) => {
  const statuses = normalizeStatus(currentStatuses);
  return statuses.filter(status => status !== statusToRemove);
};

/**
 * Verifica se um status está presente na lista
 * @param {array} currentStatuses - Array de status atuais
 * @param {string} statusToCheck - Status a verificar
 * @returns {boolean} - True se o status está presente
 */
export const hasStatus = (currentStatuses, statusToCheck) => {
  const statuses = normalizeStatus(currentStatuses);
  return statuses.includes(statusToCheck);
};

/**
 * Atualiza a lista de status baseado na seleção/desseleção de um status
 * @param {array} currentStatuses - Array de status atuais
 * @param {string} toggledStatus - Status que foi selecionado/desselecionado
 * @returns {array} - Novo array de status
 */
export const toggleStatus = (currentStatuses, toggledStatus) => {
  const statuses = normalizeStatus(currentStatuses);
  
  if (hasStatus(statuses, toggledStatus)) {
    return removeStatus(statuses, toggledStatus);
  } else {
    return addStatus(statuses, toggledStatus);
  }
};

/**
 * Formata o array de status para exibição na UI
 * @param {array} statuses - Array de status
 * @returns {string} - String formatada para exibição
 */
export const formatStatusForDisplay = (statuses) => {
  const normalizedStatuses = normalizeStatus(statuses);
  
  if (normalizedStatuses.length === 0) {
    return '';
  }
  
  return normalizedStatuses
    .map(status => STATUS_LABELS[status] || status)
    .join(', ');
};

/**
 * Verifica se uma lista de requisições corresponde ao filtro de status
 * @param {array} requestStatuses - Status da requisição
 * @param {string} filterStatus - Status do filtro
 * @returns {boolean} - True se corresponde ao filtro
 */
export const matchesStatusFilter = (requestStatuses, filterStatus) => {
  const statuses = normalizeStatus(requestStatuses);
  
  if (!filterStatus) return true;
  
  if (filterStatus === 'Não visitado') {
    return statuses.length === 0;
  }
  
  return statuses.includes(filterStatus);
};

/**
 * Obtém a classe CSS prioritária para exibição baseada nos status
 * Prioridade: Agendado > Sucesso > Recebido > Whatsapp > NA > NP
 * @param {array} statuses - Array de status
 * @returns {string} - Nome da classe CSS
 */
export const getPriorityStatusClass = (statuses) => {
  const normalizedStatuses = normalizeStatus(statuses);
  
  if (normalizedStatuses.length === 0) return '';
  
  const priority = [
    REQUEST_STATUS.AGENDADO,
    REQUEST_STATUS.SUCESSO,
    REQUEST_STATUS.RECEBIDO,
    REQUEST_STATUS.WHATSAPP,
    REQUEST_STATUS.NA,
    REQUEST_STATUS.NP,
  ];
  
  for (const priorityStatus of priority) {
    if (normalizedStatuses.includes(priorityStatus)) {
      return priorityStatus;
    }
  }
  
  return normalizedStatuses[0];
};
