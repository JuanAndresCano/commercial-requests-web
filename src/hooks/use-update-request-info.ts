import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, type UpdateProposalInfoPayload } from "@/lib/api/requests";

export function useUpdateRequestInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProposalInfoPayload }) => requestsApi.updateInfo(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}
