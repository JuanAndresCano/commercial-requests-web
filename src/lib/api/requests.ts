import { apiRequest } from "./client";
import type { Company, CompanyType } from "./companies";
import type { ProfessorInput } from "./professors";

export type { Company, CompanyType };

/** Body of PATCH /requests/:id/professor: exactly one of the two. */
export type AssignProfessorTarget = { professorId: string } | { professor: ProfessorInput };

export type ProposalPriority = "ALTA" | "MEDIA" | "BAJA";

export type RequestType = "CAPACITACION" | "CONSULTORIA" | "MENTORIA" | "INVESTIGACION" | "SPECIAL_PROJECTS" | "OTHER";

export type ProgramType = "CHARLA" | "TALLER" | "CURSO" | "SEMINARIO" | "PROGRAMA_MODULAR";

export type ProgramModality = "VIRTUAL" | "PRESENCIAL_ICESI" | "PRESENCIAL_CLIENTE" | "PRESENCIAL_OTRO" | "HIBRIDA";

export interface ProposalContact {
  id: string;
  companyId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  areaDependency: string | null;
  secondaryPhone?: string | null;
  alternativeEmail?: string | null;
}

/** A client contact beyond the main one. */
export interface ProposalAdditionalContact {
  id: string;
  name: string | null;
  role: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  position: number;
}

export interface ProposalNode {
  id: string;
  name: string;
  description: string | null;
}

