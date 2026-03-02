export const config = {
  api: {
    bodyParser: true,
  },
};

// Cria ou consulta status de templates do WhatsApp Business (Meta)
// POST: cria template para aprovação
//   body: { name, category, language, components? | bodyText?, headerText?, footerText?, buttons?[] }
// GET: consulta status por nome
//   query: ?name=<template_name>
export default async function handler(req, res) {
  const wabaId = process.env.WHATSAPP_WABA_ID; // ID da WABA (business_account)
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN; // App token com permissão

  if (!wabaId || !accessToken) {
    return res.status(500).json({
      error: "Variáveis de ambiente ausentes",
      details: "WHATSAPP_WABA_ID e WHATSAPP_ACCESS_TOKEN são obrigatórios",
    });
  }

  try {
    if (req.method === "GET") {
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({ error: "Parâmetro 'name' é obrigatório" });
      }

      const url = new URL(`https://graph.facebook.com/v23.0/${wabaId}/message_templates`);
      url.searchParams.set("name", name);
      url.searchParams.set("fields", "name,status,category,language,rejected_reason,rejected_reason_details,last_updated_time");

      const resp = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await resp.json();
      if (!resp.ok) {
        return res.status(resp.status).json({ error: "Erro ao consultar status", details: data });
      }
      return res.status(200).json({ success: true, result: data });
    }

    if (req.method === "POST") {
      const {
        name,
        category, // utility | marketing | authentication (ou nomes antigos: TRANSACTIONAL/MARKETING/UTILITY)
        language = "pt_BR",
        components, // componentes completos opcionais
        bodyText, // atalhos
        headerText,
        footerText,
        buttons, // ex: [{ type: 'QUICK_REPLY', text: 'Confirmar' }]
      } = req.body || {};

      if (!name || !category) {
        return res.status(400).json({ error: "'name' e 'category' são obrigatórios" });
      }

      let templateComponents = components;
      if (!templateComponents) {
        templateComponents = [];
        if (headerText) {
          templateComponents.push({ type: "HEADER", format: "TEXT", text: String(headerText) });
        }
        if (bodyText) {
          templateComponents.push({ type: "BODY", text: String(bodyText) });
        }
        if (footerText) {
          templateComponents.push({ type: "FOOTER", text: String(footerText) });
        }
        if (Array.isArray(buttons) && buttons.length > 0) {
          templateComponents.push({ type: "BUTTONS", buttons });
        }
      }

      const payload = {
        name,
        category,
        language,
        components: templateComponents,
      };

      const resp = await fetch(`https://graph.facebook.com/v23.0/${wabaId}/message_templates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) {
        return res.status(resp.status).json({ error: "Erro ao enviar template para aprovação", details: data });
      }
      // A resposta normalmente contém o status inicial (e.g., PENDING)
      return res.status(200).json({ success: true, result: data });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("❌ Erro interno:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}


