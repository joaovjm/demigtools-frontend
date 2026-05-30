import apiClient from "../services/apiClient";

export const getCollector = async () => {
  const { data } = await apiClient.get("/collectors");
  return data;
};
