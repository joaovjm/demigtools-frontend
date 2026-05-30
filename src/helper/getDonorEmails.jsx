import supabase from "./superBaseClient";

/**
 * Busca todos os doadores que possuem email cadastrado
 * @returns {Promise<Array>} Array de doadores com email
 */
export const getDonorEmails = async () => {
  try {
    const { data, error } = await supabase
      .from("donor_email")
      .select(`
        id,
        donor_email,
        donor_id,
        donor:donor_id (
          donor_id,
          donor_name,
          donor_type,
          donor_tel_1
        )
      `)
      .not("donor_email", "is", null)

    if (error) {
      console.error("Erro ao buscar emails:", error);
      throw error;
    }

    

    // Filtra emails vazios ou inválidos e formata os dados
    const validEmails = data?.filter(item => 
      item.donor_email && 
      item.donor_email.trim() !== "" &&
      item.donor_email.includes("@")
    ) || [];

    return validEmails.map(item => ({
      id: item.id,
      donor_id: item.donor_id,
      donor_email: item.donor_email,
      donor_name: item.donor?.donor_name || "Nome não disponível",
      donor_type: item.donor?.donor_type || "",
      donor_tel_1: item.donor?.donor_tel_1 || "",
    }));
  } catch (error) {
    console.error("Erro ao buscar doadores com email:", error.message);
    return [];
  }
};

/**
 * Busca doadores com email filtrados por tipo
 * @param {string} donorType - Tipo do doador para filtrar
 * @returns {Promise<Array>} Array de doadores com email filtrados
 */
export const getDonorEmailsByType = async (donorType) => {
  try {
    let query = supabase
      .from("donor_email")
      .select(`
        id,
        donor_email,
        donor_id,
        donor:donor_id (
          donor_id,
          donor_name,
          donor_type,
          donor_tel_1
        )
      `)
      .not("donor_email", "is", null);

    if (donorType && donorType !== "Todos") {
      query = query.eq("donor.donor_type", donorType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar emails por tipo:", error);
      throw error;
    }

    // Filtra emails vazios ou inválidos e formata os dados
    const validEmails = data?.filter(item => 
      item.donor_email && 
      item.donor_email.trim() !== "" &&
      item.donor_email.includes("@")
    ) || [];

    return validEmails.map(item => ({
      id: item.id,
      donor_id: item.donor_id,
      donor_email: item.donor_email,
      donor_name: item.donor?.donor_name || "Nome não disponível",
      donor_type: item.donor?.donor_type || "",
      donor_tel_1: item.donor?.donor_tel_1 || "",
    }));
  } catch (error) {
    console.error("Erro ao buscar doadores com email por tipo:", error.message);
    return [];
  }
};

