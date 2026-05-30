import supabase from "./superBaseClient";

const deleteConversation = async (conversationId) => {
  if (!conversationId) return { error: new Error("conversationId inválido") };

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("conversation_id", conversationId);

  if (error) return { error };
  return { success: true };
};

export default deleteConversation;


