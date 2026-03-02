import supabase from "../helper/superBaseClient";
import { toast } from "react-toastify";

const insertNewLeads = async (excelData, setInsertedCount, setTotalCount, typeLead) => {
  let lead = "leads";
  return toast.promise(
    (async () => {
      try {

        let insertedCount = 0;
        let totalCount = 0;

        for (let i = 0; i < excelData.length; i += 1) {
          const insertBatch = excelData.slice(i, i + 1);

          const { error, count } = await supabase
            .from(lead)
            .upsert(insertBatch, {
              onConflict: "leads_icpf", // evita duplicatas
              ignoreDuplicates: true,    // só insere se não existir
              count: "exact"             // conta quantos foram inseridos
            });

          if (error) throw error;
          
          totalCount += 1;
          insertedCount += count;
        }

        if (insertedCount === 0) {
          throw new Error("Nenhum lead novo para ser armazenado.");
        }

        setInsertedCount(insertedCount);
        setTotalCount(totalCount);

        return "Leads Carregados com Sucesso!";
      } catch (error) {
        throw new Error(error.message || "Erro ao inserir novos leads.");
      }
    })(),
    {
      pending: "Processando novos leads...",
      success: {
        render ({ data }) {
          return data;
        }
      },
      error: {
        render({ data }) {
          return data.message || "Erro inesperado ao armazenar os leads.";
        },
      },
    }
  );
};

export default insertNewLeads;