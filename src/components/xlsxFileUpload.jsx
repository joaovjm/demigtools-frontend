import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const xlsxFileUpload = (file, setExcelData, setHeaders) => {
  return toast.promise(
    (async () => {
      if (!file) return;

      // Verificar se o arquivo é do tipo Excel
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
        return;
      }

      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            // Pegar a primeira planilha
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Converter para JSON com cabeçalhos (retorna array de objetos)
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
              reject("O arquivo Excel está vazio");
              return;
            }

            // Extrair os cabeçalhos do primeiro objeto
            const headerRow = Object.keys(jsonData[0]);
            setHeaders(headerRow);

            setExcelData(jsonData);
            resolve();
          } catch (error) {
            console.error("Erro ao processar o arquivo:", error);
            reject(new Error("Erro ao processar o arquivo Excel"));
          }
        };

        reader.onerror = () => {
          reject(new Error("Erro ao ler o arquivo"));
        };

        reader.readAsArrayBuffer(file);
      });
    })(),

    {
      pending: "Carregando arquivo excel...",
      success: `Arquivo "${file.name}" carregado com sucesso! 🎉`,
      error: {
        render({ data }) {
          return data.message || "Erro inesperado ao carregar o arquivo.";
        },
      },
    }
  );
};

export default xlsxFileUpload;
