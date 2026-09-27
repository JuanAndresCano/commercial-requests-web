import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";

/** HU 4.2 — assigns a directory professor (staff or external) to a proposal. */
export function useAssignProfessor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, professorId }: { id: string; professorId: string }) =>
      requestsApi.assignProfessor(id, professorId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.id] });
    },
  });
}
