import { useQuery } from "@tanstack/react-query";
import { requestsApi, type RequestsQueryParams } from "@/lib/api/requests";

export function useRequests(params: RequestsQueryParams = {}) {
  return useQuery({
    queryKey: ["requests", params],
    queryFn: () => requestsApi.list(params),
    staleTime: 10_000,
  });
}
