import { fetchActiveCampains, fetchActiveCampainsSummary } from "../api/campainsApi.js";

export const getCampains = async () => {
  try {
    const response = await fetchActiveCampains();
    return Array.isArray(response) ? response : response?.data || [];
  } catch (error) {
    console.error(error?.message || error);
    return [];
  }
};

/** Campanhas ativas só com id e nome (ex.: modal de e-mail). */
export const getCampainsSummary = async () => {
  try {
    const response = await fetchActiveCampainsSummary();
    return Array.isArray(response) ? response : response?.data || [];
  } catch (error) {
    console.error(error?.message || error);
    return [];
  }
};