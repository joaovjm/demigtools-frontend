import { toast } from "react-toastify";
import supabase from "./superBaseClient";

/**
 * Atualiza um texto de campanha existente
 * @param {number} id - ID do texto a ser atualizado
 * @param {Object} updateData - Dados a serem atualizados
 * @param {string} updateData.title - Título do texto
 * @param {string} updateData.content - Conteúdo HTML do texto
 * @param {string} updateData.image - Imagem em base64 (opcional)
 * @param {string} updateData.video - Vídeo em base64 (opcional)
 * @returns {Promise<Object>} Texto atualizado
 */
export const updateCampainText = async (id, { title, content, campain_id, image, video }) => {
  try {
    if (!id) {
      toast.error("ID do texto não fornecido!");
      return null;
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (campain_id !== undefined) updateData.campain_id = campain_id;
    if (image !== undefined) updateData.image = image;
    if (video !== undefined) updateData.video = video;

    const { data, error } = await supabase
      .from("campain_texts")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Erro ao atualizar texto da campanha:", error.message);
      toast.error("Erro ao atualizar texto da campanha");
      throw error;
    }

    if (data && data.length > 0) {
      toast.success("Texto da campanha atualizado com sucesso!");
      return data[0];
    }

    return null;
  } catch (error) {
    console.error("Erro na função updateCampainText:", error);
    toast.error("Erro ao atualizar texto da campanha");
    return null;
  }
};

