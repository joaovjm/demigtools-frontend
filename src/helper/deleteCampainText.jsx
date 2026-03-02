import { toast } from "react-toastify";
import supabase from "./superBaseClient";

/**
 * Deleta um texto de campanha (soft delete por padrão)
 * @param {number} id - ID do texto a ser deletado
 * @param {boolean} hardDelete - Se true, deleta permanentemente
 * @returns {Promise<boolean>} Sucesso da operação
 */
export const deleteCampainText = async (id, hardDelete = false) => {
  try {
    if (!id) {
      toast.error("ID do texto não fornecido!");
      return false;
    }

    let result;

    if (hardDelete) {
      // Hard delete - remove permanentemente
      result = await supabase.from("campain_texts").delete().eq("id", id);
    } else {
      // Soft delete - apenas marca como inativo
      result = await supabase
        .from("campain_texts")
        .update({ is_active: false })
        .eq("id", id);
    }

    const { error } = result;

    if (error) {
      console.error("Erro ao deletar texto da campanha:", error.message);
      toast.error("Erro ao deletar texto da campanha");
      throw error;
    }

    toast.success("Texto da campanha deletado com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro na função deleteCampainText:", error);
    toast.error("Erro ao deletar texto da campanha");
    return false;
  }
};

