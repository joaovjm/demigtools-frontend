import supabase from "./superBaseClient";
import { toast } from "react-toastify";

export const insertScheduled = async ({
  scheduled_date,
  observation,
  entity_type,
  entity_id,
  operator_code_id,
}) => {
  try {
    // Validar campos obrigatórios
    if (!scheduled_date) {
      toast.error("A data do agendamento é obrigatória");
      return null;
    }

    if (!entity_type) {
      toast.error("O tipo de entidade é obrigatório");
      return null;
    }

    if (!entity_id) {
      toast.error("O ID da entidade é obrigatório");
      return null;
    }

    // Verificar se existe um request ativo para este donor_id (quando entity_type é "doação")
    
    let requestId = null;
    if (entity_type === "doação") {
      const { data: requestData, error: requestError } = await supabase
        .from("request")
        .select("id, request_name")
        .eq("donor_id", entity_id)
        .eq("request_active", "true")
        .limit(1)
        .single();
  
      if (!requestError && requestData) {
        requestId = requestData.id;
      }
    }

    // Inserir na tabela scheduled
    // scheduled_date pode ser uma string ISO ou timestamp

    const { data, error } = await supabase
      .from("scheduled")
      .upsert([
        {
          scheduled_date: scheduled_date,
          status: "pendente",
          observation: observation || null,
          entity_type: entity_type,
          entity_id: entity_id,
          operator_code_id: operator_code_id || null,
        }, 
      ], {
        onConflict: "entity_id"
      })
      
      .select();

    if (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error("Erro ao criar agendamento: " + error.message);
      return null;
    }

    // Se encontrou um request ativo, atualizar o status para "Agendado"
    
    if (requestId) {
      const { error: updateError } = await supabase
        .from("request")
        .update({ request_status: "Agendado" })
        .eq("id", requestId);

      if (updateError) {
        console.log("Erro ao atualizar status do request", updateError.message);
      }
    }

    toast.success("Agendamento criado com sucesso!");
    return data;
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    toast.error("Erro ao criar agendamento");
    return null;
  }
};