export interface ProposalUserSummary {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface ProposalProgram {
  id: string;
  proposalId: string;
  requestType: RequestType | null;
  requestTypeOther: string | null;
  programType: ProgramType | null;
  programModality: ProgramModality | null;
  virtualityModality: string | null;
  objective: string | null;
  programDescription: string | null;
  totalHours: number | null;
  hoursAtProfessorDiscretion: boolean | null;
  minParticipants: number | null;
  maxParticipants: number | null;
  participantArea: string | null;
  participantProfile: string | null;
  previousTraining: string | null;
  previousTrainingDetail: string | null;
  previousTrainingCompany: string | null;
  previousTrainingDate: string | null;
  requiresCatering: boolean | null;
  cateringNotes: string | null;
  expectedResults: string | null;
  successMetrics: string | null;
  competencies: string | null;
}

export interface ProposalLogistics {
  id: string;
  proposalId: string;
  participantLocation: string | null;
  executionPlace: string | null;
  proposedSchedule: string | null;
}

export interface ProposalWorkflowStatus {
  id: string;
  code: string;
  name: string;
}

export interface ProposalWorkflow {
  id: string;
  proposalId: string;
  currentStatusId: string;
  requestDate: string | null;
  proposalCreationDate: string | null;
  clientSentDate: string | null;
  clientApprovalDate: string | null;
  closingDate: string | null;
  deadline: string | null;
  currentStatusSince: string | null;
  currentStatus: ProposalWorkflowStatus;
}

/** Body of PUT /requests/:id/costing (UpsertCostingDto). Margin percentage is 0-100; amounts are COP. */
export interface UpsertCostingPayload {
  totalCost: number;
  marginPercentage?: number | null;
  marginAmount?: number | null;
  /** "Nota de alcance comercial" of the current costing row: the KAM sees it next to the offered value.
   * Left out it keeps the previous note, null (or empty) clears it. */
  negotiationNotes?: string | null;
}

export interface ProposalEconomics {
  id: string;
  proposalId: string;
  isCurrent: boolean;
  date: string | null;
  grossValue: string | number | null;
  participantCount: number | null;
  valuePerParticipant: string | number | null;
  estimatedCost?: string | number | null;
  estimatedMargin?: string | number | null;
  marginPercentage?: string | number | null;
  /** "Nota de alcance comercial" the Product Leader wrote for this costing row (visible to the KAM). */
  negotiationNotes?: string | null;
  readyForKam: boolean;
  readyForKamAt: string | null;
}

export interface NegotiationRound {
  id: string;
  proposalId: string;
  roundNumber: number;
  offeredValue: string | number;
  marginAmount: string | number | null;
  marginPercentage: string | number | null;
  scopeSnapshot: unknown | null;
  leaderNote: string | null;
  sentToKamAt: string;
  /** Written when the KAM delivers the round to the client. */
  sentToClientAt: string | null;
  clientResponse: "PENDING" | "CHANGES_REQUESTED";
  clientNote: string | null;
  /** Written when the KAM returns the round with the client's observations. Optional: a backend
   * without it just shows no "Devuelta el" date. */
  clientRespondedAt?: string | null;
}

/** What the list endpoints return per proposal: the latest round plus the latest CHANGES_REQUESTED round
 * when it is another one, three fields each (backend `LATEST_ROUND_FOR_LIST`). No margins, no snapshot. */
export type ListNegotiationRound = Pick<NegotiationRound, "roundNumber" | "clientResponse" | "clientNote">;

export interface ProposalAssignment {
  id: string;
  proposalId: string;
  userId: string | null;
  professorId: string | null;
  role: string;
  rawName: string | null;
  isMapped: boolean;
  createdAt: string;
  user?: ProposalUserSummary | null;
  professor?: {
    id: string;
    fullName: string;
    type: "STAFF" | "EXTERNAL";
    faculty: string | null;
    company: string | null;
    // Typed by the product leader (any kind, all optional). The KAM receives the contact fields below but
    // never `identityDocument`, hence optional.
    identityDocument?: string | null;
    email: string | null;
    phone: string | null;
    profile: string | null;
  } | null;
}

/** One change of the assigned professor/advisor (backend `ProfessorAssignmentLog`, HU 4.2). The first
 * assignment has no `previous*`. Names and types are snapshots, so they survive a deleted directory
 * entry (then the id is null). `changedBy` carries no e-mail. */
export interface ProfessorAssignmentLog {
  id: string;
  previousProfessorId: string | null;
  previousProfessorName: string | null;
  previousProfessorType: "STAFF" | "EXTERNAL" | null;
  newProfessorId: string | null;
  newProfessorName: string;
  newProfessorType: "STAFF" | "EXTERNAL";
  changedAt: string;
  statusAtChange: { code: string };
  changedBy: { id: string; firstName: string | null; lastName: string | null };
}

/** One change of the node or the Product Leader (backend `ProposalTeamChangeLog`): the KAM's
 * correction while "Nueva" without a professor, or the Leader's reassignment (with its reason code). */
export interface ProposalTeamChangeLog {
  id: string;
  field: "NODE" | "PRODUCT_LEADER";
  previousName: string | null;
  newName: string;
  reason: string | null;
  changedAt: string;
  changedBy: { id: string; firstName: string | null; lastName: string | null };
}

export type AttachmentCategory = "CLIENT_FACING" | "INTERNAL";

// HU 5.2 — the backend never sends the storage key; the file itself is fetched through a
// presigned URL (see attachmentsApi.getDownloadUrl). `canDelete` is decided server-side.
export interface ProposalAttachment {
  id: string;
  fileName: string;
  category: AttachmentCategory;
  tag: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string;
  uploadedById: string | null;
  uploadedBy: { id: string; firstName: string | null; lastName: string | null } | null;
  /** False for attachments that only carry a name (created before file storage). */
  downloadable: boolean;
  canDelete: boolean;
}

export interface ProposalListItem {
  id: string;
  code: string | null;
  companyId: string;
  contactId: string | null;
  /** The node is optional (C-06): a request may have none. */
  nodeId: string | null;
  title: string | null;
  generalDescription: string | null;
  creatorId: string;
  productLeaderId: string | null;
  priority: ProposalPriority | null;
  comments: string | null;
  /** Business center the deal goes through (free text, e.g. "Eduteka", "OEM"), typed by the Product Leader (C-07). */
  center?: string | null;
  /** Cost center ("CENCO", free text) loaded for that center (C-07). */
  costCenter?: string | null;
  /** Official number ("CP 2026-0169"); the backend only sends it once the request is delivered (C-13). */
  officialNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  company: Company;
  workflow: ProposalWorkflow | null;
  program: ProposalProgram | null;
  economics?: {
    isCurrent?: boolean;
    grossValue: string | number | null;
    // Only for Product Leader / Admin: the backend strips both for the KAM.
    estimatedMargin?: string | number | null;
    marginPercentage?: string | number | null;
    negotiationNotes?: string | null;
    readyForKam: boolean;
    readyForKamAt: string | null;
  }[];
  productLeader?: ProposalUserSummary | null;
  creator?: ProposalUserSummary | null;
  assignments?: ProposalAssignment[];
  // Optional: a backend without the list contract (PR #26) does not send it.
  negotiationRounds?: ListNegotiationRound[];
}

export interface ProposalDetail extends ProposalListItem {
  contact: ProposalContact | null;
  additionalContacts?: ProposalAdditionalContact[];
  node: ProposalNode | null;
  creator: ProposalUserSummary;
  productLeader: ProposalUserSummary | null;
  logistics: ProposalLogistics | null;
  economics: ProposalEconomics[];
  attachments: ProposalAttachment[];
  assignments: ProposalAssignment[];
  negotiationRounds: NegotiationRound[];
  // Oldest first. Optional: a backend without the assignment audit (PR #25) does not send it.
  professorAssignmentLogs?: ProfessorAssignmentLog[];
  teamChangeLogs?: ProposalTeamChangeLog[];
  // Every change of status, oldest first (`statusCode` is the backend code: NEW, IN_PROGRESS...). Optional: a
  // backend without it just shows no "Tiempo por etapa".
  statusHistory?: ProposalStatusChange[];
}

/** One entry of the status history: the status the request entered and when. */
export interface ProposalStatusChange {
  statusCode: string;
  changedAt: string;
}

export interface ProposalDashboardMetrics {
  total: number;
  nuevas: number;
  listas: number;
  entregadas: number;
  urgentes: number;
  proximas: number;
  sinDocente: number;
  borradoresPendientes: number;
  enviadasSemana: number;
  inProgress: number;
  rejected: number;
}

export interface RequestsQueryParams {
  q?: string;
  status?: string;
  urgency?: "urgente" | "proximo" | "sinfecha" | "all";
  type?: RequestType | "all";
}

export interface AdditionalContactPayload {
  name?: string;
  role?: string;
  area?: string;
  phone?: string;
  email?: string;
}

export interface CreateProposalPayload {
  companyName: string;
  companyNit?: string;
  companyDescription?: string;
  companyType?: CompanyType;
  sector?: string;
  website?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  ciiuCode?: string;
  ciiuSecondary?: string[];
  nodeId?: string;
  productLeaderId?: string;
  deliveryDays?: string;
  priority?: ProposalPriority;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactRole?: string;
  contactArea?: string;
  contactSecondaryPhone?: string;
  contactAlternativeEmail?: string;
  additionalContacts?: AdditionalContactPayload[];
  requestType?: RequestType;
  requestTypeOther?: string;
  trainingSubtype?: ProgramType;
  participantRange?: string;
  participantExact?: string;
  programName: string;
  needDescription?: string;
  estimatedHours?: number;
  hoursAtProfessorDiscretion?: boolean;
  modality?: ProgramModality;
  modalityOtherPlace?: string;
  requiresCatering?: boolean;
  cateringNotes?: string;
  expectedResults?: string;
  successMetrics?: string;
  competencies?: string;
  participantArea?: string;
  hasPreviousTraining?: boolean;
  previousTraining?: string;
  previousTrainingDescription?: string;
  previousTrainingCompany?: string;
  previousTrainingDate?: string;
  observations?: string;
}

export interface UpdateStatusPayload {
  status: string;
  rejectionReason?: string;
}

export interface UpdateServiceSpecsPayload {
  totalHours?: number;
  programModality?: ProgramModality;
  minParticipants?: number;
  /** `null` clears the upper bound ("Más de 25"). */
  maxParticipants?: number | null;
  requestType?: RequestType;
  requestTypeOther?: string;
  deadline?: string;
}

export interface UpdateProposalInfoPayload {
  companyName?: string;
  companyNit?: string | null;
  companyDescription?: string | null;
  companyType?: CompanyType;
  sector?: string | null;
  website?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  ciiuCode?: string | null;
  ciiuSecondary?: string[];
  /** `null` leaves the request without node (C-06). */
  nodeId?: string | null;
  productLeaderId?: string;
  priority?: ProposalPriority;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactRole?: string | null;
  contactArea?: string | null;
  contactSecondaryPhone?: string | null;
  contactAlternativeEmail?: string | null;
  additionalContacts?: AdditionalContactPayload[];
  programName?: string;
  requestType?: RequestType;
  requestTypeOther?: string;
  trainingSubtype?: ProgramType;
  participantRange?: string;
  participantExact?: string;
  needDescription?: string | null;
  estimatedHours?: number;
  hoursAtProfessorDiscretion?: boolean;
  modality?: ProgramModality;
  modalityOtherPlace?: string;
  requiresCatering?: boolean;
  /** `null` clears the notes. */
  cateringNotes?: string | null;
  expectedResults?: string | null;
  successMetrics?: string | null;
  competencies?: string | null;
  participantArea?: string | null;
  participantLocation?: string;
  hasPreviousTraining?: boolean;
  previousTraining?: string;
  previousTrainingDescription?: string | null;
  previousTrainingCompany?: string | null;
  previousTrainingDate?: string | null;
  observations?: string | null;
}

/** Body of PATCH /requests/:id/node: `null` removes the node (C-06). */
export interface SetNodePayload {
  nodeId: string | null;
}

/** Body of PATCH /requests/:id/center (C-07): a field left out is kept, `null` (or empty) clears it. */
export interface SetCenterPayload {
  center?: string | null;
  costCenter?: string | null;
}

// Every code ALLOWED_TRANSITIONS in commercial-requests-backend actually uses —
// UpdateStatusPayload.status stays a loose `string` (#7's contract), this is only
// for Líder de Producto call sites (HU 4.3) that want the stricter union.
export type BackendStatusCode = "NEW" | "IN_PROGRESS" | "IN_COSTING" | "DELIVERED" | "REJECTED";

// HU 4.4 — reassign to another Product Leader (and node), only while NEW or
// IN_PROGRESS; the Líder de Producto's side, not part of #7's KAM contract.
export interface ReassignProposalPayload {
  newProductLeaderId: string;
  /** Left out when the request has no node and none is picked. */
  newNodeId?: string;
  reason: string;
  note?: string;
}

export const requestsApi = {
  /** Retrieves aggregated KPI metrics for the authenticated user based on role */
  getDashboardMetrics: () => apiRequest<ProposalDashboardMetrics>("/requests/dashboard/metrics"),

  /** Retrieves filtered list of proposals */
  list: (params: RequestsQueryParams = {}) => {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.status && params.status !== "all") search.set("status", params.status);
    if (params.urgency && params.urgency !== "all") search.set("urgency", params.urgency);
    if (params.type && params.type !== "all") search.set("type", params.type);
    const qs = search.toString();
    return apiRequest<ProposalListItem[]>(`/requests${qs ? `?${qs}` : ""}`);
  },

