import apiClient from "../services/apiClient.js";

export async function fetchDonorById(donorId) {
  const { data } = await apiClient.get(`/donors/${donorId}`);
  return data;
}

/** Corpo no mesmo formato de edição: nome, tipo, endereco, cidade, bairro, telefone1, opcionais cpf, email, telefone2, telefone3, dia, mensalidade, observacao, referencia */
export async function createDonorRequest(body) {
  try {
    const { data } = await apiClient.post("/donors", body);
    return data;
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "Erro ao criar doador";
    throw new Error(msg);
  }
}

export async function updateDonorRequest(donorId, body) {
  const { data } = await apiClient.put(`/donors/${donorId}`, body);
  return data;
}

export async function deactivateDonorMensalRequest(donorId) {
  const { data } = await apiClient.patch(`/donors/${donorId}/mensal/deactivate`);
  return data;
}

export async function touchDonorActivityRequest(donorId, operatorID) {
  const { data } = await apiClient.patch(`/donors/${donorId}/activity`, { operatorID });
  return data;
}

export async function fetchDonorDonations(donorId) {
  const { data } = await apiClient.get(`/donors/${donorId}/donations`);
  return data;
}

export async function fetchDonorActiveRequest(donorId) {
  const { data } = await apiClient.get(`/donors/${donorId}/requests/active`);
  return data;
}

export async function fetchDonorActivityLog(donorId, limit = 100) {
  const { data } = await apiClient.get(`/donors/${donorId}/activity-log`, {
    params: { limit },
  });
  return data;
}

export async function postDonorActivityLogRequest(payload) {
  const { data } = await apiClient.post("/donor-activity-log", payload);
  return data;
}

export async function postScheduledForDonorRequest(payload) {
  const { data } = await apiClient.post("/scheduled/for-donor", payload);
  return data;
}

export async function postTaskManagerRequest(payload) {
  const { data } = await apiClient.post("/task-manager", payload);
  return data;
}

export async function updateDonationByReceiptRequest(receiptId, body) {
  const { data } = await apiClient.put(`/donations/by-receipt/${receiptId}`, body);
  return data;
}

export async function fetchDonationByReceipt(receiptId) {
  const { data: envelope } = await apiClient.get(`/donations/by-receipt/${receiptId}`);

  if (!envelope?.success || envelope.data == null) {
    throw new Error(envelope?.message || "Doação não encontrada");
  }

  return envelope.data;
}

export async function patchDonationByReceiptRequest(receiptId, body) {
  const { data: envelope } = await apiClient.patch(`/donations/by-receipt/${receiptId}`, body);

  if (!envelope?.success) {
    throw new Error(envelope?.message || "Erro ao atualizar doação");
  }

  return envelope.data;
}

export async function deleteDonationByReceiptRequest(receiptId) {
  const { data } = await apiClient.delete(`/donations/by-receipt/${receiptId}`);
  return data;
}

export async function fetchDonationConfirmationReason(receiptId) {
  const { data } = await apiClient.get(`/donations/by-receipt/${receiptId}/confirmation-reason`);
  return data?.donor_confirmation_reason ?? "";
}

export async function searchDonorsRequest({ q, donorType }) {
  const { data: envelope } = await apiClient.get("/donors/search", {
    params: { q, donor_type: donorType },
  });
  if (envelope == null || typeof envelope !== "object") {
    throw new Error(
      "Resposta inválida na busca de doadores (corpo não é JSON). Confirme se /api no nginx aponta para o backend e não só para o frontend."
    );
  }
  if (envelope.success) {
    if (envelope.data == null) return [];
    if (Array.isArray(envelope.data)) return envelope.data;
    throw new Error(
      envelope.message ||
        "Resposta inválida: o backend devolveu `data` que não é uma lista. Atualize a imagem do backend ou verifique outro serviço respondendo em /api."
    );
  }
  throw new Error(
    envelope.message ||
      "Resposta inválida na busca de doadores (`success` ausente ou falso). Verifique logs do backend e o proxy /api."
  );
}

export async function fetchDonorMergePreview(donorIds) {
  const { data: envelope } = await apiClient.get("/donors/merge/preview", {
    params: { donor_ids: donorIds.join(",") },
  });
  if (!envelope?.success || !envelope?.data) {
    throw new Error(envelope?.message || "Resposta inválida do preview de mesclagem");
  }
  return envelope.data;
}

export async function postDonorMergeTransfer(payload) {
  const { data: envelope } = await apiClient.post("/donors/merge/transfer", payload);
  if (!envelope?.success) {
    throw new Error(envelope?.message || "Erro ao transferir doações");
  }
  return envelope.data;
}

export async function patchDonorMergeRequest(donorId, payload) {
  const { data: envelope } = await apiClient.patch(`/donors/${donorId}/merge`, payload);
  if (!envelope?.success) {
    throw new Error(envelope?.message || "Erro ao salvar doador");
  }
  return envelope.data;
}
