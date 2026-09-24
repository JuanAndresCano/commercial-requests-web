import { apiRequest } from "./client";
import type { Company, CompanyType } from "./companies";

export type { Company, CompanyType };

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
  sentToClientAt: string | null;
  clientResponse: "PENDING" | "CHANGES_REQUESTED";
  clientNote: string | null;
}

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
  } | null;
}

export interface ProposalAttachment {
  id: string;
  proposalId: string;
  fileName: string;
  fileUrl: string | null;
  uploadedAt: string;
}

export interface ProposalListItem {
  id: string;
  code: string | null;
  companyId: string;
  contactId: string | null;
  nodeId: string;
  title: string | null;
  generalDescription: string | null;
  creatorId: string;
  productLeaderId: string | null;
  priority: ProposalPriority | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
  company: Company;
  workflow: ProposalWorkflow | null;
  program: ProposalProgram | null;
  economics?: {
    grossValue: string | number | null;
    readyForKam: boolean;
    readyForKamAt: string | null;
  }[];
  productLeader?: ProposalUserSummary | null;
  assignments?: ProposalAssignment[];
}

export interface ProposalDetail extends ProposalListItem {
  contact: ProposalContact | null;
  node: ProposalNode;
  creator: ProposalUserSummary;
  productLeader: ProposalUserSummary | null;
  logistics: ProposalLogistics | null;
  economics: ProposalEconomics[];
  attachments: ProposalAttachment[];
  assignments: ProposalAssignment[];
  negotiationRounds: NegotiationRound[];
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
  role?: "KAM" | "PRODUCT_LEADER" | "ADMIN";
  status?: string;
  urgency?: "urgente" | "proximo" | "sinfecha" | "all";
  type?: RequestType | "all";
}

export interface CreateProposalPayload {
  companyName: string;
  companyNit?: string;
  companyDescription?: string;
  companyType?: CompanyType;
  sector?: string;
  website?: string;
  nodeId?: string;
  productLeaderId?: string;
  deliveryDays?: string;
  priority?: ProposalPriority;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactRole?: string;
  contactArea?: string;
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
  attachments?: { fileName: string }[];
}

export interface UpdateStatusPayload {
  status: string;
  rejectionReason?: string;
}

export interface UpdateServiceSpecsPayload {
  totalHours?: number;
  programModality?: ProgramModality;
  minParticipants?: number;
  maxParticipants?: number;
  requestType?: RequestType;
  requestTypeOther?: string;
  deadline?: string;
}

export interface UpdateProposalInfoPayload {
  companyName?: string;
  companyNit?: string;
  companyDescription?: string;
  companyType?: CompanyType;
  sector?: string;
  website?: string;
  nodeId?: string;
  productLeaderId?: string;
  priority?: ProposalPriority;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactRole?: string;
  contactArea?: string;
  programName?: string;
  requestType?: RequestType;
  requestTypeOther?: string;
  trainingSubtype?: ProgramType;
  participantRange?: string;
  participantExact?: string;
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
  participantLocation?: string;
  hasPreviousTraining?: boolean;
  previousTraining?: string;
  previousTrainingDescription?: string;
  previousTrainingCompany?: string;
  previousTrainingDate?: string;
  observations?: string;
}

export const requestsApi = {
  /** Retrieves aggregated KPI metrics for the authenticated user based on role */
  getDashboardMetrics: () => apiRequest<ProposalDashboardMetrics>("/requests/dashboard/metrics"),

  /** Retrieves prioritized active proposals for the dashboard */
  getPrioritized: () => apiRequest<ProposalListItem[]>("/requests/dashboard/prioritized"),

  /** Retrieves filtered list of proposals */
  list: (params: RequestsQueryParams = {}) => {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.role) search.set("role", params.role);
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

  /** Soft deletes / cancels a proposal (allowed by owner KAM or ADMIN) */
  delete: (id: string) =>
    apiRequest<{ success: boolean; id: string; message: string }>(`/requests/${id}`, {
      method: "DELETE",
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

  /** Retrieves list of knowledge nodes */
  getNodes: () => apiRequest<ProposalNode[]>("/nodes"),
};
