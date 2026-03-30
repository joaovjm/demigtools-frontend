import apiClient from "../services/apiClient.js";

export async function fetchOperatorReportDonations({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
  searchType,
}) {
  const { data: envelope } = await apiClient.get(
    "/dashboard/operator-report/donations",
    {
      params: {
        operator_code_id: operatorCodeId,
        operator_type: operatorType,
        start_date: startDate,
        end_date: endDate,
        search_type: searchType,
      },
    }
  );

  if (!envelope?.success || envelope.data === undefined) {
    throw new Error(envelope?.message || "Resposta inválida do relatório");
  }

  return envelope.data;
}
