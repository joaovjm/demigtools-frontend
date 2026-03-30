import apiClient from "../services/apiClient.js";

export function fetchLeadNeighborhoods() {
  return apiClient
    .get("/leads/neighborhoods")
    .then((r) => r.data);
}

export function fetchLeadsPaginated({ operatorCodeId, start = 0, neighborhood = "" }) {
  return apiClient
    .get("/leads/paginated", {
      params: { operatorCodeId, start, neighborhood: neighborhood || "" },
    })
    .then((r) => r.data);
}

export function fetchLeadById(leadsId) {
  return apiClient
    .get(`/leads/${leadsId}`)
    .then((r) => r.data);
}

// endpoint novo/consistente com backend atual: POST /leads/update-status
export function patchUpdateLeadStatus({ leads_id, leads_status, operator_code_id }) {
  return apiClient
    .post("/leads/update-status", {
      leads_id,
      leads_status,
      operator_code_id: operator_code_id ?? null,
    })
    .then((r) => r.data);
}

export function scheduleLead({ leads_id, dateScheduling, telScheduling, observationScheduling, operator_code_id = null }) {
  return apiClient
    .patch("/leads/schedule", {
      leads_id,
      dateScheduling,
      telScheduling,
      observationScheduling,
      operator_code_id,
    })
    .then((r) => r.data);
}

export function createDonationFromLead({ leads_id, operator_code_id, formData }) {
  return apiClient
    .post("/leads/create-donation-from-lead", { leads_id, operator_code_id, formData })
    .then((r) => r.data);
}

export function editLeadDetails({ leadsId, leadData }) {
  return apiClient
    .patch(`/leads/${leadsId}`, { leadData })
    .then((r) => r.data);
}

export function fetchLeadsHistory({ operatorCodeId }) {
  return apiClient
    .get("/leads/history", { params: { operatorCodeId } })
    .then((r) => r.data);
}

export async function postBulkImportLeads({ rows, typeLead }) {
  const { data: envelope } = await apiClient.post("/leads/bulk-import", {
    rows,
    typeLead,
  });

  if (!envelope?.success || !envelope?.data) {
    throw new Error(envelope?.message || "Resposta inválida ao importar leads");
  }

  return envelope.data;
}

/** Envia o .xlsx/.xls para o backend; o parse é feito no servidor. */
export async function postParseLeadsXlsx(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data: envelope } = await apiClient.post("/leads/parse-xlsx", formData);

  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida ao ler planilha");
  }

  return envelope.data;
}

