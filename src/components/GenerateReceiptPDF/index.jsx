import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { barCodeGenerator } from "../../services/barCodeGenerator";
import extenso from "extenso";
import { generatePixPayload } from "../../services/generatePixPayload";
import { receiptLogo } from "../../assets/receiptLogo";
import { toast } from "react-toastify";
import supabase from "../../helper/supaBaseClient.js";

pdfMake.vfs = pdfFonts.vfs;

// Função para gerar código de barras em base64 no navegador

const GenerateReceiptPDF = async ({ cards, receiptConfig, setOk }) => {
  let update = [];
  if (
    cards.some(
      (v) => v.collector_code_id === "" || v.collector_code_id === null
    )
  ) {
    toast.warning("Exitem recibos sem coletador!");
    return;
  }
  const recibos = await Promise.all(
    cards.map(async (data) => {
      const payload = generatePixPayload({
        pixKey: receiptConfig.pixKey,
        merchantName: receiptConfig.pixName.toUpperCase(),
        merchantCity: receiptConfig.pixCity.toUpperCase(),
        amount: data.donation_value,
        txid: data.receipt_donation_id.toString(),
      });
      const barcode = await barCodeGenerator(data.receipt_donation_id);
      update.push({
        receipt_donation_id: data.receipt_donation_id,
      });
      return {
        stack: [
          {
            columns: [
              {
                width: 290,

                table: {
                  heights: [260],
                  body: [
                    [
                      {
                        stack: [
                          {
                            columns: [
                              {
                                image: barcode,
                                width: 70,
                                height: 26,
                                margin: [0, 0, 0, 5],
                              },
                              { text: "MANANCIAL", style: "title" },
                            ],
                            columnGap: 32,
                          },
                          //{ text: "", margin: [0, 0] },
                          {
                            text: `DOADOR: ${data.donor.donor_name.toUpperCase()}`,
                            margin: [0, 0, 0, 2],
                            style: "label",
                            fontSize: 9,
                          },
                          {
                            canvas: [
                              {
                                type: "line",
                                x1: 0,
                                y1: 0,
                                x2: 250,
                                y2: 0,
                                lineWidth: 0.5,
                                lineColor: "#000000",
                              },
                            ],
                          },
                          {
                            text: `TEL: ${receiptConfig.isfake ? receiptConfig.phone_fake : data.donor.donor_tel_1}`,
                            style: "label",
                            fontSize: 9,
                            margin: [0, 0, 0, 2],
                          },
                          {
                            columns: [
                              {
                                width: 250,
                                noWrap: false, // garante que pode quebrar
                                margin: [0, 0, 0, 2],
                                text: `ENDEREÇO: ${String(
                                  data.donor.donor_address || ""
                                ).toUpperCase()}`,
                                style: "title",
                              },
                            ],
                          },
                          {
                            text: `BAIRRO: ${data.donor.donor_neighborhood.toUpperCase()}  CIDADE: ${data.donor.donor_city.toUpperCase()}`,
                            style: "label",
                            margin: [0, 0, 0, 2],
                          },
                          {
                            canvas: [
                              {
                                type: "line",
                                x1: 0,
                                y1: 0,
                                x2: 250,
                                y2: 0,
                                lineWidth: 0.5,
                                lineColor: "#000000",
                              },
                            ],
                          },
                          {
                            text: `VALOR: ${data.donation_value.toLocaleString(
                              "pt-BR",
                              { style: "currency", currency: "BRL" }
                            )} - TIPO: ${data.donor.donor_type.toUpperCase()} ${data.donor.donor_mensal?.active === true ? `DIA: ${data.donor.donor_mensal?.donor_mensal_day}` : ""} `,
                            style: "title",
                            margin: [0, 0, 0, 2],
                          },
                          {
                            text: `RECIBO: ${data.receipt_donation_id
                              } | DT.REC: ${new Date(
                                data.donation_day_to_receive
                              ).toLocaleDateString("pt-BR", {
                                timeZone: "UTC",
                              })}`,
                            style: "label",
                            margin: [0, 0, 0, 2],
                          },
                          {
                            canvas: [
                              {
                                type: "line",
                                x1: 0,
                                y1: 0,
                                x2: 250,
                                y2: 0,
                                lineWidth: 0.5,
                                lineColor: "#000000",
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: `U.COL: ${data?.ult_collector} - ${data?.collector_ult?.collector_name}${` | R.COL: ${data?.collector_code_id
                                  } - ${data?.collector?.collector_name.toUpperCase()}`} | OP: ${data.operator_code_id
                                  } - ${data?.operator?.operator_name.toUpperCase()}`,
                                style: "label",
                                margin: [0, 0, 0, 2],
                                width: 250,
                                noWrap: false,
                              },
                            ],
                          },
                          {
                            canvas: [
                              {
                                type: "line",
                                x1: 0,
                                y1: 0,
                                x2: 250,
                                y2: 0,
                                lineWidth: 0.5,
                                lineColor: "#000000",
                              },
                            ],
                          },
                          data?.donor?.donor_observation?.donor_observation && {
                            columns: [
                              {
                                text: `OBS: ${data?.donor?.donor_observation?.donor_observation?.toUpperCase()}`,
                                style: "label",
                                width: 250,
                                noWrap: false,
                              },
                            ],
                          },
                          data?.donor?.donor_reference?.donor_reference && {
                            columns: [
                              {
                                text: `Ref: ${data?.donor?.donor_reference?.donor_reference?.toUpperCase()}`,
                                style: "label",
                                margin: [0, 4, 0, 2],
                                width: 250,
                                noWrap: false,
                              },
                            ],
                          },
                          data?.donation_description && {
                            columns: [
                              {
                                text: `AVISO: ${data?.donation_description?.toUpperCase()}`,
                                style: "title",
                                margin: [0, 0, 0, 0],
                                width: 250,
                                noWrap: false,
                              },
                            ],
                          },
                          "\n",
                        ],
                      },
                    ],
                  ],
                },
                layout: "noBorders",
              },
              {
                width: "*",
                stack: [
                  {
                    table: {
                      widths: [110],
                      heights: [188],
                      body: [
                        [
                          {
                            qr: payload,
                            fit: 130,
                            alignment: "center",
                          },
                        ],
                      ],
                    },
                    layout: {
                      hLineWidth: function (i, node) {
                        return 0;
                      }, // Remove linhas horizontais
                      vLineWidth: function (i, node) {
                        return 0;
                      }, // Remove linhas verticais
                      paddingLeft: function (i) {
                        return 4;
                      }, // Ajuste de padding
                      paddingRight: function (i) {
                        return 4;
                      },
                    },
                  },
                  {
                    columns: [
                      {
                        image: receiptLogo.instagram,
                        fontSize: 9,
                        width: 14,
                        margin: [-12, 0, 4, 0],
                      },
                      {
                        text: receiptConfig.instagram,
                        fontSize: 9,
                        width: 130,
                        margin: [8, 2, 0, 0],
                      },
                    ],
                  },
                  {
                    columns: [
                      {
                        image: receiptLogo.facebook,
                        fontSize: 9,
                        width: 14,
                        margin: [-12, 0, 4, 0],
                      },
                      {
                        text: receiptConfig.facebook,
                        fontSize: 9,
                        width: 130,
                        margin: [8, 2, 0, 0],
                      },
                    ],
                  },
                  {
                    columns: [
                      {
                        image: receiptLogo.email,
                        fontSize: 9,
                        width: 14,
                        margin: [-12, 0, 4, 0],
                      },
                      {
                        text: receiptConfig.email,
                        fontSize: 9,
                        width: 130,
                        margin: [8, 2, 0, 0],
                      },
                    ],
                  },
                ],
              },
            ],
            columnGap: -16,
          },
          {
            text: "",
            margin: [0, 10],
          },
          {
            columns: [
              { width: 220, text: "" },
              {
                table: {
                  widths: [36, 50],
                  heights: [20, 20],
                  body: [
                    [
                      { text: "RECIBO:", style: "tableReceipt" },
                      {
                        text: data.receipt_donation_id,
                        style: "label",
                        alignment: "center",
                        margin: [0, 5],
                      },
                    ],
                    [
                      { text: "VALOR:", style: "tableReceipt" },
                      {
                        text: data.donation_value.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }),
                        style: "label",
                        alignment: "center",
                        margin: [0, 5],
                      },
                    ],
                  ],
                },
                layout: {
                  hLineWidth: function (i, node) {
                    return 1;
                  },
                  vLineWidth: function (i, node) {
                    return 1;
                  },
                  hLineColor: function (i, node) {
                    return "#000000";
                  },
                  vLineColor: function (i, node) {
                    return "#000000";
                  },
                },
              },
              { width: 60, text: "" },
              {
                table: {
                  widths: [84],
                  heights: [50],
                  body: [
                    [
                      {
                        image: barcode,
                        width: 70,
                        margin: [0, 8],
                        alignment: "center",
                      },
                    ],
                  ],
                },
              },
            ],
            columnGap: -30,
            margin: [0, 20],
            alignment: "center",
          },
          {
            stack: [
              {
                text: `Recebemos de ${data.donor.donor_name.toUpperCase()} | CPF: ${data.cpf || "___________"
                  }.`,
                style: "label",
                margin: [0, 5],
              },
              {
                text: `a importância de ${extenso(Number(data.donation_value), {
                  mode: "currency",
                }).toUpperCase()}`,
                style: "label",
                margin: [0, 5],
              },
              {
                text: `que será destinada à campanha ${data.donation_campain?.toUpperCase()}`,
                style: "label",
                margin: [0, 5],
              },
              {
                text: `Rio de Janeiro,     ${new Date(data.donation_day_to_receive).toLocaleDateString(
                  "pt-BR",
                  {
                    timeZone: "UTC",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}`,
                style: "label",
                margin: [0, 5],
              },
              "\n",
              "\n",
              {
                columns: [
                  {
                    text: receiptConfig.backOfReceipt.toUpperCase(),
                    style: "rodape",
                    width: 340,
                    alignment: "center",
                    noWrap: false,
                    margin: [50, 0, 0, 0],
                  },
                ],
              },
            ],
            margin: [30, 0, 0, 0],
          },
        ],
        margin: [10, 10, 10, 10],
      };
    })
  );

  // Agrupar recibos em pares (2 por página A4 paisagem)
  const paginas = [];
  for (let i = 0; i < recibos.length; i += 2) {
    const par = [recibos[i], recibos[i + 1] || ""]; // um ou dois por página
    paginas.push({
      columns: par,
      columnGap: 0,
      ...(i + 2 < recibos.length ? { pageBreak: "after" } : {}),
    });
  }

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [0, 0, 0, 0],
    content: paginas,
    styles: {
      label: { fontSize: 8, bold: false, fonts: "Courier" },
      title: { fontSize: 11, bold: true, margin: [0, 0, 0, 10] },
      rodape: { fontSize: 10, bold: true },
      tableReceipt: {
        fontSize: 9,
        margin: [0, 5],
      },
    },
  };
  pdfMake.createPdf(docDefinition).getBlob(async (blob) => {
    try {

      const { data: uploadData, error } = await supabase.storage
        .from("receiptPdfToPrint")
        .upload(
          `Print Checked/${cards.length === 1
            ? cards[0].donor?.donor_name.replace(/[^a-zA-Z0-9]/g) + "-"
            : cards[0].receipt_donation_id
          } ${cards[0].donation_day_to_receive}.pdf`,
          blob,
          {
            contentType: "application/pdf",
            upsert: true,
          }
        );

      if (error) throw error;

      if (!error) {
        const { error: updateError } = await supabase
          .from("donation")
          .update({ donation_print: "Sim" })
          .in(
            "receipt_donation_id",
            update.map((item) => item.receipt_donation_id)
          );

        if (updateError) {
          throw updateError;
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${cards[0].donor?.donor_name
              ? cards[0].donor?.donor_name + "-"
              : cards[0]?.receipt_donation_id
            } ${cards[0].donation_day_to_receive}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }
      setOk(true);
    } catch (error) {
      console.log("Erro ao salvar o recibo: ", error.message);
    }
  });
};

export default GenerateReceiptPDF;
