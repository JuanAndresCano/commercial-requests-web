import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, type UpdateServiceSpecsPayload } from "@/lib/api/requests";

/** HU 4.5 — Líder de Producto corrects operational specs the KAM filled in wrong. */
export function useUpdateServiceSpecs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateServiceSpecsPayload) => requestsApi.updateSpecs(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.id] });
    },
  });
}
