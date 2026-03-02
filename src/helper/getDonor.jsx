import supabase from "./superBaseClient";

export const getInfoDonor = async (id) => {
    const { data, error } = await supabase
      .from("donor")
      .select(`
        donor_name,
        donor_type,
        donor_address,
        donor_city,
        donor_neighborhood,
        donor_tel_1,
        donor_cpf (donor_cpf),
        donor_email (donor_email),
        donor_tel_2 (donor_tel_2),
        donor_tel_3 (donor_tel_3),
        donor_mensal (donor_mensal_day, donor_mensal_monthly_fee),
        donor_observation (donor_observation),
        donor_reference (donor_reference)`)
      .eq("donor_id", id);
    return data;
   
};