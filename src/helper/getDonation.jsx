import supabase from "./superBaseClient"

export const getDonation = async (donor_id) => {
    try{
        const {data, error} = await supabase.from("donation").select(`
            *,
            collector_ult: ult_collector(collector_name),
            collector:collector_code_id (collector_name),
            operator:operator_code_id (operator_name)
            donor: donor_id (donor_type)
            donor_cpf: donor_id (donor_cpf)
        `).eq("donor_id", donor_id)
        .order("donation_day_to_receive", {ascending: false})
        .order("receipt_donation_id", {ascending: false})

        if (error) throw error
        return data
    } catch (error) {
        console.error("Erro ao buscar os dados: ", error.message)
    }
        
    

    
}