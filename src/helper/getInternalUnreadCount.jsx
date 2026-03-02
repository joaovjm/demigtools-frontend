import supabase from "./superBaseClient";

/**
 * Conta mensagens não lidas do chat interno para o usuário atual.
 * Mensagens onde sender_id != currentUser e read_at IS NULL.
 */
export async function getInternalUnreadCount(operatorCodeId) {
  if (!operatorCodeId) return 0;

  try {
    const { data: convs, error: convError } = await supabase
      .from("internal_chat_conversations")
      .select("id")
      .or(`participant_1.eq.${operatorCodeId},participant_2.eq.${operatorCodeId}`);

    if (convError || !convs?.length) return 0;

    const convIds = convs.map((c) => c.id);

    const { count, error } = await supabase
      .from("internal_chat_messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .is("read_at", null)
      .neq("sender_id", operatorCodeId);

    if (error) return 0;
    return count ?? 0;
  } catch (e) {
    console.error("getInternalUnreadCount:", e);
    return 0;
  }
}
