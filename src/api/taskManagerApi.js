import apiClient from "../services/apiClient.js";

export async function fetchMyTasks({ operatorCodeId }) {
  const { data: envelope } = await apiClient.get("/task-manager/my", {
    params: { operator_code_id: operatorCodeId },
  });

  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error(envelope?.message || "Resposta inválida ao carregar tarefas");
  }

  return envelope.data;
}

export async function fetchAllTasks() {
  const { data: envelope } = await apiClient.get("/task-manager");

  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error(envelope?.message || "Resposta inválida ao carregar tarefas");
  }

  return envelope.data;
}

export async function patchTaskManagerRequest(taskId, body) {
  const { data: envelope } = await apiClient.patch(`/task-manager/${taskId}`, body);

  if (!envelope?.success) {
    throw new Error(envelope?.message || "Erro ao atualizar tarefa");
  }

  return envelope.data;
}
