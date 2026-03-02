import supabase from "./superBaseClient";

const getOperatorDonationsReceived = async ({ startDate, endDate, operatorId = null, searchType = "received" }) => {
  let totalValue = 0;
  let donation = [];
  
  try {
    // Determinar qual campo usar baseado no tipo de busca
    let dateField;
    switch (searchType) {
      case "received":
        dateField = "donation_day_received";
        break;
      case "open":
        dateField = "donation_day_to_receive";
        break;
      case "created":
        dateField = "donation_day_contact";
        break;
      default:
        dateField = "donation_day_received";
    }

    let query = supabase
      .from("donation")
      .select(`
        donation_value, 
        donor: donor_id(donor_name), 
        donation_day_received,
        donation_day_to_receive,
        donation_day_contact,
        operator_code_id,
        operator_name: operator_code_id(operator_name)
      `);

    // Aplicar filtro de recebido apenas se for busca por recebido
    if (searchType === "received") {
      query = query.eq("donation_received", "Sim");
    }

    // Aplicar filtro de data baseado no tipo de busca
    query = query
      .gte(dateField, startDate)
      .lte(dateField, endDate)
      .not("operator_code_id", "is", null);

    // Se um operador específico for fornecido, filtrar por ele
    if (operatorId) {
      query = query.eq("operator_code_id", operatorId);
    }

    const { data: operatorValue, error } = await query;
    
    if (error) throw error;
    
    if (operatorValue && operatorValue.length > 0) {
      for (let i = 0; i < operatorValue.length; i++) {
        let value = operatorValue[i].donation_value;
        totalValue = totalValue + value;
      }
      donation = operatorValue;
    }
    
    return { totalValue, donation };
  } catch (error) {
    console.error("Error fetching operator donations:", error.message);
    return { totalValue: 0, donation: [] };
  }
};

export default getOperatorDonationsReceived;

