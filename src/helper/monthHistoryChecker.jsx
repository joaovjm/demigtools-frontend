import supabase from "./superBaseClient";

export const monthHystoryChecker = async (mesrefGenerator) => {
    try {
      const { data, error } = await supabase
        .from("month_history")
        .select()
        .eq("date_ref", mesrefGenerator);
  
      if (error) throw error;
  
      if (data[0].date_ref === mesrefGenerator) {
        return true;
      }
    } catch (error) {
      return false;
    }
};