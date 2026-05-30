import supabase from "./superBaseClient";
import { REQUEST_STATUS } from "../constants/requestStatus";

export const insertDonation = async (
  donor_id,
  operator,
  valor,
  comissao,
  data_contato,
  data_receber,
  impresso,
  recebido,
  descricao,
  mesref,
  campain,
  collector,
  request_name,
  requestRowId = null
) => {
  let print = "";
  let received = "";
  let request_name_searched = "";
  let scheduledId = null;

  if (impresso === true) {
    print = "Sim";
  } else {
    print = "Não";
  }

  if (recebido === true) {
    received = "Sim";
  } else {
    received = "Não";
  }

  try{
    // Nome da lista para donation_worklist quando não veio do contexto do modal
    if (request_name === null || request_name === undefined || request_name === "") {
      const { data: requestRows } = await supabase
        .from("request")
        .select("request_name")
        .eq("donor_id", donor_id)
        .eq("request_active", "True")
        .order("id", { ascending: false })
        .limit(1);

      if (requestRows?.[0]?.request_name) {
        request_name_searched = requestRows[0].request_name;
      }
    }

    // Verifica se existem algum agendamento para esta doação
    const { data: scheduledData, error: scheduledError } = await supabase
      .from("scheduled")
      .select("scheduled_id")
      .eq("entity_id", donor_id)
      .eq("entity_type", "doação")
      .limit(1)
      .single();

    if(!scheduledError && scheduledData){
      scheduledId = scheduledData.scheduled_id;
    }


    // Inserir a doação
    const { data, error } = await supabase.from("donation").insert([
      {
        donor_id: donor_id,
        operator_code_id: operator ? operator : null,
        donation_value: valor ? Number(valor): 0,
        donation_day_contact: data_contato,
        donation_description: descricao,
        donation_extra: comissao ? Number(comissao) : null,
        donation_day_to_receive: data_receber ? data_receber : null,
        donation_print: print,
        donation_received: received,
        donation_monthref: mesref ? mesref : null,
        donation_campain: campain ? campain : null,
        collector_code_id: collector ? collector : null,
        donation_worklist: request_name ? request_name : request_name_searched ? request_name_searched : null,
      },
    ]).select();
    
    if(error) throw error;

    // Atualizar quaisquer doações agendadas deste doador para "Concluído"
    const { error: updateScheduledDonationsError } = await supabase
      .from("donation")
      .update({ confirmation_status: "Concluído" })
      .eq("donor_id", donor_id)
      .eq("confirmation_status", "Agendado");

    if (updateScheduledDonationsError) {
      console.log(
        "Erro ao atualizar status de doações agendadas para concluído",
        updateScheduledDonationsError.message
      );
    }

    // Exclui o agendamento se existir
    if(scheduledId){
      const { error: deleteScheduledError } = await supabase
        .from("scheduled")
        .delete()
        .eq("scheduled_id", scheduledId);
        
      if(deleteScheduledError){
        console.log("Erro ao excluir agendamento", deleteScheduledError.message);
      }
    }

    // Atualizar linha(s) da worklist: status em JSONB (array) + vínculo com o novo recibo
    const newReceiptId = data?.[0]?.receipt_donation_id;
    if (newReceiptId) {
      const payload = {
        receipt_donation_id: newReceiptId,
        request_status: [REQUEST_STATUS.SUCESSO],
      };

      if (requestRowId != null && requestRowId !== "") {
        const { error: updateError } = await supabase
          .from("request")
          .update(payload)
          .eq("id", requestRowId);

        if (updateError) {
          console.log("Erro ao atualizar request da worklist", updateError.message);
        }
      } else {
        let query = supabase
          .from("request")
          .select("id")
          .eq("donor_id", donor_id)
          .eq("request_active", "True");

        if (request_name) {
          query = query.eq("request_name", request_name);
        }

        const { data: activeRequests, error: selectError } = await query;

        if (selectError) {
          console.log("Erro ao listar requests ativos", selectError.message);
        } else if (activeRequests?.length) {
          const { error: bulkError } = await supabase
            .from("request")
            .update(payload)
            .in(
              "id",
              activeRequests.map((r) => r.id)
            );

          if (bulkError) {
            console.log("Erro ao atualizar requests da worklist", bulkError.message);
          }
        }
      }
    }

    if(!error){
      return data;
    }

  } catch (error){
    console.log("Erro ao criar doação", error.message);
    throw error;
  }
  
};
