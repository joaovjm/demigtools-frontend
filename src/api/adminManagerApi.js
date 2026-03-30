import apiClient from "../services/apiClient.js";

export function fetchOperatorMetaHistory(operatorCodeId, limit = 5) {
  return apiClient
    .get("/admin-manager/operator-meta/history", { params: { operatorCodeId, limit } })
    .then((r) => r.data);
}

export function postOperatorMeta(payload) {
  return apiClient.post("/admin-manager/operator-meta", payload).then((r) => r.data);
}

export function deleteOperatorMeta(id) {
  return apiClient.delete(`/admin-manager/operator-meta/${id}`).then((r) => r.data);
}

export function fetchAdminReceiptConfig() {
  return apiClient.get("/admin-manager/receipt-config").then((r) => r.data);
}

export function patchAdminReceiptConfig(payload) {
  return apiClient.patch("/admin-manager/receipt-config", payload).then((r) => r.data);
}

export function fetchLeadsOptions(field) {
  return apiClient
    .get("/admin-manager/leads/options", { params: { field } })
    .then((r) => r.data);
}
