import { useQuery } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";
import { LIVE_REFRESH_MS } from "@/lib/live-refresh";

export interface UseAdminDashboardParams {
  year?: number;
  quarter?: number;
}

export function useAdminDashboard(params: UseAdminDashboardParams = {}) {
  const { year, quarter } = params;

  return useQuery({
    queryKey: ["admin-dashboard", year, quarter],
    queryFn: () => requestsApi.getAdminDashboard({ year, quarter }),
    staleTime: 10_000,
    refetchInterval: LIVE_REFRESH_MS,
  });
}
