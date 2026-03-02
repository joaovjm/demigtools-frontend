import supabase from "./superBaseClient";

/**
 * Lista conversas do chat interno para o operador atual.
 * Retorna conversas com último mensagem e dados do outro participante.
 */
export async function getInternalConversations(operatorCodeId) {
  if (!operatorCodeId) return [];

  try {
    const { data: convs, error: convError } = await supabase
      .from("internal_chat_conversations")
      .select("id, participant_1, participant_2, created_at, updated_at")
      .or(`participant_1.eq.${operatorCodeId},participant_2.eq.${operatorCodeId}`)
      .order("updated_at", { ascending: false });

    if (convError) {
      console.error("Erro ao buscar conversas internas:", convError);
      return [];
    }

    if (!convs?.length) return [];

    const { data: operators } = await supabase
      .from("operator")
      .select("operator_code_id, operator_name");

    const opMap = new Map((operators || []).map((o) => [o.operator_code_id, o.operator_name]));

    const { data: allMessages } = await supabase
      .from("internal_chat_messages")
      .select("conversation_id, body, created_at, sender_id, read_at")
      .in("conversation_id", convs.map((c) => c.id))
      .order("created_at", { ascending: false });

    const lastByConv = {};
    const unreadByConv = {};
    (allMessages || []).forEach((m) => {
      if (!lastByConv[m.conversation_id]) lastByConv[m.conversation_id] = m;
      if (m.sender_id !== operatorCodeId && !m.read_at) {
        unreadByConv[m.conversation_id] = (unreadByConv[m.conversation_id] || 0) + 1;
      }
    });

    return convs.map((c) => {
      const otherId = c.participant_1 === operatorCodeId ? c.participant_2 : c.participant_1;
      const last = lastByConv[c.id];
      return {
        id: c.id,
        conversation_id: c.id,
        participant_1: c.participant_1,
        participant_2: c.participant_2,
        other_participant_id: otherId,
        other_participant_name: opMap.get(otherId) || `Operador #${otherId}`,
        last_message: last?.body || "",
        last_message_time: last?.created_at || c.updated_at,
        unread_count: unreadByConv[c.id] || 0,
        created_at: c.created_at,
        updated_at: c.updated_at,
      };
    });
  } catch (e) {
    console.error("getInternalConversations:", e);
    return [];
  }
}
