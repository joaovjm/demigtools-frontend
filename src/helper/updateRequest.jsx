import supabase from "./superBaseClient";
import { DataNow } from "../components/DataTime";
import { toast } from "react-toastify";

const updateRequest = async (requestId, createPackage, endDate) => {
  try {
    // Atualizar o nome da requisição
    /*const { error: requestNameError } = await supabase
      .from("request_name")
      .update({
        date_validate: endDate,
        date_updated: DataNow("noformated")
      })
      .eq("id", requestId);

    if (requestNameError) {
      console.error("Erro ao atualizar nome da requisição:", requestNameError);
      throw requestNameError;
    }*/

    // Primeiro, desativar todas as requisições existentes
    /*const { error: deactivateError } = await supabase
      .from("request")
      .update({ request_active: "False" })
      .eq("request_name_id", requestId);

    if (deactivateError) {
      console.error("Erro ao desativar requisições existentes:", deactivateError);
      throw deactivateError;
    }*/

    // Preparar dados para inserção
    const validColumn = ["id", "operator_code_id", "request_end_date"];

    const filterPackage = createPackage.map((pkg) =>
      Object.fromEntries(
        Object.entries(pkg).filter(([key]) => validColumn.includes(key))
      )
    );

    if (filterPackage.some((pkg) => pkg.operator_code_id === "")) {
      toast.warning("Há itens da requisição não atribuidos.");
      return;
    } else {
      const updatePromises = filterPackage.map((pkg) =>
        supabase
          .from("request")
          .update({
            operator_code_id: pkg.operator_code_id,
            request_end_date: endDate,
          })
          .eq("id", pkg.id)
          .select()
      );

      const results = await Promise.all(updatePromises);

      // Verificar se houve algum erro
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        console.error("Erros ao atualizar requisições:", errors);
        throw errors[0].error;
      }

      // Combinar todos os dados atualizados
      const data = results.flatMap((result) => result.data);

      return data;
    }
  } catch (error) {
    console.error("Erro na função updateRequest:", error);
    throw error;
  }
};

export default updateRequest;
