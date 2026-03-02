import fetch from "node-fetch";
import supabase from "../src/helper/supaBaseClient.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

export default async function handle(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo não permitido" });
  }

  try {
    const { pdf, filename, phone } = req.body;
    const pdfBuffer = Buffer.from(pdf, "base64");
    const { error: uploadError } = await supabase.storage
      .from("pdfs")
      .upload(filename, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    if (!uploadError) {
      const { data: publicUrl } = await supabase.storage
        .from("pdfs")
        .getPublicUrl(filename);
      const fileUrl = publicUrl.publicUrl;

      if (phone) {
        await fetch(
          `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_production: "whatsapp",
              to: phone,
              type: "document",
              document: {
                link: fileUrl,
                filename,
              },
            }),
          }
        );
      }

      return res.status(200).json({ success: true, url: fileUrl });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
