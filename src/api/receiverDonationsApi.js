import apiClient from "../services/apiClient.js";

export function fetchDepositPending(collectorCodeId = 22) {
  return apiClient
    .get("/receiver-donations/deposit-pending", {
      params: { collectorCodeId },
    })
    .then((r) => r.data);
}

export function postReceiveDonation(payload) {
  return apiClient.post("/receiver-donations/receive", payload).then((r) => r.data);
}

export function patchDepositReceiptSent(receiptDonationId) {
  return apiClient
    .patch("/receiver-donations/deposit-receipt-sent", { receiptDonationId })
    .then((r) => r.data);
}

export function fetchReceiptConfig() {
  return apiClient.get("/receipt-config").then((r) => r.data);
}

export function fetchCheckPrintPending({ startDate, endDate, donationType = "Todos" }) {
  return apiClient
    .get("/receiver-donations/check-print/pending", {
      params: {
        start_date: startDate,
        end_date: endDate,
        donation_type: donationType,
      },
    })
    .then((r) => r.data);
}

export function fetchCheckPrintPrinted(limit = 300) {
  return apiClient
    .get("/receiver-donations/check-print/printed", { params: { limit } })
    .then((r) => r.data);
}

export function postCheckPrintPackage(payload) {
  return apiClient.post("/receiver-donations/check-print/packages", payload).then((r) => r.data);
}

export function fetchCheckPrintPackage(packageId) {
  return apiClient
    .get(`/receiver-donations/check-print/packages/${packageId}`)
    .then((r) => r.data);
}

export function patchCheckPrintCollectors(updates) {
  return apiClient
    .patch("/receiver-donations/check-print/collectors", { updates })
    .then((r) => r.data);
}

export function patchCheckPrintMarkPrinted(receiptIds) {
  return apiClient
    .patch("/receiver-donations/check-print/mark-printed", { receiptIds })
    .then((r) => r.data);
}
