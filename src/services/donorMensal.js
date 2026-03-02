import supabase from "../helper/superBaseClient";

export async function getDonorMensalDaily({startDate, endDate}) {
  let query = supabase
    .from("donor_mensal_daily_summary")
    .select("summary_date, total_mensal")
    .order("summary_date", { ascending: true });

  if (startDate) {
    query = query.gte("summary_date", startDate);
  }

  if (endDate) {
    query = query.lte("summary_date", endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getDonorMonthlyPercent(){
  try{
    const { data, error } = await supabase
    .from("donor_mensal_daily_summary")
    .select("*")
    .order("summary_date", { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.log("Erro ao buscar dados mensais:", error.message);
  }
}

export async function getDonorMonthlyPercentDailyEvolution(){
  try{
    const { data, error } = await supabase
        .from("donor_mensal_daily_evolution")
        .select("*")
        .order("summary_date");

      if (!error) {
        return data;
      } else {
        console.log("Erro ao buscar dados de evolução diária:", error.message);
      }
  } catch (error) {
    console.log("Erro ao buscar dados de evolução diária:", error.message);
  }
}
