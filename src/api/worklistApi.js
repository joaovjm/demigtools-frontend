import apiClient from "../services/apiClient.js";

export function fetchWorklistNames(operatorCodeId) {
  return apiClient
    .get("/worklist/names", { params: { operatorCodeId } })
    .then((r) => r.data);
}

export function fetchWorklistRequests(operatorCodeId, requestName) {
  return apiClient
    .get("/worklist/requests", { params: { operatorCodeId, requestName } })
    .then((r) => r.data);
}

export function fetchWorklistRequestById(operatorCodeId, requestName, requestId) {
  return apiClient
    .get(`/worklist/requests/${requestId}`, {
      params: { operatorCodeId, requestName },
    })
    .then((r) => r.data);
}

export function touchWorklistRequestAccessed(requestId, operatorCodeId) {
  return apiClient
    .patch(`/worklist/requests/${requestId}/accessed`, { operatorCodeId })
    .then((r) => r.data);
}

export function updateWorklistRequestSchedule(payload) {
  return apiClient.post("/worklist/requests/schedule", payload).then((r) => r.data);
}
