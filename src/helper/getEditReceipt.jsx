import supabase from "./superBaseClient";

export async function getEditReceipt () {
    try{
        const { data, error } = await supabase.from("receipt_config").select()
        if (error) throw error;
        if (!error) return data;
    }catch(error){
        console.error(error)
    }
}