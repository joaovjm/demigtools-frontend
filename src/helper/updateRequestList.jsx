import supabase from "./superBaseClient";
import { REQUEST_STATUS } from '../constants/requestStatus';

/**
 * Atualiza uma requisição com informações de agendamento
 * Status Agendado é exclusivo e substitui qualquer outro status existente
 * @param {object} params - Parâmetros de agendamento
 * @param {number} params.id - ID da requisição
 * @param {string} params.observationScheduling - Observação do agendamento
 * @param {string} params.dateScheduling - Data do agendamento
 * @param {string} params.telScheduling - Telefone usado no agendamento
 * @returns {object} - Dados atualizados
 */
export async function updateRequestList({ 
  id, 
  observationScheduling, 
  dateScheduling, 
  telScheduling 
}) {
  try {
    const { data, error } = await supabase
      .from("request")
      .update({
        request_status: [REQUEST_STATUS.AGENDADO], // Status Agendado sempre como array único
        request_scheduled_date: dateScheduling,
        request_observation: observationScheduling,
        request_tel_success: telScheduling
      })
      .eq("id", id)
      .select();
      
    if (error) throw error;
    if (!error) return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}
