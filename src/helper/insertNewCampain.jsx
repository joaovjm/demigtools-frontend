import { toast } from "react-toastify";
import supabase from "./superBaseClient"

export const insertNewCampain = async (campain_name) => {

    const { data, error } = await supabase.from("campain").insert([{campain_name: campain_name}]).select()
    if (error) throw error;
    if(data.length > 0){
        toast.success("Campanha adicionada com sucesso...")
    }
}