import supabase from "./superBaseClient";

const getLeadById = async (leadId) => {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("leads_id", leadId)
      .single();

    if (error) {
      console.error("Erro ao buscar lead:", error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro na função getLeadById:", error);
    throw error;
  }
};

export default getLeadById;

