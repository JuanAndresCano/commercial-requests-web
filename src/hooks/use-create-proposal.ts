import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, type CreateProposalPayload } from "@/lib/api/requests";

export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProposalPayload) => requestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}
