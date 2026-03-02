import supabase from "./superBaseClient";
import { DataNow } from "../components/DataTime";

const getCollectorPerReceived = async (startDate, endDate) => {
  try {
    if (startDate > DataNow("noformated")) {
      const { data, error } = await supabase
        .from("donation")
        .select(
          "collector_code_id, collector_name: collector_code_id(collector_name), donation_received, donation_value"
        )
        .gte("donation_day_to_receive", startDate)
        .lte("donation_day_to_receive", endDate)
        .not("collector_code_id", "is", null)
      if (error) throw error;

      return data;
    } else {
      const { data, error } = await supabase
        .from("donation")
        .select(
          "collector_code_id, collector_name: collector_code_id(collector_name), donation_received, donation_value"
        )
        .gte("donation_day_received", startDate)
        .lte("donation_day_received", endDate)
        .not("collector_code_id", "is", null)
      if (error) throw error;

      return data;
    }
  } catch (error) {
    console.log("Erro: ", error.message);
  }
};

export default getCollectorPerReceived;
