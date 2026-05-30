import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { postParseLeadsXlsx } from "../api/leadsApi.js";

const xlsxFileUpload = (file, setExcelData, setHeaders) => {
  return toast.promise(
    (async () => {
      if (!file) {
        throw new Error("Nenhum arquivo selecionado");
      }

      const name = file.name || "";
      if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
        throw new Error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
      }

      const data = await postParseLeadsXlsx(file);
      setHeaders(data.headers ?? null);
      setExcelData(data.rows ?? []);
      return name;
    })(),

    {
      pending: "Carregando arquivo excel...",
      success: (fileName) => `Arquivo "${fileName}" carregado com sucesso! 🎉`,
      error: {
        render({ data }) {
          const msg =
            typeof data === "string"
              ? data
              : data?.message || "Erro inesperado ao carregar o arquivo.";
          return msg;
        },
      },
    }
  );
};

export default xlsxFileUpload;
