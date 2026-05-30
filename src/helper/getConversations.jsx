import supabase from "./superBaseClient";

export async function getConversations(id) {
  
  try {
    // Busca conversas com informações das mensagens mais recentes e contatos
    // Usando left join para incluir conversas mesmo sem mensagens (caso excepcional)
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          from_contact,
          body,
          received_at,
          status,
          message_type,
          contacts!from_contact (
            contact_id,
            phone_number,
            name
          )
        )
      `)
      .eq("operator_code_id", id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("❌ Erro ao buscar conversas:", error);
      throw error;
    }

    // Processa os dados para o formato esperado
    const processedData = data?.map(conversation => {
      const messages = conversation.messages || [];
      const lastMessage = messages.length > 0 ? 
        messages.reduce((latest, current) => 
          new Date(current.received_at) > new Date(latest.received_at) ? current : latest
        ) : null;

      // Extrai dados do contato através da última mensagem
      const phoneNumber = lastMessage?.contacts?.phone_number || null;
      const fromContact = lastMessage?.from_contact || null;

      // Para mensagens do sistema, trata o texto de forma especial
      let displayMessage = '';
      if (lastMessage) {
        if (lastMessage.message_type === 'system') {
          displayMessage = `${lastMessage.body}`;
        } else {
          displayMessage = lastMessage.body || '';
        }
      }

      return {
        ...conversation,
        from_contact: fromContact,
        phone_number: phoneNumber,
        last_message: displayMessage,
        last_message_time: lastMessage?.received_at || conversation.created_at,
        last_message_status: lastMessage?.status || 'unknown',
      };
    })
    // Filtra conversas que têm mensagens ou são muito recentes (últimas 24h)
    .filter(conv => {
      // Mantém conversas que têm mensagens
      if (conv.phone_number || conv.last_message) return true;
      
      // Mantém conversas criadas nas últimas 24 horas mesmo sem mensagens
      const conversationAge = Date.now() - new Date(conv.created_at).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      return conversationAge < twentyFourHours;
    })
    // Ordena por última atividade (mensagem mais recente)
    .sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)) || [];

    return processedData;
  } catch (error) {
    console.error("❌ Erro ao buscar conversas:", error);
    return []; // Retorna array vazio em caso de erro
  }
}
