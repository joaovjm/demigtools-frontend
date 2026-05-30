import { fetchRequestNames } from "../api/requestPackagesApi.js";

const getAllRequests = async () => {
  try {
    return await fetchRequestNames();
  } catch (error) {
    console.error("Erro ao buscar requisições:", error);
    return [];
  }
};

export default getAllRequests;
