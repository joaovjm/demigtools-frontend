import { toast } from "react-toastify";
import { editLeadDetails } from "../api/leadsApi.js";

const editLead = async (leadId, leadData) => {
  try {
    const resp = await editLeadDetails({
      leadsId: leadId,
      leadData: {
        name: leadData.name,
        address: leadData.address,
        neighborhood: leadData.neighborhood,
        city: leadData.city,
        icpf: leadData.icpf,
        tel1: leadData.tel1,
        tel2: leadData.tel2,
        tel3: leadData.tel3,
        tel4: leadData.tel4,
        tel5: leadData.tel5,
        tel6: leadData.tel6,
        email: leadData.email,
        observation: leadData.observation,
      },
    });

    if (resp?.data) {
      toast.success("Lead atualizado com sucesso!");
      return resp.data;
    }

    return null;
  } catch (error) {
    console.error("Erro na função editLead:", error);
    toast.error(error?.message || "Erro ao atualizar lead");
    return null;
  }
};

export default editLead;

