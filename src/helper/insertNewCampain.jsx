import { toast } from "react-toastify";
import { createCampainRequest } from "../api/campainsApi";

export const insertNewCampain = async (campain_name) => {
    const response = await createCampainRequest(campain_name);
    if(response?.success){
        toast.success("Campanha adicionada com sucesso...")
    }
}