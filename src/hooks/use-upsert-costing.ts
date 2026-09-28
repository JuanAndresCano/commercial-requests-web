import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, type UpsertCostingPayload } from "@/lib/api/requests";

/** HU 5.1 — saves the offered value and the contribution margin (see requestsApi.upsertCosting
 * for what an omitted, null or 0 margin means). Pro-Cultura stays a client-side reference.
 * The detail is refetched whether the save worked (a new current row, readyForKam back to false)
 * or not (so the form shows what the backend really holds). */
export function useUpsertCosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpsertCostingPayload) => requestsApi.upsertCosting(id, payload),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.id] });
    },
  });
}
