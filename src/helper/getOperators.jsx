import apiClient from "../services/apiClient";

export const getOperators = async ({ active, item, from, to } = {}) => {
  const params = {};
  if (active !== undefined && active !== null && active !== "") {
    params.active = active;
  }
  if (item) {
    params.item = String(item).replace(/\s/g, "");
  }
  if (from !== undefined && from !== null) {
    params.from = from;
  }
  if (to !== undefined && to !== null) {
    params.to = to;
  }
  const { data } = await apiClient.get("/operators", { params });

  if (data && typeof data === "object" && data.success === true && Array.isArray(data.data)) {
    return data.data;
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [];
};
