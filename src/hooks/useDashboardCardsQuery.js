import { useQuery } from "@tanstack/react-query";
import { fetchDashboardCards } from "../api/dashboardApi.js";
import { queryKeys } from "./queryKeys.js";

export function useDashboardCardsQuery({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
  enabled = true,
}) {
  return useQuery({
    queryKey: queryKeys.dashboard.cards(
      operatorCodeId,
      operatorType,
      startDate ?? null,
      endDate ?? null
    ),
    queryFn: () =>
      fetchDashboardCards({
        operatorCodeId,
        operatorType,
        startDate,
        endDate,
      }),
    enabled:
      Boolean(enabled) &&
      operatorCodeId !== undefined &&
      operatorCodeId !== null &&
      operatorCodeId !== "",
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: (previousData) => previousData,
  });
}

