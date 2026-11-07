import { apiRequest } from "./client";
import type { ProposalDetail } from "./requests";

/** Fixed, mutually exclusive follow-up values of PATCH /requests/:id/commercial-status. */
export type CommercialStatus = "APPROVED_WITHOUT_CONTRACT" | "APPROVED_WITH_CONTRACT" | "INVOICED" | "REJECTED";

export interface CommercialStatusChange {
  id: string;
  previousStatus: CommercialStatus | null;
  status: CommercialStatus | null;
  changedAt: string;
  changedBy: { id: string; firstName: string | null; lastName: string | null };
}

export const commercialStatusApi = {
  update: (proposalId: string, status: CommercialStatus | null) =>
    apiRequest<ProposalDetail>(`/requests/${proposalId}/commercial-status`, {
      method: "PATCH",
      body: { status },
    }),
};
