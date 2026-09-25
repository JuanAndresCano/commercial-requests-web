import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  requestsApi,
  type BackendProgramModality,
  type BackendRequestType,
  type BackendStatusCode,
} from "@/lib/api/requests";
import { mapProposalToRequestItem } from "@/lib/api/map-proposal";
import { nodesApi } from "@/lib/api/nodes";
import { usersApi } from "@/lib/api/users";
import type { RequestItem } from "@/lib/mock-data";

const requestKeys = {
  detail: (id: string) => ["requests", "detail", id] as const,
  productLeaderQueue: () => ["requests", "product-leader-queue"] as const,
};

/** The Product Leader's own proposals, real backend data (HU 4.1). REJECTED entries are
 * dropped — the front has no Kanban column for them yet (see map-proposal.ts). */
export function useProductLeaderQueue() {
  return useQuery({
    queryKey: requestKeys.productLeaderQueue(),
    queryFn: async (): Promise<RequestItem[]> => {
      const proposals = await requestsApi.list({ role: "PRODUCT_LEADER" });
      return proposals.map(mapProposalToRequestItem).filter((r): r is RequestItem => r !== null);
    },
  });
}

/** A single proposal by id, real backend data. `undefined` while loading, `null` if it
 * does not exist (404) or is REJECTED (no front representation yet). */
export function useProposal(id: string | undefined) {
  return useQuery({
    queryKey: requestKeys.detail(id ?? ""),
    queryFn: async (): Promise<RequestItem | null> => {
      const proposal = await requestsApi.getById(id!);
      return mapProposalToRequestItem(proposal);
    },
    enabled: !!id,
  });
}

/** Every mutation below takes the proposal id as part of its variables (not as a hook
 * argument) so the same hook instance works both for a single fixed proposal
 * (RequestDetail) and for any card in a list (the Kanban's Dashboard). Each invalidates
 * that proposal's detail query plus the shared queue on success. */
function useProposalMutation<TVars extends { id: string }, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_result, vars) => {
      void client.invalidateQueries({ queryKey: requestKeys.detail(vars.id) });
      void client.invalidateQueries({ queryKey: requestKeys.productLeaderQueue() });
    },
  });
}

/** Covers every transition in commercial-requests-backend's ALLOWED_TRANSITIONS:
 * NEW->IN_PROGRESS, IN_PROGRESS->IN_COSTING (Product Leader), IN_COSTING->DELIVERED,
 * DELIVERED->IN_COSTING/REJECTED (KAM). One hook, same as the one backend endpoint. */
export function useUpdateProposalStatus() {
  return useProposalMutation((vars: { id: string; status: BackendStatusCode; rejectionReason?: string }) =>
    requestsApi.updateStatus(vars.id, vars.status, vars.rejectionReason),
  );
}

export function useAssignProfessorMutation() {
  return useProposalMutation((vars: { id: string; professorId: string }) =>
    requestsApi.assignProfessor(vars.id, vars.professorId),
  );
}

export function useMarkReadyForKam() {
  return useProposalMutation((vars: { id: string; leaderNote?: string }) =>
    requestsApi.markReadyForKam(vars.id, vars.leaderNote),
  );
}

export function useReassignProposal() {
  return useProposalMutation(
    ({ id, ...data }: { id: string; newProductLeaderId: string; newNodeId: string; reason: string; note?: string }) =>
      requestsApi.reassign(id, data),
  );
}

export function useUpdateServiceSpecs() {
  return useProposalMutation(
    ({
      id,
      ...data
    }: {
      id: string;
      totalHours?: number;
      programModality?: BackendProgramModality;
      minParticipants?: number;
      maxParticipants?: number;
      requestType?: BackendRequestType;
      requestTypeOther?: string;
      deadline?: string;
    }) => requestsApi.updateSpecs(id, data),
  );
}

/** Minimal costing (offered value only) — see requests.ts on why margin/Pro-Cultura
 * stay client-side preview fields until HU 5.1 builds the real costing UI. */
export function useUpsertCostingMinimal() {
  return useProposalMutation((vars: { id: string; totalCost: number }) =>
    requestsApi.upsertCosting(vars.id, vars.totalCost),
  );
}

/** Reassignment target lists (HU 4.4) — real nodes and active Product Leaders, so the
 * dialog's dropdowns carry real ids instead of the mock name lists. */
export function useNodes() {
  return useQuery({ queryKey: ["nodes"], queryFn: () => nodesApi.list(), staleTime: 60_000 });
}

export function useProductLeaders() {
  return useQuery({
    queryKey: ["users", "PRODUCT_LEADER"],
    queryFn: () => usersApi.findByRole("PRODUCT_LEADER"),
    staleTime: 60_000,
  });
}
