import supabase from "./superBaseClient"

export const getCampains = async () => {
    const {data, error} = await supabase.from("campain").select().eq("active", true);
    if (error){
        console.log(error.message)
    } else {
        return data;
    }

    
}