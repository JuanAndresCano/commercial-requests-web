import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, type ReassignProposalPayload } from "@/lib/api/requests";

/** HU 4.4 — reassign to another Product Leader (and node), only while NEW/IN_PROGRESS. */
export function useReassignProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & ReassignProposalPayload) => requestsApi.reassign(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.id] });
    },
  });
}
