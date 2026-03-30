import { updateWorklistRequestSchedule } from "../api/worklistApi.js";

/**
 * Atualiza uma requisição com informações de agendamento
 * Status Agendado é exclusivo e substitui qualquer outro status existente
 */
export async function updateRequestList({
  id,
  operatorCodeId,
  observationScheduling,
  dateScheduling,
  telScheduling,
}) {
  try {
    const res = await updateWorklistRequestSchedule({
      id,
      operatorCodeId,
      observationScheduling,
      dateScheduling,
      telScheduling,
    });
    if (res?.data?.length) return res.data;
    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
}
