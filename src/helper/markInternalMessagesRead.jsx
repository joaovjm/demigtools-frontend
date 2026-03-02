import supabase from "./superBaseClient";

/**
 * Marca todas as mensagens de uma conversa como lidas pelo destinatário (currentUser).
 * Atualiza read_at onde sender_id != currentUser e read_at IS NULL.
 */
export async function markInternalMessagesRead(conversationId, operatorCodeId) {
  if (!conversationId || !operatorCodeId) return;

  try {
    await supabase
      .from("internal_chat_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .is("read_at", null)
      .neq("sender_id", operatorCodeId);
  } catch (e) {
    console.error("markInternalMessagesRead:", e);
  }
}
