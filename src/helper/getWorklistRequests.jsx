import supabase from "./superBaseClient";

const getWorklistRequests = async (operatorID, workSelect) => {
  const { data, error } = await supabase
    .from("request")
    .select(
      `id, donor_id, operator_code_id, donor: donor_id(donor_name, donor_tel_1), donor_tel_2b: donor_id(donor_tel_2(donor_tel_2)), donor_mensal: donor_id(donor_mensal(donor_mensal_day, donor_mensal_monthly_fee)), donor_tel_3b: donor_id(donor_tel_3(donor_tel_3)), request_name, request_start_date, request_end_date, request_status, request_date_accessed,receipt_donation_id, donation: receipt_donation_id(donation_value, donation_day_received, operator_code_id)`
    )
    .eq("operator_code_id", operatorID)
    .eq("request_name", workSelect)
    .eq("request_active", "True");

  if (error) console.log(error.message); 
  if (!error) return data;
};

export default getWorklistRequests;
