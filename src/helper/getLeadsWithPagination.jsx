import supabase from "./superBaseClient";

const GetLeadsWithPagination = async (
  start,
  end,
  setItems,
  setCurrentLead,
  operatorID,
  neighborhood = ""
) => {
  try {
    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .or(
        `leads_status.eq.Nunca Ligado,and(leads_status.eq.Aberto,operator_code_id.eq.${operatorID})`
      );

    // Adicionar filtro por bairro se especificado
    if (neighborhood && neighborhood.trim() !== "") {
      query = query.eq("leads_neighborhood", neighborhood);
    }

    // Ordenar por date_received quando o bairro é AACRECHE
    let orderBy = "leads_id";
    let orderAscending = true;
    if (neighborhood && neighborhood.trim() === "AACRECHE") {
      orderBy = "date_received";
      orderAscending = false; // Mais recentes primeiro
    }

    const { data, error, count } = await query
      .range(start, end)
      .order(orderBy, { ascending: orderAscending })
      .limit(1);

    setCurrentLead(data?.[0] || null);
    setItems(count || 0);

    return data;
  } catch (error) {
    // Erro 416 (Range Not Satisfiable) significa que não há mais leads disponíveis
    if (error.message && error.message.includes("Range Not Satisfiable")) {
      console.log("Não há mais leads disponíveis na posição solicitada");
    } else {
      console.error("Erro ao buscar os dados", error.message);
    }
    setItems(0);
    setCurrentLead(null);
    return [];
  }
};

export default GetLeadsWithPagination;
