import { useQuery } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";

export function useNodes() {
  return useQuery({
    queryKey: ["nodes"],
    queryFn: () => requestsApi.getNodes(),
    staleTime: 60_000,
  });
}
