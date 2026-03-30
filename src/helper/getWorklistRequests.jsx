import { fetchWorklistRequests } from "../api/worklistApi.js";

const getWorklistRequests = async (operatorID, workSelect) => {
  try {
    const res = await fetchWorklistRequests(operatorID, workSelect);
    return res?.data ?? [];
  } catch (e) {
    console.log(e?.message || e);
    return [];
  }
};

export default getWorklistRequests;
