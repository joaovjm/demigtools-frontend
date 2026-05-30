import apiClient from "../services/apiClient";

export async function updateLeadStatus({ leads_id, leads_status, operator_code_id }) {
  const { data } = await apiClient.post("/leads/update-status", {
    leads_id,
    leads_status,
    operator_code_id,
  });
  return data;
}

export async function updateRequestStatus({ id, status }) {
  const { data } = await apiClient.post("/request/update-status", { id, status });
  return data;
}

export async function clearDonationConfirmationSchedule({ receiptDonationId }) {
  const { data } = await apiClient.post("/donations/clear-confirmation-schedule", {
    receiptDonationId,
  });
  return data;
}

export async function createDonation(payload) {
  const { data } = await apiClient.post("/donations/create", payload);
  return data;
}

export async function scheduledDonationCannotHelp({ id }) {
  const { data } = await apiClient.post("/scheduled-donations/cannot-help", { id });
  return data;
}

export async function scheduledDonationComplete({ id, donation_id }) {
  const { data } = await apiClient.post("/scheduled-donations/complete", { id, donation_id });
  return data;
}

export async function createDonorAndDonationFromScheduledLead(payload) {
  const { data } = await apiClient.post("/leads/scheduled/create-donor-donation", payload);
  return data;
}

