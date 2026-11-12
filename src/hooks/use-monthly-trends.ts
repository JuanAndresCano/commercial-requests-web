import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { requestsApi, type MonthlyTrendsData } from "@/lib/api/requests";
import { LIVE_REFRESH_MS } from "@/lib/live-refresh";

export function useMonthlyTrends(year?: number) {
  return useQuery<MonthlyTrendsData>({
    queryKey: ["monthly-trends", year],
    queryFn: () => requestsApi.getMonthlyTrends(year),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchInterval: LIVE_REFRESH_MS,
  });
}
