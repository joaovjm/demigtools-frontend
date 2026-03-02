import supabase from "../src/helper/supaBaseClient.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const {
      conversationId,
      from, // contact_id do remetente (opcional)
      to, // número no formato E.164, ex: 5599999999999
      templateName,
      language = "pt_BR",
      components, // opcional: componentes completos do template
      variables, // opcional: atalho para parâmetros de body em ordem
    } = req.body;

    if (!to || !templateName) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneId || !accessToken) {
      console.error("❌ Variáveis de ambiente ausentes");
      return res
        .status(500)
        .json({ error: "Variáveis de ambiente ausentes no servidor" });
    }

    // Monta os componentes do template
    let templateComponents = components;
    if (!templateComponents && Array.isArray(variables)) {
      templateComponents = [
        {
          type: "body",
          parameters: variables.map((text) => ({ type: "text", text: String(text) })),
        },
      ];
    }

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        ...(templateComponents ? { components: templateComponents } : {}),
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Erro na API do WhatsApp",
        details: result,
      });
    }

    // Persiste o envio no Supabase (best-effort)
    try {
      const renderedBody = JSON.stringify({ templateName, language, variables, components: templateComponents });
      const { data: insertedData, error: supabaseError } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: conversationId || null,
            from_contact: from || null,
            body: renderedBody,
            message_type: "template",
            received_at: new Date().toISOString(),
            status: "sent",
            whatsapp_message_id: result?.messages?.[0]?.id || null,
          },
        ])
        .select();

      if (supabaseError) {
        console.error("Erro Supabase:", supabaseError);
        return res.status(200).json({ success: true, whatsapp: result, supabase: { error: supabaseError.message } });
      }

      return res.status(200).json({ success: true, whatsapp: result, supabase: insertedData });
    } catch (dbErr) {
      console.error("Erro ao salvar no Supabase:", dbErr);
      return res.status(200).json({ success: true, whatsapp: result });
    }
  } catch (err) {
    console.error("Erro interno:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}


