import { apiRequest } from "./client";

// Mirrors the backend contract of commercial-requests-backend
// (src/modules/requests). Only the fields the LDP-facing screens actually use
// are typed here — see map-proposal.ts for how this becomes a RequestItem.

export type BackendStatusCode = "NEW" | "IN_PROGRESS" | "IN_COSTING" | "DELIVERED" | "REJECTED";
export type BackendPriority = "ALTA" | "MEDIA" | "BAJA";
export type BackendProfessorType = "STAFF" | "EXTERNAL";
export type BackendRequestType =
  "CAPACITACION" | "CONSULTORIA" | "MENTORIA" | "INVESTIGACION" | "SPECIAL_PROJECTS" | "OTHER";
export type BackendProgramModality =
  "VIRTUAL" | "PRESENCIAL_ICESI" | "PRESENCIAL_CLIENTE" | "PRESENCIAL_OTRO" | "HIBRIDA";
export type BackendClientResponse = "PENDING" | "CHANGES_REQUESTED";

interface NamedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

// GET /requests (list) returns a thinner shape than GET /requests/:id (detail) — the
// optional fields below are only present on the detail response. The mapper treats a
// missing field as "unknown", never as empty/zero.
export interface BackendProposal {
  id: string;
  title: string | null;
  creatorId: string;
  productLeaderId: string | null;
  priority: BackendPriority | null;
  company: { id: string; name: string } | null;
  contact?: { id: string; name: string } | null;
  node: { id: string; name: string } | null;
  program: {
    requestType: BackendRequestType | null;
    requestTypeOther: string | null;
    programModality: BackendProgramModality | null;
    totalHours: number | null;
    minParticipants: number | null;
    maxParticipants: number | null;
  } | null;
  workflow: {
    currentStatus: { code: BackendStatusCode; name: string };
    deadline: string | null;
    currentStatusSince: string | null;
  } | null;
  economics?: Array<{
    id: string;
    isCurrent: boolean;
    grossValue: string | null;
    estimatedMargin: string | null;
    marginPercentage: string | null;
    readyForKam: boolean;
    readyForKamAt: string | null;
  }>;
  assignments: Array<{
    role: string;
    professorId: string | null;
    rawName: string | null;
    professor: {
      id: string;
      fullName: string;
      type: BackendProfessorType;
      company: string | null;
      identityDocument: string | null;
      email: string | null;
      phone: string | null;
      profile: string | null;
    } | null;
  }>;
  negotiationRounds?: Array<{
    id: string;
    roundNumber: number;
    offeredValue: string;
    marginAmount: string | null;
    marginPercentage: string | null;
    leaderNote: string | null;
    sentToKamAt: string;
    sentToClientAt: string | null;
    clientResponse: BackendClientResponse;
    clientNote: string | null;
  }>;
  creator?: NamedUser | null;
  productLeader?: NamedUser | null;
  createdAt: string;
}

export interface RequestsListParams {
  role?: string;
  status?: string;
  urgency?: string;
  q?: string;
}

export const requestsApi = {
  list: (params: RequestsListParams = {}) => {
    const search = new URLSearchParams();
    if (params.role) search.set("role", params.role);
    if (params.status) search.set("status", params.status);
    if (params.urgency) search.set("urgency", params.urgency);
    if (params.q) search.set("q", params.q);
    const qs = search.toString();
    return apiRequest<BackendProposal[]>(`/requests${qs ? `?${qs}` : ""}`);
  },
  getById: (id: string) => apiRequest<BackendProposal>(`/requests/${id}`),
  getDashboardMetrics: () =>
    apiRequest<{
      total: number;
      nuevas: number;
      listas: number;
      entregadas: number;
      urgentes: number;
      proximas: number;
      sinDocente: number;
      inProgress: number;
      rejected: number;
    }>("/requests/dashboard/metrics"),

  updateStatus: (id: string, status: BackendStatusCode, rejectionReason?: string) =>
    apiRequest<BackendProposal>(`/requests/${id}/status`, {
      method: "PATCH",
      body: { status, ...(rejectionReason ? { rejectionReason } : {}) },
    }),

  assignProfessor: (id: string, professorId: string) =>
    apiRequest<BackendProposal>(`/requests/${id}/professor`, {
      method: "PATCH",
      body: { professorId },
    }),

  markReadyForKam: (id: string, leaderNote?: string) =>
    apiRequest<BackendProposal>(`/requests/${id}/ready-for-kam`, {
      method: "PATCH",
      body: { ...(leaderNote ? { leaderNote } : {}) },
    }),

  reassign: (id: string, data: { newProductLeaderId: string; newNodeId: string; reason: string; note?: string }) =>
    apiRequest<BackendProposal>(`/requests/${id}/reassign`, { method: "PATCH", body: data }),

  updateSpecs: (
    id: string,
    data: {
      totalHours?: number;
      programModality?: BackendProgramModality;
      minParticipants?: number;
      maxParticipants?: number;
      requestType?: BackendRequestType;
      requestTypeOther?: string;
      deadline?: string;
    },
  ) => apiRequest<BackendProposal>(`/requests/${id}/specs`, { method: "PATCH", body: data }),

  // Minimal costing: only the offered value. Margin/Pro-Cultura stay client-side
  // preview fields (docs/04) until HU 5.1 (Persona 4) builds the real costing UI.
  upsertCosting: (id: string, totalCost: number) =>
    apiRequest<BackendProposal>(`/requests/${id}/costing`, {
      method: "PUT",
      body: { totalCost },
    }),
};
