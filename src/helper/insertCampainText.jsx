import { toast } from "react-toastify";
import supabase from "./superBaseClient";

/**
 * Insere um novo texto estilizado para uma campanha
 * @param {Object} textData - Dados do texto
 * @param {number} textData.campain_id - ID da campanha
 * @param {string} textData.title - Título do texto
 * @param {string} textData.content - Conteúdo HTML do texto
 * @param {string} textData.image - Imagem em base64 (opcional)
 * @param {string} textData.video - Vídeo em base64 (opcional)
 * @returns {Promise<Object>} Texto inserido
 */
export const insertCampainText = async ({ campain_id, title, content, image, video }) => {
  try {
    // Validação básica
    if (!campain_id || !title || !content) {
      toast.error("Todos os campos são obrigatórios!");
      return null;
    }

    const insertData = {
      campain_id,
      title,
      content,
      is_active: true,
    };

    // Adicionar imagem apenas se existir
    if (image) {
      insertData.image = image;
    }

    // Adicionar vídeo apenas se existir
    if (video) {
      insertData.video = video;
    }

    const { data, error } = await supabase
      .from("campain_texts")
      .insert([insertData])
      .select();

    if (error) {
      console.error("Erro ao inserir texto da campanha:", error.message);
      toast.error("Erro ao adicionar texto da campanha");
      throw error;
    }

    if (data && data.length > 0) {
      toast.success("Texto da campanha adicionado com sucesso!");
      return data[0];
    }

    return null;
  } catch (error) {
    console.error("Erro na função insertCampainText:", error);
    toast.error("Erro ao adicionar texto da campanha");
    return null;
  }
};

