import supabase from "../helper/superBaseClient";

export async function fetchConversations() {
  try {
    const { data: messages, error: errorMessages } = await supabase
      .from("messages")
      .select("*");
    if (!errorMessages) {
      const { data: conversations, error: errorConversations } = await supabase
        .from("conversations")
        .select("conversation_id, title");
      if (!errorConversations) {
        return { messages, conversations };
      }
    }
  } catch (error) {
  }
}
