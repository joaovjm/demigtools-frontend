import apiClient from "../services/apiClient.js";

export function fetchMonthlyFeeCheck(dateRef) {
  return apiClient
    .get("/monthly-fee/check", { params: { date_ref: dateRef } })
    .then((r) => r.data);
}

export function postMonthlyFeeGenerate({ dateRef, campain }) {
  return apiClient
    .post("/monthly-fee/generate", { date_ref: dateRef, campain })
    .then((r) => r.data);
}
