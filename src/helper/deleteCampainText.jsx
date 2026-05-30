import { toast } from "react-toastify";
import { deleteCampainTextRequest } from "../api/campainsApi";

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

    const response = await deleteCampainTextRequest(id, hardDelete);
    if (!response?.success) throw new Error(response?.message || "Erro ao deletar");

    toast.success("Texto da campanha deletado com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro na função deleteCampainText:", error);
    toast.error("Erro ao deletar texto da campanha");
    return false;
  }
};

