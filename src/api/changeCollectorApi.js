import apiClient from "../services/apiClient.js";

export async function fetchDonationDonorByReceipt(receiptId) {
  const { data: envelope } = await apiClient.get("/donations/by-receipt/simple", {
    params: { receipt_donation_id: receiptId },
  });
  if (!envelope?.success || !envelope.data) {
    throw new Error(envelope?.message || "Recibo não encontrado");
  }
  return envelope.data;
}

export async function changeCollectorRequest(payload) {
  const { data: envelope } = await apiClient.post("/donations/change-collector", payload);
  return envelope;
}
