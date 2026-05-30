import { fetchLeadById } from "../api/leadsApi.js";

const getLeadById = async (leadId) => {
  try {
    const resp = await fetchLeadById(leadId);
    return resp?.data ?? null;
  } catch (error) {
    console.error("Erro na função getLeadById:", error);
    throw error;
  }
};

export default getLeadById;

