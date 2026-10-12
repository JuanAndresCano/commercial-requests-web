import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";

/** HU 4.4 reassignment target list — no equivalent in the KAM-side hooks; the
 * Product Leader directory is only needed here. `enabled` mirrors use-nodes.ts. */
export function useProductLeaders(enabled = true) {
  return useQuery({
    queryKey: ["users", "PRODUCT_LEADER"],
    queryFn: () => usersApi.findByRole("PRODUCT_LEADER"),
    staleTime: 60_000,
    enabled,
  });
}
