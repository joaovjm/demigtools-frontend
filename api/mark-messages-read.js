import supabase from "../src/helper/supaBaseClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { conversationId } = req.body;
  
  if (!conversationId) {
    return res.status(400).json({ error: "conversation_id é obrigatório" });
  }

  try {
    // Marcar mensagens como lidas usando Supabase diretamente
    const { data, error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("status", "received")
      .select();

    if (error) {
      console.error("Erro ao marcar mensagens como lidas:", error);
      return res.status(500).json({ 
        error: "Erro ao atualizar mensagens", 
        details: error.message 
      });
    }

    return res.status(200).json({ 
      success: true,
      updatedCount: data?.length || 0,
      messages: data 
    });

  } catch (err) {
    console.error("Erro ao processar requisição:", err);
    return res.status(500).json({ 
      error: "Erro interno do servidor", 
      details: err.message 
    });
  }
}
