import { toast } from "react-toastify"
import supabase from "./superBaseClient"

export const deleteCampain = async (id) => {
    const {data, error} = await supabase.from("campain").delete().eq("id", id)
    if (error){
        console.log("Error: ", error.message)
    } else {
        toast.success("Campanha deletada com sucesso...")
    }
}