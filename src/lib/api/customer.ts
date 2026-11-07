import { apiRequest } from "./client";
import type { CompanyType } from "./companies";
import type { ProposalDetail, UpdateProposalInfoPayload } from "./requests";

/** Dedicated customer-data contract: intentionally contains no operational or financial fields. */
export type CustomerUpdatePayload = Pick<
  UpdateProposalInfoPayload,
  | "companyName"
  | "companyNit"
  | "companyDescription"
  | "sector"
  | "website"
  | "companyAddress"
  | "companyPhone"
  | "companyEmail"
  | "ciiuCode"
  | "ciiuSecondary"
  | "contactName"
  | "contactEmail"
  | "contactPhone"
  | "contactRole"
  | "contactArea"
  | "contactSecondaryPhone"
  | "contactAlternativeEmail"
> & {
  /** null marks the legal nature as Pendiente again. */
  companyType?: CompanyType | null;
};

export const customerApi = {
  update: (id: string, data: CustomerUpdatePayload) =>
    apiRequest<ProposalDetail>(`/requests/${id}/customer`, { method: "PATCH", body: data }),
};
