import supabase from "./superBaseClient";

export async function deleteRequestPackage(requestId) {
  try {
    // Primeiro, deletar todos os itens relacionados na tabela request
    const { error: requestItemsError } = await supabase
      .from("request")
      .delete()
      .eq("request_name_id", requestId);

    if (requestItemsError) {
      console.error("Erro ao deletar itens da requisição:", requestItemsError);
      throw requestItemsError;
    }

    // Depois, deletar o nome da requisição
    const { data: requestNameData, error: requestNameError } = await supabase
      .from("request_name")
      .delete()
      .eq("id", requestId)
      .select();

    if (requestNameError) {
      console.error("Erro ao deletar nome da requisição:", requestNameError);
      throw requestNameError;
    }

    return { success: true, message: "Requisição deletada com sucesso", data: requestNameData };
  } catch (error) {
    console.error("Erro ao deletar pacote:", error);
    return { success: false, message: error.message || "Erro ao deletar requisição" };
  }
}
