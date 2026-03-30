import { fetchLeadsPaginated } from "../api/leadsApi.js";

const GetLeadsWithPagination = async (
  start,
  end,
  setItems,
  setCurrentLead,
  operatorID,
  neighborhood = ""
) => {
  try {
    const out = await fetchLeadsPaginated({
      operatorCodeId: operatorID,
      start,
      neighborhood,
    });

    const data = out?.data ?? [];
    setCurrentLead(data?.[0] || null);
    setItems(out?.total ?? 0);

    return data;
  } catch (error) {
    console.error("Erro ao buscar os dados", error?.message || error);
    setItems(0);
    setCurrentLead(null);
    return [];
  }
};

export default GetLeadsWithPagination;
