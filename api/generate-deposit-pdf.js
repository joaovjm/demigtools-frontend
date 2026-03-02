import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";
import extenso from "extenso";
import { barCodeGeneratorNode } from "../src/services/barCodeGeneratorNode.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

// Configurar fonts do pdfmake
pdfMake.vfs = pdfFonts.vfs;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Gera o PDF de depósito no formato Node.js
 * @param {Object} data - Dados da doação
 * @param {Object} config - Configurações do recibo
 * @returns {Promise<Buffer>} Buffer do PDF gerado
 */
async function generateDepositPDFNode({ data, config, cpf_visible }) {
  // Gerar código de barras
  const barcodeBuffer = await barCodeGeneratorNode(data.receipt_donation_id);

  // Converter buffer do código de barras para base64 para uso no pdfmake
  const barcodeBase64 = `data:image/png;base64,${barcodeBuffer.toString("base64")}`;

  // Caminho para a imagem do recibo
  // Em ambiente serverless (Vercel), tentar múltiplos caminhos
  let receiptImagePath = path.join(process.cwd(), "src", "assets", "receipt.jpg");
  
  // Verificar se o arquivo existe, tentar caminho alternativo se não existir
  if (!fs.existsSync(receiptImagePath)) {
    const altPath = path.join(__dirname, "../src/assets/receipt.jpg");
    if (fs.existsSync(altPath)) {
      receiptImagePath = altPath;
    } else {
      throw new Error(`Arquivo de imagem do recibo não encontrado. Tentou: ${receiptImagePath} e ${altPath}`);
    }
  }
  
  // Ler a imagem do recibo como buffer e converter para base64
  const receiptImageBuffer = fs.readFileSync(receiptImagePath);
  const receiptImageBase64 = `data:image/png;base64,${receiptImageBuffer.toString("base64")}`;

  const depositReceipt = [
    {
      columns: [
        {},
        {
          width: 204,
          margin: [0, 13],
          table: {
            widths: [58, 116],
            heights: [40, 8, 40],
            body: [
              [
                {
                  text: "RECIBO:",
                  margin: [3, 15],
                  fontSize: 13,
                  fillColor: "#000000",
                  color: "#ffffff",
                  bold: true,
                },
                {
                  text: data.receipt_donation_id,
                  alignment: "center",
                  margin: [0, 15],
                  fontSize: 18,
                  bold: true,
                },
              ],
              [
                {
                  text: "",
                  border: [false, true, false, false],
                  margin: [0, 0, 0, 0],
                },
                {
                  text: "",
                  border: [false, true, false, false],
                  margin: [0, 0, 0, 0],
                },
              ],
              [
                {
                  text: "VALOR:",
                  style: "tableReceipt",
                  margin: [4, 15],
                  fontSize: 13,
                  fillColor: "#000000",
                  color: "#ffffff",
                  bold: true,
                },
                {
                  text: data.donation_value?.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
                  alignment: "center",
                  margin: [0, 15],
                  fontSize: 18,
                  bold: true,
                },
              ],
            ],
          },
          layout: {
            hLineWidth: function (i, node) {
              return 3;
            },
            vLineWidth: function (i, node) {
              return 3;
            },
            hLineColor: function (i, node) {
              return "#000000";
            },
            vLineColor: function (i, node) {
              return "#000000";
            },
          },
        },
        {
          width: 181,
          table: {
            widths: [190],
            heights: [136],
            body: [
              [
                {
                  image: barcodeBase64,
                  width: 150,
                  height: 60,
                  margin: [-5, 42],
                  alignment: "center",
                },
              ],
            ],
          },
        },
      ],
      margin: [0, -4],
    },
    {
      text: "",
      margin: [0, 19],
    },
    {
      margin: [36, 0, 0, 0],
      stack: [
        {
          columns: [
            {
              text: "Recebemos de",
              fontSize: 16,
              margin: [0, 0, 0, 16],
              width: "auto",
            },
            {
              text: (data.donor_name || "").normalize("NFD").toUpperCase(),
              fontSize: 20,
              margin: [8, -2, 8, 0],
              decoration: "underline",
              width: "auto",
            },
            {
              text: `${cpf_visible ? "| CPF:" + data.cpf : ""}`,
              fontSize: 18,
              margin: [0, -2, 0, 0],
              width: "auto",
            },
          ],
        },
        {
          columns: [
            {
              text: "a importância de",
              fontSize: 16,
              margin: [0, 0, 0, 16],
            },
            {
              text: `${extenso(Number(data.donation_value), {
                mode: "currency",
              }).toUpperCase()}`,
              fontSize: 16,
              margin: [-224, 0, 0, 16],
              decoration: "underline",
            },
          ],
        },
        {
          text: `que será destinada à campanha ${data.donation_campain?.toUpperCase()}`,
          fontSize: 16,
          margin: [0, 0, 0, 24],
        },
        {
          text: `Rio de Janeiro,     ${new Date(data.donation_day_received).toLocaleDateString("pt-BR", {
            timeZone: "UTC",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}`,
          fontSize: 16,
          margin: [0, 0, 0, 36],
        },
        "\n",
        {
          text: config.backOfReceipt,
          alignment: "center",
          fontSize: 20,
        },
      ],
    },
  ];

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargin: [0, 0, 0, 0],
    content: depositReceipt,
    style: {
      values: {
        fontSize: 12,
        bold: true,
        fillColor: "#000000",
        color: "#ffffff",
      },
      label: { fontSize: 9, bold: false, fonts: "Courier" },
      title: { fontSize: 12, bold: true, margin: [0, 0, 0, 10] },
      rodape: { fontSize: 10, bold: true },
    },
    background: function (currentPage, pageSize) {
      return {
        image: receiptImageBase64,
        width: pageSize.width,
        height: pageSize.height,
      };
    },
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer) => {
        if (buffer) {
          // Garantir que é um Buffer válido
          const pdfBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
          resolve(pdfBuffer);
        } else {
          reject(new Error("Erro ao gerar buffer do PDF"));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { data, config, cpf_visible } = req.body;

    if (!data || !config) {
      return res.status(400).json({ error: "Dados ou configuração não fornecidos" });
    }

    // Validar campos obrigatórios
    if (!data.receipt_donation_id) {
      return res.status(400).json({ error: "receipt_donation_id é obrigatório" });
    }
    if (!data.donor_name) {
      return res.status(400).json({ error: "donor_name é obrigatório" });
    }
    if (!data.donation_value) {
      return res.status(400).json({ error: "donation_value é obrigatório" });
    }
    if (!config.backOfReceipt) {
      return res.status(400).json({ error: "config.backOfReceipt é obrigatório" });
    }

    const pdfBuffer = await generateDepositPDFNode({ data, config, cpf_visible: cpf_visible || false });

    // Garantir que o buffer é válido
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
      throw new Error("Buffer do PDF inválido");
    }

    // Sanitizar o nome do arquivo para evitar caracteres inválidos no header HTTP
    // Remover todos os caracteres não-ASCII e caracteres especiais problemáticos
    const donorName = (data.donor_name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacríticos
      .replace(/[^a-zA-Z0-9\s-]/g, "") // Mantém apenas letras, números, espaços e hífens
      .replace(/\s+/g, " ") // Normaliza espaços múltiplos
      .trim()
      .toUpperCase();
    
    const sanitizedFileName = `${data.receipt_donation_id} - ${donorName}.pdf`;
    
    // Retornar o PDF como resposta
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedFileName}"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Enviar o buffer como resposta binária
    return res.end(pdfBuffer);
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    console.error("Stack trace:", err.stack);
    const errorMessage = err?.message || "Erro desconhecido ao gerar PDF";
    return res.status(500).json({ error: errorMessage });
  }
}

