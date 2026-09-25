import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";

/** Product Leader confirms the current costing is ready for the KAM to deliver
 * ("Enviar a KAM") — opens a NegotiationRound on the backend. */
export function useMarkReadyForKam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, leaderNote }: { id: string; leaderNote?: string }) =>
      requestsApi.markReadyForKam(id, leaderNote),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.id] });
    },
  });
}
