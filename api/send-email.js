import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import formidable from "formidable";
import { promises as fs } from "fs";

// força carregar o .env.local na raiz
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Carrega as variáveis do .env.local
dotenv.config();

export const config = {
  api: {
    bodyParser: false, // Desabilitar para processar FormData manualmente
  },
};

// Função para processar FormData ou JSON
async function parseRequest(req) {
  const contentType = req.headers["content-type"] || "";

  // Se for FormData (multipart/form-data)
  if (contentType.includes("multipart/form-data")) {
    const form = formidable({
      maxFileSize: 30 * 1024 * 1024, // 30MB limite
      multiples: false,
    });

    return new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }

        // Processar campos (podem vir como arrays no formidable v3+)
        const getData = (field) => Array.isArray(field) ? field[0] : field;
        
        const emailTo = getData(fields.emailTo);
        const subject = getData(fields.subject);
        const text = getData(fields.text);

        const result = { emailTo, subject, text };

        // Processar arquivo de imagem se existir
        if (files.image) {
          const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
          const imageBuffer = await fs.readFile(imageFile.filepath);
          result.image = {
            filename: imageFile.originalFilename || imageFile.newFilename,
            content: imageBuffer.toString("base64"),
            contentType: imageFile.mimetype,
          };
        }

        // Processar arquivo de vídeo se existir
        if (files.video) {
          const videoFile = Array.isArray(files.video) ? files.video[0] : files.video;
          const videoBuffer = await fs.readFile(videoFile.filepath);
          result.video = {
            filename: videoFile.originalFilename || videoFile.newFilename,
            content: videoBuffer.toString("base64"),
            contentType: videoFile.mimetype,
          };
        }

        // Processar arquivo de PDF se existir
        if (files.pdf) {
          const pdfFile = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;
          const pdfBuffer = await fs.readFile(pdfFile.filepath);
          result.pdf = {
            filename: pdfFile.originalFilename || pdfFile.newFilename,
            content: pdfBuffer.toString("base64"),
            contentType: pdfFile.mimetype,
          };
        }

        resolve(result);
      });
    });
  }

  // Se for JSON
  if (contentType.includes("application/json")) {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
      req.on("error", reject);
    });
  }

  throw new Error("Content-Type não suportado");
}

export default async function handler(req, res) {

  const allowedOrigins = [
    "http://localhost:5173",
    "https://demigtools.vercel.app",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: `Método ${req.method} não permitido` });
  }

  try {
    // Processar requisição (FormData ou JSON)
    const { emailTo, subject, text, image, video, pdf } = await parseRequest(req);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        message: "Erro ao enviar email",
        error: "EMAIL_USER ou EMAIL_PASS não definidos",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Prepara o conteúdo do email
    const imageId = 'embedded-image';
    let htmlContent = '';
    let textContent = text;
    const attachments = [];

    const mailOptions = {
      from: `"Centro Geriátrico Manancial" <${process.env.EMAIL_USER}>`,
      to: emailTo,
      subject,
      text, // Mantém o texto simples como fallback
    };

    // Adiciona a imagem incorporada no corpo do email se existir
    if (image && image.content && image.filename) {
      // Verifica se existe o marcador [IMAGEM] no texto
      if (textContent.includes('[IMAGEM]')) {
        // Substitui o marcador [IMAGEM] pela tag img
        const imageTag = `<div style="margin: 20px 0; text-align: center;">
          <img src="cid:${imageId}" alt="${image.filename}" style="max-width: 600px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
        </div>`;
        
        textContent = textContent.replace('[IMAGEM]', imageTag);
      } else {
        // Se não houver marcador, adiciona a imagem no final (comportamento padrão)
        textContent += `\n\n<div style="margin-top: 20px; text-align: center;">
          <img src="cid:${imageId}" alt="${image.filename}" style="max-width: 600px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
        </div>`;
      }
      
      // Adiciona imagem aos anexos com CID para incorporar no HTML
      attachments.push({
        filename: image.filename,
        content: image.content,
        encoding: 'base64',
        contentType: image.contentType || 'image/jpeg',
        cid: imageId, // Content-ID para referenciar no HTML
      });
    }

    // Adiciona o vídeo como anexo se existir
    if (video && video.content && video.filename) {
      // Verifica se existe o marcador [VIDEO] no texto
      if (textContent.includes('[VIDEO]')) {
        // Substitui o marcador [VIDEO] por uma mensagem informando que há um vídeo anexado
        const videoPlaceholder = `<div style="margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px; text-align: center; border: 2px dashed #4a90d9;">
          <p style="margin: 0; color: #333; font-size: 16px;">🎬 <strong>Vídeo em anexo:</strong> ${video.filename}</p>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Faça o download do anexo para assistir ao vídeo.</p>
        </div>`;
        
        textContent = textContent.replace('[VIDEO]', videoPlaceholder);
      } else {
        // Se não houver marcador, adiciona a mensagem no final
        textContent += `\n\n<div style="margin-top: 20px; padding: 20px; background-color: #f5f5f5; border-radius: 8px; text-align: center; border: 2px dashed #4a90d9;">
          <p style="margin: 0; color: #333; font-size: 16px;">🎬 <strong>Vídeo em anexo:</strong> ${video.filename}</p>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Faça o download do anexo para assistir ao vídeo.</p>
        </div>`;
      }
      
      // Adiciona vídeo como anexo (não pode ser incorporado no HTML como imagens)
      attachments.push({
        filename: video.filename,
        content: video.content,
        encoding: 'base64',
        contentType: video.contentType || 'video/mp4',
      });
    }

    // Adiciona o PDF como anexo se existir
    if (pdf && pdf.content && pdf.filename) {
      attachments.push({
        filename: pdf.filename,
        content: pdf.content,
        encoding: 'base64',
        contentType: pdf.contentType || 'application/pdf',
      });
    }

    // Define os anexos se houver algum
    if (attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    htmlContent = `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="white-space: pre-wrap;">${textContent}</div>
    </div>`;
    
    mailOptions.html = htmlContent;

    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: "Email enviado com sucesso!" });
    } catch (error) {
      console.error("Erro Nodemailer:", error);
      return res.status(500).json({
        message: "Erro ao enviar email",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return res.status(400).json({
      message: "Erro ao processar requisição",
      error: error.message,
    });
  }
}
