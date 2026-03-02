import supabase from "./superBaseClient"

const editOperator = async ({ id, name, type, active, password }) => {
    try{
        const { data, error } = await supabase.from("operator").update({
            operator_name: name,
            operator_type: type,
            operator_active: active,
            operator_password: password
        })
        .eq("operator_code_id", id)
        .select();

        if (error) throw error;

        if (!error) {
            return "success"
        }
    
    } catch (error) {
        console.error("Erro: ", error)
    }
    
}

export default editOperator;