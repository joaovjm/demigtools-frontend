import supabase from "./superBaseClient";

export const getCollector = async () => {
  try {
    const { data, error } = await supabase.from("collector").select(`*`).neq("collector_name", "???");

    if (error) throw error;

    if (error) {
      console.log("Erro ao buscar os coletadores: ", error.message);
    }

    return data;
  } catch (error) {
    console.log(error)
  }
};
