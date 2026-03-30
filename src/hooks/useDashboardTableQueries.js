import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardLeadsTable,
  fetchDashboardReceivedTable,
  fetchDashboardConfirmationTable,
  fetchDashboardOpenTable,
  fetchDashboardScheduledTable,
} from "../api/dashboardApi.js";
import { queryKeys } from "./queryKeys.js";

export function useDashboardLeadsTableQuery({ startDate, endDate, enabled }) {
  return useQuery({
    queryKey: queryKeys.dashboard.tableLeads(startDate ?? null, endDate ?? null),
    queryFn: () => fetchDashboardLeadsTable({ startDate, endDate }),
    enabled: Boolean(enabled),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: (previousData) => previousData,
  });
}

export function useDashboardReceivedTableQuery({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
  enabled,
}) {
  return useQuery({
    queryKey: queryKeys.dashboard.tableReceived(
      operatorCodeId,
      operatorType,
      startDate ?? null,
      endDate ?? null
    ),
    queryFn: () =>
      fetchDashboardReceivedTable({
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

export function useDashboardConfirmationTableQuery({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
  enabled,
}) {
  return useQuery({
    queryKey: queryKeys.dashboard.tableConfirmation(
      operatorCodeId,
      operatorType,
      startDate ?? null,
      endDate ?? null
    ),
    queryFn: () =>
      fetchDashboardConfirmationTable({
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

export function useDashboardOpenTableQuery({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
  enabled,
}) {
  return useQuery({
    queryKey: queryKeys.dashboard.tableOpen(
      operatorCodeId,
      operatorType,
      startDate ?? null,
      endDate ?? null
    ),
    queryFn: () =>
      fetchDashboardOpenTable({
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

export function useDashboardScheduledTableQuery({
  operatorCodeId,
  operatorType,
  startDate,
  endDate,
  enabled,
}) {
  return useQuery({
    queryKey: queryKeys.dashboard.tableScheduled(
      operatorCodeId,
      operatorType,
      startDate ?? null,
      endDate ?? null
    ),
    queryFn: () =>
      fetchDashboardScheduledTable({
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

