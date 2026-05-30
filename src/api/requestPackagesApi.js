import apiClient from "../services/apiClient.js";

function assertEnvelopeArray(envelope, label) {
  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error(envelope?.message || `Resposta inválida: ${label}`);
  }
}

export async function postDonationCandidates(payload) {
  const { data: envelope } = await apiClient.post(
    "/request-packages/donation-candidates",
    payload
  );
  assertEnvelopeArray(envelope, "candidatos ao pacote");
  return envelope.data;
}

export async function fetchRequestNames() {
  const { data: envelope } = await apiClient.get("/request-packages/names");
  assertEnvelopeArray(envelope, "nomes de requisições");
  return envelope.data;
}

export async function fetchRequestPackageByNameId(requestNameId) {
  const { data: envelope } = await apiClient.get(
    `/request-packages/by-name-id/${encodeURIComponent(requestNameId)}`
  );
  assertEnvelopeArray(envelope, "pacote por id");
  return envelope.data;
}

export async function createRequestPackageRequest(payload) {
  const { data: envelope } = await apiClient.post("/request-packages", payload);
  if (!envelope?.success || envelope.data === undefined || envelope.data === null) {
    throw new Error(envelope?.message || "Resposta inválida ao criar requisição");
  }
  return envelope.data;
}

export async function patchRequestPackageRowsRequest(payload) {
  const { data: envelope } = await apiClient.patch(
    "/request-packages/rows",
    payload
  );
  if (!envelope?.success) {
    throw new Error(envelope?.message || "Erro ao atualizar requisição");
  }
  return envelope.data;
}

export async function deleteRequestPackageRequest(requestNameId) {
  const { data: envelope } = await apiClient.delete(
    `/request-packages/by-name-id/${encodeURIComponent(requestNameId)}`
  );
  if (!envelope?.success) {
    throw new Error(envelope?.message || "Erro ao excluir requisição");
  }
  return envelope;
}
