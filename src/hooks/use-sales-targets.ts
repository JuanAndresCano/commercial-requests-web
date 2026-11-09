import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { requestsApi, type SalesTargetsResponse, type UpsertSalesTargetsPayload } from "@/lib/api/requests";
import { LIVE_REFRESH_MS } from "@/lib/live-refresh";

export function useSalesTargets(year?: number, kamId?: string) {
  return useQuery<SalesTargetsResponse>({
    queryKey: ["sales-targets", year, kamId],
    queryFn: () => requestsApi.getSalesTargets(year, kamId),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useUpdateSalesTargets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertSalesTargetsPayload) => requestsApi.upsertSalesTargets(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sales-targets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-trends", variables.year] });
    },
  });
}
