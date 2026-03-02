import supabase from "./superBaseClient";

/**
 * Obtém ou cria uma conversa entre dois participantes.
 * participantA e participantB são operator_code_id.
 * Retorna { id, participant_1, participant_2, ... }.
 */
export async function getOrCreateInternalConversation(participantA, participantB) {
  if (!participantA || !participantB || participantA === participantB) return null;

  const p1 = Math.min(participantA, participantB);
  const p2 = Math.max(participantA, participantB);

  const { data: existing, error: findError } = await supabase
    .from("internal_chat_conversations")
    .select("*")
    .eq("participant_1", p1)
    .eq("participant_2", p2)
    .maybeSingle();

  if (findError) {
    console.error("Erro ao buscar conversa interna:", findError);
    return null;
  }
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("internal_chat_conversations")
    .insert([{ participant_1: p1, participant_2: p2 }])
    .select()
    .single();

  if (insertError) {
    console.error("Erro ao criar conversa interna:", insertError);
    return null;
  }
  return created;
}
