import supabase from "./superBaseClient";
import { toast } from "react-toastify";

const editLead = async (leadId, leadData) => {
  try {
    // Verifica se o ICPF já existe em outro lead
    if (leadData.icpf) {
      const { data: existingLead } = await supabase
        .from("leads")
        .select("leads_id")
        .eq("leads_icpf", leadData.icpf)
        .neq("leads_id", leadId)
        .single();

      if (existingLead) {
        toast.error("Este CPF/CNPJ já está cadastrado em outro lead!");
        return null;
      }
    }
    console.log(leadData)
    const updateData = {
      leads_name: leadData.name,
      leads_address: leadData.address,
      leads_neighborhood: leadData.neighborhood,
      leads_city: leadData.city,
      leads_icpf: leadData.icpf === "" ? null : leadData.icpf,
      leads_tel_1: leadData.tel1,
      leads_tel_2: leadData.tel2 || null,
      leads_tel_3: leadData.tel3 || null,
      leads_tel_4: leadData.tel4 || null,
      leads_tel_5: leadData.tel5 || null,
      leads_tel_6: leadData.tel6 || null,
      leads_email: leadData.email || null,
      leads_observation: leadData.observation || null,
    };

    const { data, error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("leads_id", leadId)
      .select();

    if (error) {
      // Mensagem amigável para erro de duplicidade
      if (error.code === "23505" || error.message.includes("duplicate key")) {
        toast.error("Este CPF/CNPJ já está cadastrado em outro lead!");
        return null;
      }
      console.error("Erro ao atualizar lead:", error.message);
      toast.error("Erro ao atualizar lead: " + error.message);
      throw error;
    }

    if (data && data.length > 0) {
      toast.success("Lead atualizado com sucesso!");
      return data[0];
    }

    return null;
  } catch (error) {
    console.error("Erro na função editLead:", error);
    throw error;
  }
};

export default editLead;

