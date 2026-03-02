import supabase from "./superBaseClient";

const getScheduledLeads = async (
  operator_code_id,
  setScheduled,
  setScheduling
) => {
  let query = supabase
    .from("leads")
    .select("*, operator_name: operator_code_id(operator_name)")
    .eq("leads_status", "agendado")
    .order("leads_scheduling_date", { ascending: true })

    if(operator_code_id){
      query = query.eq("operator_code_id", operator_code_id);
    }
    
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching scheduled leads:", error);
    setScheduled([]);
  }
  let count = 0;

  for (let i = 0; i < data.length; i++) {
    count += 1;
  }

  setScheduled(data);
  setScheduling(count);

  return data;
};

export default getScheduledLeads;
