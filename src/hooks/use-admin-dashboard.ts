import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";
import { LIVE_REFRESH_MS } from "@/lib/live-refresh";

export interface UseAdminDashboardParams {
  year?: number;
  quarter?: number;
  month?: number;
}

export function useAdminDashboard(params: UseAdminDashboardParams = {}) {
  const { year, quarter, month } = params;

  return useQuery({
    queryKey: ["admin-dashboard", year, quarter, month],
    queryFn: () => requestsApi.getAdminDashboard({ year, quarter, month }),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchInterval: LIVE_REFRESH_MS,
  });
}
