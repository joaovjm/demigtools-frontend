import { toast } from "react-toastify";
import supabase from "./superBaseClient";

export const updateCampains = async (updateCampain) => {
  const { data, error } = await supabase
    .from("campain")
    .update({ campain_name: updateCampain.campain_name })
    .eq("id", updateCampain.id)
    .select();
  if (error) console.log(error.message);
  if (data.length > 0) toast.success("Campanha atualizada com sucesso...");
};
