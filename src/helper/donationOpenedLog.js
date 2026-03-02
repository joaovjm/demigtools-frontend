import supabase from "./superBaseClient";

/**
 * Registra a data e hora que uma doação foi aberta
 * @param {string} receipt_donation_id - ID do recibo da doação
 * @returns {Promise<Object>} - Resultado da operação
 */
export const logDonationOpened = async (receipt_donation_id) => {
  try {
    const { data, error } = await supabase
      .from("donation_opened_log")
      .insert({
        receipt_donation_id: receipt_donation_id,
        opened_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error("Erro ao registrar abertura da doação:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao registrar abertura da doação:", error);
    return { success: false, error };
  }
};

/**
 * Registra ou atualiza a última vez que uma doação foi aberta (se usar UNIQUE constraint)
 * @param {string} receipt_donation_id - ID do recibo da doação
 * @returns {Promise<Object>} - Resultado da operação
 */
export const logDonationOpenedUpsert = async (receipt_donation_id) => {
  try {
    const { data, error } = await supabase
      .from("donation_opened_log")
      .upsert(
        {
          receipt_donation_id: receipt_donation_id,
          opened_at: new Date().toISOString(),
        },
        { onConflict: "receipt_donation_id" }
      )
      .select();

    if (error) {
      console.error("Erro ao registrar abertura da doação:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao registrar abertura da doação:", error);
    return { success: false, error };
  }
};
