import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";

export interface DeleteRequestArgs {
  id: string;
  reason?: string;
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: string | DeleteRequestArgs) => {
      const id = typeof args === "string" ? args : args.id;
      const reason = typeof args === "string" ? undefined : args.reason;
      return requestsApi.delete(id, reason ? { reason } : undefined);
    },
    onSuccess: (_data, args) => {
      const id = typeof args === "string" ? args : args.id;
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}
