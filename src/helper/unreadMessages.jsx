// Helper para verificar se mensagem foi recebida de cliente (usando status)
export function isMessageFromClient(message) {
  // Mensagens com status "received" vieram de clientes
  return message.status === "received";
}

// Helper para calcular mensagens não lidas
export function getUnreadMessagesCount(messages, conversationId) {
  if (!messages || !conversationId) return 0;
  
  // Filtra mensagens da conversa que são:
  // 1. Recebidas de clientes (status === "received")
  // 2. Ainda não foram marcadas como lidas (is_read não é true)
  const unreadMessages = messages.filter(msg => 
    msg.conversation_id === conversationId && 
    isMessageFromClient(msg) && // Mensagem veio do cliente
    !msg.is_read // Ainda não foi marcada como lida
  );
  
  return unreadMessages.length;
}

// Função para marcar mensagens como lidas (usa campo is_read ao invés de alterar status)
export function markMessagesAsRead(messages, conversationId) {
  return messages.map(msg => {
    if (msg.conversation_id === conversationId && isMessageFromClient(msg)) {
      return { ...msg, is_read: true };
    }
    return msg;
  });
}

// Função para calcular total de mensagens não lidas de todas as conversas
export function getTotalUnreadMessages(messages, conversations) {
  if (!messages || !conversations) return 0;
  
  let total = 0;
  conversations.forEach(conversation => {
    total += getUnreadMessagesCount(messages, conversation.conversation_id);
  });
  
  return total;
}
