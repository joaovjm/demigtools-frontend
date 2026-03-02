import supabase from "./superBaseClient";

const getRequestById = async (requestId) => {
  try {
    // Buscar dados da requisição
    const { data: requestData, error: requestError } = await supabase
      .from("request")
      .select(`* , donor: donor_id(donor_tel_1), operator: operator_code_id(operator_name), donation: receipt_donation_id(donation_value, donation_day_received)`)
      .eq("request_name_id", requestId);
    if (requestError) {
      console.error("Erro ao buscar dados da requisição:", requestError);
      throw requestError;
    }

    // Buscar informações do nome da requisição
    /*const { data: requestNameData, error: requestNameError } = await supabase
      .from("request_name")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestNameError) {
      console.error("Erro ao buscar nome da requisição:", requestNameError);
      throw requestNameError;
    }*/

    return requestData || [];
  } catch (error) {
    console.error("Erro na função getRequestById:", error);
    throw error;
  }
};

export default getRequestById;
