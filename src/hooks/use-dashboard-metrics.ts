import { useQuery } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";
import { LIVE_REFRESH_MS } from "@/lib/live-refresh";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => requestsApi.getDashboardMetrics(),
    staleTime: 10_000,
    refetchInterval: LIVE_REFRESH_MS,
  });
}
