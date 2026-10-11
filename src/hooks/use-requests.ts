import { useQuery } from "@tanstack/react-query";
import { requestsApi, type RequestsQueryParams } from "@/lib/api/requests";
import { LIVE_REFRESH_MS } from "@/lib/live-refresh";

export function useRequests(params: RequestsQueryParams = {}) {
  return useQuery({
    queryKey: ["requests", params],
    queryFn: () => requestsApi.list(params),
    staleTime: 10_000,
    refetchInterval: LIVE_REFRESH_MS,
  });
}
