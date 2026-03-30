import { fetchWorklistRequestById } from "../api/worklistApi.js";

const getWorklistRequestById = async (operatorID, workSelect, requestId) => {
  try {
    const res = await fetchWorklistRequestById(operatorID, workSelect, requestId);
    return res?.data ?? null;
  } catch (e) {
    console.log(e?.message || e);
    return null;
  }
};

export default getWorklistRequestById;
