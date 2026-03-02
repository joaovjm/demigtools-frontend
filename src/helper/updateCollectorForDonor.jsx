import supabase from "./superBaseClient";

/**
 * Atualiza o collector_code_id de todas as doações de um doador específico
 * que possuem um determinado collector_code_id para um novo valor
 * 
 * @param {number} donor_id - ID do doador
 * @param {number} oldCollectorId - ID do coletor antigo (filtro)
 * @param {number} newCollectorId - ID do novo coletor
 * @returns {Promise<Object>} - Retorna os dados atualizados ou erro
 */
export const updateCollectorForDonor = async (
  donor_id,
  oldCollectorId,
  newCollectorId
) => {
  try {
    const { data, error } = await supabase
      .from("donation")
      .update({ collector_code_id: newCollectorId })
      .eq("donor_id", donor_id)
      .eq("collector_code_id", oldCollectorId)
      .select();

    if (error) throw error;

    return { success: true, data, count: data?.length || 0 };
  } catch (error) {
    console.error("Erro ao atualizar coletor das doações:", error.message);
    return { success: false, error: error.message };
  }
};

