import supabase from "./superBaseClient";

/**
 * Busca todos os textos de uma campanha específica
 * @param {number} campainId - ID da campanha
 * @returns {Promise<Array>} Lista de textos da campanha
 */
export const getCampainTexts = async (campainId = null) => {
  try {
    let query = supabase
      .from("campain_texts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // Se campainId for fornecido, filtra por campanha específica
    if (campainId) {
      query = query.eq("campain_id", campainId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar textos das campanhas:", error.message);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Erro na função getCampainTexts:", error);
    return [];
  }
};

