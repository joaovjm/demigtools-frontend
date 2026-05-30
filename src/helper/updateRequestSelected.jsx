import { toast } from "react-toastify";
import { normalizeStatus } from "../utils/statusUtils";
import { updateRequestStatus } from "../api/modalScheduledApi";

const updateRequestSelected = async (status, id, setModalOpen, setActive) => {
  try {
    const statusArray = normalizeStatus(status);
    const body = await updateRequestStatus({ id, status: statusArray });

    if (!body?.data?.length) {
      toast.error("Erro ao atualizar status");
      return null;
    }

    toast.success("Processo concluído com sucesso");
    if (setModalOpen) setModalOpen(false);
    if (setActive) setActive("");

    return body.data;
  } catch (error) {
    console.error(error?.message || error);
    toast.error("Erro ao atualizar status");
    return null;
  }
};

export default updateRequestSelected;
