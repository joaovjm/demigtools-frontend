import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../api/dashboardApi.js";
import { queryKeys } from "./queryKeys.js";

/**
 * Busca agregada do Dashboard Admin (GET /api/dashboard) com cache React Query.
 */
export function useDashboardQuery({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
  enabled = true,
}) {
  return useQuery({
    queryKey: queryKeys.dashboard.detail(
      operatorCodeId,
      operatorType,
      startDate ?? null,
      endDate ?? null
    ),
    queryFn: () =>
      fetchDashboard({
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
