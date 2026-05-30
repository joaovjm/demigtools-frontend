import apiClient from "../services/apiClient.js";

function encodeOpId(operatorCodeId) {
  return encodeURIComponent(String(operatorCodeId));
}

export async function postOperator(payload) {
  const { data: envelope } = await apiClient.post("/operators", payload);
  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida ao criar operador");
  }
  return envelope.data;
}

export async function patchOperator(operatorCodeId, payload) {
  const { data: envelope } = await apiClient.patch(
    `/operators/${encodeOpId(operatorCodeId)}`,
    payload
  );
  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida ao atualizar operador");
  }
  return envelope.data;
}

export async function fetchOperatorByCode(operatorCodeId) {
  const { data: envelope } = await apiClient.get(
    `/operators/${encodeOpId(operatorCodeId)}`
  );
  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Operador não encontrado");
  }
  return envelope.data;
}

/** Exclui Supabase Auth + linha em `operator` (tudo no backend). */
export async function deleteOperatorAccount(operatorCodeId) {
  const { data: envelope } = await apiClient.delete(
    `/operators/${encodeOpId(operatorCodeId)}`
  );
  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida ao excluir operador");
  }
  return envelope.data;
}

/** Só remove o usuário no Auth (rollback se o insert no Postgres falhar). */
export async function postSupabaseAuthCleanup(userId) {
  const { data: envelope } = await apiClient.post(
    "/operators/supabase-auth/cleanup",
    { userId }
  );
  if (!envelope?.success) {
    throw new Error(envelope?.message || "Falha ao remover usuário do Auth");
  }
  return envelope.data;
}
