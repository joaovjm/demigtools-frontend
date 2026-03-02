import supabase from "./superBaseClient";

const getAllRequests = async () => {
  try {
    const { data, error } = await supabase
      .from("request_name")
      .select()
      .order("date_created", { ascending: false });

    if (error) {
      console.error("Erro ao buscar requisições:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Erro na função getAllRequests:", error);
    return [];
  }
};

export default getAllRequests;
