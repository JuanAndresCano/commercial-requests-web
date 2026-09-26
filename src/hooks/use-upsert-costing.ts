import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";

/** Minimal costing (offered value only) — see requests.ts on why margin/Pro-Cultura
 * stay client-side preview fields until HU 5.1 (Persona 4) builds the real costing UI. */
export function useUpsertCosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, totalCost }: { id: string; totalCost: number }) => requestsApi.upsertCosting(id, totalCost),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.id] });
    },
  });
}
