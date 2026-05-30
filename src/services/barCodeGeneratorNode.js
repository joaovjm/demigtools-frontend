import bwipjs from "bwip-js";

/**
 * Gera um código de barras em formato PNG buffer para uso no Node.js
 * @param {string|number} value - Valor para gerar o código de barras
 * @returns {Promise<Buffer>} Buffer do PNG do código de barras
 */
export async function barCodeGeneratorNode(value) {
  try {
    const png = await bwipjs.toBuffer({
      bcid: "code128",
      text: value.toString(),
      scale: 3,
      height: 8,
      includetext: true,
      textxalign: "center",
      textfont: 10,
    });

    return png;
  } catch (e) {
    console.error("Erro ao gerar código de barras:", e);
    throw e;
  }
}

