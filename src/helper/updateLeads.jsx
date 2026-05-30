import { patchUpdateLeadStatus } from "../api/leadsApi.js";

const updateLeads = async (status_leads, operator_code_id, leads_id) => {
  try {
    const resp = await patchUpdateLeadStatus({
      leads_id,
      leads_status: status_leads,
      operator_code_id,
    });

    // backend retorna: { status: "OK", data: [...] }
    const data = resp?.data;
    if (Array.isArray(data) && data?.[0]?.leads_status === status_leads) {
      return data;
    }
    return resp?.data ?? null;
  } catch (error) {
    console.log(error?.message || error);
  }
};

export default updateLeads;
