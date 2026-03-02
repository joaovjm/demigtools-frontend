import dotenv from "dotenv";
import supabase from "../src/helper/supaBaseClient.js";

dotenv.config();

// Necessário para o Next/Vercel entender JSON vindo do WhatsApp
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // 🔹 Validação do Webhook (GET)
  if (req.method === "GET") {
    const verify_token = process.env.WEBHOOK_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token && mode === "subscribe" && token === verify_token) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("Token inválido");
    }
  }

  // 🔹 Recebendo mensagens (POST)
  if (req.method === "POST") {
    let conversationId;
    let contactId;
    try {
      const data = req.body;
      const value = data.entry?.[0]?.changes?.[0]?.value;
      const message = value?.messages?.[0];
      const contact = value?.contacts?.[0];

      {
        /* Verifica se é mensagem. E caso sim, verifica se o contato existe. E caso não, insere o contato. E caso sim, atualiza o contato. */
      }
      if (message) {
        const wa_id = contact?.wa_id;

        if (!message || !contact) {
          return res.status(200).send("Nenhuma mensagem encontrada");
        }

        const { data: existingContact, error: contactSelectError } = await supabase
          .from("contacts")
          .select("contact_id")
          .eq("phone_number", wa_id)
          .maybeSingle(); // Usa maybeSingle para evitar erro quando não encontra

        if (contactSelectError) {
          console.error("❌ Erro ao buscar contato:", contactSelectError);
        }
        
        if (existingContact) {
          contactId = existingContact.contact_id;
        } else {
          const { data: newContact, error: insertContactError } = await supabase
            .from("contacts")
            .insert({
              phone_number: wa_id,
              name: contact.profile?.name || null,
            })
            .select()
            .single();
          if (insertContactError) throw insertContactError;
          contactId = newContact.contact_id;
        }

        // Busca conversa existente de forma mais robusta
        // 1º: Procura conversas que já tenham mensagens deste contato (via contact_id)
        const { data: existingConvByContact, error: convByContactError } = await supabase
          .from("conversations")
          .select(`
            conversation_id,
            messages!inner (
              from_contact
            )
          `)
          .eq("type", "individual")
          .eq("messages.from_contact", contactId)
          .limit(1)
          .maybeSingle();

        if (convByContactError && convByContactError.code !== 'PGRST116') {
          console.error("❌ Erro ao buscar conversa por contato:", convByContactError);
        }

        if (existingConvByContact) {
          conversationId = existingConvByContact.conversation_id;

        } else {
          // 2º: Se não encontrou via contato, procura por título (fallback)
          const { data: existingConvByTitle, error: convByTitleError } = await supabase
            .from("conversations")
            .select("conversation_id")
            .eq("type", "individual")
            .eq("title", contact.profile?.name || wa_id)
            .maybeSingle();

          if (convByTitleError) {
            console.error("❌ Erro ao buscar conversa por título:", convByTitleError);
          }

          if (existingConvByTitle) {
            conversationId = existingConvByTitle.conversation_id;
   
          } else {
            // 3º: Se não encontrou nenhuma, cria nova conversa
            const { data: newConv, error: insertConvError } = await supabase
              .from("conversations")
              .insert({
                type: "individual",
                title: contact.profile?.name || wa_id,
              })
              .select()
              .single();
            if (insertConvError) throw insertConvError;
            conversationId = newConv.conversation_id;

          }
        }
        // 🔹 Inserir mensagem
        const { data: newMessage, error: insertMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            from_contact: contactId,
            body: message.text?.body || null,
            message_type: message.type,
            media_url: message.image?.id
              ? `https://graph.facebook.com/v23.0/${message.image.id}`
              : null,
            status: message.status,
            whatsapp_message_id: message.id,
          })
          .select()
          .single();
        if (insertMsgError) throw insertMsgError;
      }

      {
        /* Verifica se é status. E caso sim, atualiza o status da mensagem. */
      }
      if (value?.statuses) {
        const status = value?.statuses?.[0];

        const { data: updateMsg, error: updateMsgError } = await supabase
          .from("messages")
          .update({ status: status.status })
          .eq("whatsapp_message_id", status.id)
          .select();
        if (updateMsgError) {
          console.error("❌ Erro ao atualizar status da mensagem:", updateMsgError);
          // Não lança erro para não quebrar o webhook
        } else {
        }
        
      }

      return res.status(200).send("EVENT_RECEIVED");
    } catch (err) {
      console.error("❌ Erro no handler:", err);
      return res.status(500).send("Internal Server Error");
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
