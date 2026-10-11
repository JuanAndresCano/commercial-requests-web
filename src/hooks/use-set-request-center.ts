import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, type SetCenterPayload } from "@/lib/api/requests";

/** C-07 — the Product Leader (owner) types the center and the cost center of a request. */
export function useSetRequestCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & SetCenterPayload) => requestsApi.setCenter(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.id] });
    },
  });
}
