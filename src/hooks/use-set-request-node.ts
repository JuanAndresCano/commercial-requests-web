import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, type SetNodePayload } from "@/lib/api/requests";

/** C-06 — the Product Leader (owner) puts, changes or removes the node of a request. */
export function useSetRequestNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & SetNodePayload) => requestsApi.setNode(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.id] });
    },
  });
}
