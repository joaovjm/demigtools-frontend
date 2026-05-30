import apiClient from "../services/apiClient.js";

export function cancelDonationRequest(payload) {
  return apiClient.post("/donations/cancel", payload).then((r) => r.data);
}

export function recreateDonationFromConfirmationRequest(payload) {
  return apiClient
    .post("/donations/recreate-from-confirmation", payload)
    .then((r) => r.data);
}

export function markDonationNotAttendedRequest(payload) {
  return apiClient.post("/donations/mark-not-attended", payload).then((r) => r.data);
}

export function scheduleDonationConfirmationRequest(payload) {
  return apiClient.post("/donations/schedule-confirmation", payload).then((r) => r.data);
}

export function updateCollectorForDonorRequest(payload) {
  return apiClient.post("/donations/update-collector-for-donor", payload).then((r) => r.data);
}

export function createDonationRequest(payload) {
  return apiClient.post("/donations/create", payload).then((r) => r.data);
}

export function fetchDonorDonationStats(donorId, requestName = null) {
  return apiClient
    .get(`/donors/${donorId}/donation-stats`, {
      params: requestName ? { requestName } : undefined,
    })
    .then((r) => r.data);
}
