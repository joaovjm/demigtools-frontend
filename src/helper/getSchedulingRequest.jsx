import supabase from "./superBaseClient";

export const getSchedulingRequest = async ({
  operatorID,
  scheduled,
  setScheduled,
  setScheduling,
}) => {
  const { data, error } = await supabase
    .from("request")
    .select(
      "id, donor_id, donor: donor_id(donor_name, donor_tel_1, donor_address), operator_code_id, request_scheduled_date, request_observation, request_tel_success"
    )
    .eq("operator_code_id", operatorID)
    .eq("request_status", "Agendado");
  if (error) throw error;
  if (data.length > 0) {
    setScheduled((prev) => [...prev, ...data]);
  }
};
