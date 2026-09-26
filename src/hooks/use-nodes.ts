import { useQuery } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api/requests";

/** `enabled` defaults to true, but callers on a detail page should pass
 * `isRealProposal && isLeader` (HU 4.4 reassignment) — this hides nothing on the
 * backend, but there's no reason to fetch it outside that one connected flow. */
export function useNodes(enabled = true) {
  return useQuery({
    queryKey: ["nodes"],
    queryFn: () => requestsApi.getNodes(),
    staleTime: 60_000,
    enabled,
  });
}
