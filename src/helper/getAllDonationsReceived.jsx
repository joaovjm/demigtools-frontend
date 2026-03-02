import { DataNow } from "../components/DataTime";
import supabase from "./superBaseClient";

const getAllDonationsReceived = async ({ startDate, endDate }) => {
  let totalValue = 0;
  let donation = [];
  
  // Se startDate e endDate foram fornecidos, usar eles. Caso contrário, usar o mês atual
  let dataInicio, dataFim;
  
  if (startDate && endDate) {
    dataInicio = startDate;
    dataFim = endDate;
  } else if (startDate) {
    // Se apenas startDate foi fornecido, usar até o último dia do mês atual
    dataInicio = startDate;
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
    const ultimoDia = new Date(ano, dataAtual.getMonth() + 1, 0).getDate();
    dataFim = `${ano}-${mes}-${String(ultimoDia).padStart(2, "0")}`;
  } else if (endDate) {
    // Se apenas endDate foi fornecido, usar desde o primeiro dia do mês atual
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
    dataInicio = `${ano}-${mes}-01`;
    dataFim = endDate;
  } else {
    // Calcular primeiro e último dia do mês atual
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
    dataInicio = `${ano}-${mes}-01`;
    const ultimoDia = new Date(ano, dataAtual.getMonth() + 1, 0).getDate();
    dataFim = `${ano}-${mes}-${String(ultimoDia).padStart(2, "0")}`;
  }
  
  let query = supabase
    .from("donation")
    .select(`
      donation_value, 
      donor: donor_id(donor_name), 
      donation_day_received,
      operator_code_id,
      operator_name: operator_code_id(operator_name)
    `)
    .eq("donation_received", "Sim")
    .gte("donation_day_received", dataInicio)
    .lte("donation_day_received", dataFim)
    .not("operator_code_id", "is", null);

  try {
    const { data: operatorValue, error } = await query;
    if (error) throw error;
    if (!error) {
      for (let i = 0; i < operatorValue.length; i++) {
        let value = operatorValue[i].donation_value;
        totalValue = totalValue + value;
      }
    }
    donation = operatorValue;
  } catch (error) {
    console.error("Error", error.message);
  }
  return { totalValue, donation };
};

export default getAllDonationsReceived;

