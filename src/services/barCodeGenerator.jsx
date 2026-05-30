import BwipJs from "bwip-js";

export async function barCodeGenerator(value) {
  const canvas = document.createElement("canvas");
  try {
    BwipJs.toCanvas(canvas, {
      bcid: "code128",
      text: value.toString(),
      scale: 3,
      height: 8,
      includetext: true,
      textxalign: "center",
      textfont: 10,
    });

    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Erro ao gerar código de barras:", e);
    return "";
  }
}