  /** Retrieves single proposal detail by ID */
  getById: (id: string) => apiRequest<ProposalDetail>(`/requests/${id}`),

  /** Creates a new commercial proposal request */
  create: (data: CreateProposalPayload) =>
    apiRequest<ProposalDetail>("/proposals", {
      method: "POST",
      body: data,
    }),

  /** Updates proposal information (only allowed in NEW status by owner KAM or ADMIN) */
  updateInfo: (id: string, data: UpdateProposalInfoPayload) =>
    apiRequest<ProposalDetail>(`/requests/${id}/info`, {
      method: "PATCH",
      body: data,
    }),

  /** Soft deletes / cancels a proposal (allowed by owner KAM or ADMIN) — a reason
   * is required (HU 3.4, mandatory-reason cancellation). */
  delete: (id: string, payload?: { reason: string }) =>
    apiRequest<{ success: boolean; id: string; message: string }>(`/requests/${id}`, {
      method: "DELETE",
      body: payload,
    }),

  /** Updates the lifecycle status of a proposal */
  updateStatus: (id: string, data: UpdateStatusPayload) =>
    apiRequest<ProposalDetail>(`/requests/${id}/status`, {
      method: "PATCH",
      body: data,
    }),

  /** Updates the service specifications */
  updateSpecs: (id: string, data: UpdateServiceSpecsPayload) =>
    apiRequest<ProposalDetail>(`/requests/${id}/specs`, {
      method: "PATCH",
      body: data,
    }),

