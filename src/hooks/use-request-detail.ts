import { useQuery } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";
import { LIVE_REFRESH_MS } from "@/lib/live-refresh";

export function useRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["requests", id],
    queryFn: () => {
      if (!id) throw new Error("Request ID is required");
      return requestsApi.getById(id);
    },
    enabled: Boolean(id),
    staleTime: 10_000,
    refetchInterval: LIVE_REFRESH_MS,
    retry: false,
  });
}
