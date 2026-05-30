import { toast } from "react-toastify";
import { patchCampainRequest } from "../api/campainsApi";

export const updateCampains = async (updateCampain) => {
  const response = await patchCampainRequest(updateCampain.id, updateCampain.campain_name);
  if (response?.success) toast.success("Campanha atualizada com sucesso...");
};
