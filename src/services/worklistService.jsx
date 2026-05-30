import getWorklistRequests from "../helper/getWorklistRequests";
import { fetchWorklistNames } from "../api/worklistApi.js";
import { fetchDonorDonationStats } from "../api/donationsApi.js";

export async function fetchWorklist(operatorCodeId) {
  if (operatorCodeId == null || operatorCodeId === "") return [];
  try {
    const res = await fetchWorklistNames(operatorCodeId);
    return res?.names ?? [];
  } catch (error) {
    console.error(error?.message || error);
    return [];
  }
}

export async function worklistRequests(operatorID, workSelect) {
  const response = await getWorklistRequests(operatorID, workSelect);
  return response;
}

export async function fetchMaxAndMedDonations(id, requestName) {
  return fetchDonorDonationStats(id, requestName);
}