  /** Product Leader (owner) or Admin puts, changes or removes the node (C-06). */
  setNode: (id: string, data: SetNodePayload) =>
    apiRequest<ProposalDetail>(`/requests/${id}/node`, {
      method: "PATCH",
      body: data,
    }),

  /** Product Leader (owner) or Admin types the center and the cost center (C-07). */
  setCenter: (id: string, data: SetCenterPayload) =>
    apiRequest<ProposalDetail>(`/requests/${id}/center`, {
      method: "PATCH",
      body: data,
    }),

  /** Retrieves list of knowledge nodes */
  getNodes: () => apiRequest<ProposalNode[]>("/nodes"),

  // --- HU 4.2/4.3/4.4/5.1(mínimo) — Líder de Producto side, not in #7's contract ---

  /**
   * Assigns a professor/advisor (HU 4.2): exactly one of an existing directory entry (`professorId`) or the
   * typed data (`professor`), which the backend creates or reuses and assigns atomically. It never advances
   * the status.
   */
  assignProfessor: (id: string, target: AssignProfessorTarget) =>
    apiRequest<ProposalDetail>(`/requests/${id}/professor`, {
      method: "PATCH",
      body: target,
    }),

  /** Product Leader confirms the current costing is ready for the KAM to deliver. */
  markReadyForKam: (id: string, leaderNote?: string) =>
    apiRequest<ProposalDetail>(`/requests/${id}/ready-for-kam`, {
      method: "PATCH",
      body: { ...(leaderNote ? { leaderNote } : {}) },
    }),

  /** HU 4.4 — reassign to another Product Leader (and node), only while NEW/IN_PROGRESS. */
  reassign: (id: string, data: ReassignProposalPayload) =>
    apiRequest<ProposalDetail>(`/requests/${id}/reassign`, { method: "PATCH", body: data }),

  /** HU 5.1 — saves the costing as a new current economics row. `totalCost` is required.
   * Each margin follows the backend: left undefined = keeps the previous value,
   * null = clears it, 0 = stores 0. Pro-Cultura stays a client-side reference. */
  upsertCosting: (id: string, payload: UpsertCostingPayload) =>
    apiRequest<ProposalDetail>(`/requests/${id}/costing`, {
      method: "PUT",
      body: payload,
    }),
};
