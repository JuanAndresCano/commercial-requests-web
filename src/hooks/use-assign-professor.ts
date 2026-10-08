import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, type AssignProfessorTarget } from "@/lib/api/requests";

/**
 * HU 4.2 — assigns a professor/advisor to a proposal: an existing directory entry (`professorId`) or the
 * typed data (`professor`, created or reused by the backend). It does not change the status.
 */
export function useAssignProfessor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, target }: { id: string; target: AssignProfessorTarget }) =>
      requestsApi.assignProfessor(id, target),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.id] });
      // A typed professor may have just been added to the directory.
      queryClient.invalidateQueries({ queryKey: ["professors"] });
    },
  });
}
