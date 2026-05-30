import { toast } from "react-toastify";
import { postBulkImportLeads } from "../api/leadsApi.js";

const insertNewLeads = async (excelData, setInsertedCount, setTotalCount, typeLead) => {
  return toast.promise(
    (async () => {
      const data = await postBulkImportLeads({
        rows: excelData,
        typeLead,
      });
      setInsertedCount(data.insertedCount ?? 0);
      setTotalCount(data.totalCount ?? excelData.length);
      return data.message || "Leads Carregados com Sucesso!";
    })(),
    {
      pending: "Processando novos leads...",
      success: {
        render({ data }) {
          return data;
        },
      },
      error: {
        render({ data }) {
          return data?.message || data || "Erro inesperado ao armazenar os leads.";
        },
      },
    }
  );
};

export default insertNewLeads;
