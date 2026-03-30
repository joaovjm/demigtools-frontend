import { fetchRequestPackageByNameId } from "../api/requestPackagesApi.js";

const getRequestById = async (requestId) => {
  try {
    return await fetchRequestPackageByNameId(requestId);
  } catch (error) {
    console.error("Erro ao buscar dados da requisição:", error);
    throw error;
  }
};

export default getRequestById;
