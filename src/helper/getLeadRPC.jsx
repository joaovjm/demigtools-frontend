import supabase from "./superBaseClient";

const GetLeadRPC = async (setItems, setCurrentLead, operatorID) => {
  try {
    const { data, error } = await supabase.rpc("fetch_and_lock_lead", {
      p_operator_id: operatorID,
    });

    if (error) {
      console.error("Erro na função RPC:", error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.log("Nenhum lead disponível.");
      return null;
    }

    setCurrentLead(data[0]);
    setItems((prev) => prev + 1); // ou outro controle

    return data[0];

  } catch (err) {
    console.error("Erro ao buscar o lead:", err.message);
    return null;
  }
};

export default GetLeadRPC;