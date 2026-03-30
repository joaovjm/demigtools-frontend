import { toast } from "react-toastify"
import { deleteCampainRequest } from "../api/campainsApi"

export const deleteCampain = async (id) => {
    const response = await deleteCampainRequest(id);
    if (response?.success){
        toast.success("Campanha deletada com sucesso...")
    }
}