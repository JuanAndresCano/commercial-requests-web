import { useQuery } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => requestsApi.getDashboardMetrics(),
    staleTime: 10_000,
  });
}
