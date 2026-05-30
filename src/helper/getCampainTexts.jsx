import { fetchCampainTexts } from "../api/campainsApi";

/**
 * Busca todos os textos de uma campanha específica
 * @param {number} campainId - ID da campanha
 * @returns {Promise<Array>} Lista de textos da campanha
 */
export const getCampainTexts = async (campainId = null) => {
  try {
    const response = await fetchCampainTexts(campainId || undefined);
    return response?.data || [];
  } catch (error) {
    console.error("Erro na função getCampainTexts:", error);
    return [];
  }
};

