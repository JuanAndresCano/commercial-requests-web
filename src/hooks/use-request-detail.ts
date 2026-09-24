import { useQuery } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";

export function useRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["requests", id],
    queryFn: () => {
      if (!id) throw new Error("Request ID is required");
      return requestsApi.getById(id);
    },
    enabled: Boolean(id),
    staleTime: 10_000,
  });
}
