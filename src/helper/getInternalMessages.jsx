import supabase from "./superBaseClient";

/**
 * Busca mensagens de uma conversa do chat interno.
 */
export async function getInternalMessages(conversationId) {
  if (!conversationId) return [];

  try {
    const { data, error } = await supabase
      .from("internal_chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar mensagens internas:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("getInternalMessages:", e);
    return [];
  }
}
