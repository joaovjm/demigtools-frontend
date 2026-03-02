import supabase from "./superBaseClient";

const deleteOperator = async (operator_code_id) => {
  try {
    const { data, error: fetchError } = await supabase
      .from("operator")
      .select(`operator_uuid`)
      .eq("operator_code_id", operator_code_id);

    if (fetchError || !data || data.length === 0) {
      console.log(
        "Erro ao buscar operador: ",
        fetchError?.message || "Operador não encontrado"
      );
      return {
        success: false,
        error: fetchError?.message || "Operador não encontrado",
      };
    }

    const uuid = data[0].operator_uuid;

    const { error } = await supabaseAdmin.auth.admin.deleteUser(uuid);
    if (error) {
      console.log("Erro: ", error.message);
    }

    return { success: true };
  } catch (error) {
    console.log("Erro inesperado: ", error.message);
    return { success: false, error: error.message };
  }
};

export default deleteOperator;
