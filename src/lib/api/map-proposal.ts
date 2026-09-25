import type {
  ExternalProfessorData,
  NegotiationRound,
  ProposalCosting,
  RequestItem,
  RequestStatus,
  RequestType,
  Urgency,
} from "@/lib/mock-data";
import type { BackendProposal, BackendStatusCode, BackendProgramModality, BackendRequestType } from "./requests";

// REJECTED has no equivalent in the front's 4-stage pipeline yet (nueva/en-experto/
// en-costeo/entregada) — it is a deliberate backend addition (commercial-requests-backend
// wiki/log.md, 2026-09-22) the front has no button for. Proposals in that status are
// filtered out by the callers of this mapper rather than mis-rendered as something else.
const STATUS_MAP: Record<Exclude<BackendStatusCode, "REJECTED">, RequestStatus> = {
  NEW: "nueva",
  IN_PROGRESS: "en-experto",
  IN_COSTING: "en-costeo",
  DELIVERED: "entregada",
};

const PRIORITY_MAP: Record<string, Urgency> = { ALTA: "alta", MEDIA: "media", BAJA: "baja" };

const REQUEST_TYPE_MAP: Record<string, RequestType> = {
  CAPACITACION: "Capacitación",
  CONSULTORIA: "Consultoría",
  MENTORIA: "Mentoría",
  INVESTIGACION: "Investigación",
  SPECIAL_PROJECTS: "Proyectos Especiales (Eventos)",
  OTHER: "Otro",
};

const MODALITY_MAP: Record<string, string> = {
  VIRTUAL: "Virtual sincrónica",
  PRESENCIAL_ICESI: "Presencial en campus Icesi",
  PRESENCIAL_CLIENTE: "Presencial en sede cliente",
  PRESENCIAL_OTRO: "Presencial en sede cliente",
  HIBRIDA: "Híbrida",
};

const REQUEST_TYPE_TO_BACKEND: Record<string, BackendRequestType> = {
  Capacitación: "CAPACITACION",
  Consultoría: "CONSULTORIA",
  Mentoría: "MENTORIA",
  Investigación: "INVESTIGACION",
  "Proyectos Especiales (Eventos)": "SPECIAL_PROJECTS",
  Otro: "OTHER",
};

const MODALITY_TO_BACKEND: Record<string, BackendProgramModality> = {
  "Virtual sincrónica": "VIRTUAL",
  "Presencial en campus Icesi": "PRESENCIAL_ICESI",
  "Presencial en sede cliente": "PRESENCIAL_CLIENTE",
  Híbrida: "HIBRIDA",
};

/** Reverses map-proposal's own REQUEST_TYPE_MAP/MODALITY_MAP for the specs edit form
 * (HU 4.5) — same labels the front already shows, translated back to backend codes. */
export function requestTypeToBackend(label: string): BackendRequestType | undefined {
  return REQUEST_TYPE_TO_BACKEND[label];
}

export function modalityToBackend(label: string): BackendProgramModality | undefined {
  return MODALITY_TO_BACKEND[label];
}

/** Parses the front's fixed participant range strings ("1 - 5", "Más de 25", ...) into
 * the min/max integers the backend stores. Any string outside that fixed set (there
 * shouldn't be one — it comes from a closed Select) maps to undefined rather than guess. */
export function parseParticipantsRange(range: string): { min?: number; max?: number } {
  const moreThan = /^Más de (\d+)/.exec(range);
  if (moreThan) return { min: Number(moreThan[1]) };
  const between = /^(\d+)\s*-\s*(\d+)/.exec(range);
  if (between) return { min: Number(between[1]), max: Number(between[2]) };
  return {};
}

const fullName = (u: { firstName: string | null; lastName: string | null } | null | undefined) =>
  u ? [u.firstName, u.lastName].filter(Boolean).join(" ") || "—" : "—";

const participantsRange = (min: number | null | undefined, max: number | null | undefined) =>
  min != null && max != null ? `${min} - ${max}` : undefined;

function mapCosting(p: BackendProposal): ProposalCosting | undefined {
  const current = p.economics?.find((e) => e.isCurrent);
  if (!current || current.grossValue == null) return undefined;
  const totalOfferedCop = Number(current.grossValue);
  const isCapacitacion = p.program?.requestType === "CAPACITACION";
  return {
    marginAmountCop: current.estimatedMargin != null ? Number(current.estimatedMargin) : 0,
    expectedMarginPercent: current.marginPercentage != null ? Number(current.marginPercentage) : 0,
    proCulturaTaxPercent: isCapacitacion ? 1.5 : 0,
    proCulturaTaxAmount: isCapacitacion ? Math.round(totalOfferedCop * 0.015) : 0,
    totalOfferedCop,
    readyForKam: current.readyForKam,
    costingSentAt: current.readyForKamAt ?? undefined,
  };
}

function mapNegotiationRounds(p: BackendProposal): NegotiationRound[] {
  return (p.negotiationRounds ?? []).map((r) => ({
    id: `${p.id}-r${r.roundNumber}`,
    roundNumber: r.roundNumber,
    totalOfferedCop: Number(r.offeredValue),
    marginAmountCop: r.marginAmount != null ? Number(r.marginAmount) : 0,
    expectedMarginPercent: r.marginPercentage != null ? Number(r.marginPercentage) : 0,
    leaderNote: r.leaderNote ?? undefined,
    sentToKamAt: r.sentToKamAt,
    sentToClientAt: r.sentToClientAt ?? undefined,
    // The backend only has two responses (PENDING / CHANGES_REQUESTED); the front's
    // "rechazada" is what CHANGES_REQUESTED means here — see docs/04 on why there is no
    // explicit "aceptada".
    clientResponse: r.clientResponse === "CHANGES_REQUESTED" ? "rechazada" : "pendiente",
    clientObservation: r.clientNote ?? undefined,
  }));
}

/**
 * Converts a backend Proposal into the front's RequestItem shape, so the existing
 * (mock-shaped) components render it without changes. Only the fields the LDP-facing
 * screens (HU 4.1, 4.3, 4.4, 4.5) actually read are populated — wizard-only fields
 * (company address, diagnóstico, formación previa...) are intentionally left undefined,
 * since they belong to the KAM creation flow (HU 3.2), not yet connected.
 */
export function mapProposalToRequestItem(p: BackendProposal): RequestItem | null {
  const code = p.workflow?.currentStatus.code;
  if (!code || code === "REJECTED") return null; // see STATUS_MAP comment

  const professorAssignment = p.assignments.find((a) => a.role === "PROFESSOR");
  const professorType: "planta" | "externo" | undefined = professorAssignment?.professor
    ? professorAssignment.professor.type === "STAFF"
      ? "planta"
      : "externo"
    : undefined;
  const externalProfessorData: ExternalProfessorData | undefined =
    professorType === "externo" && professorAssignment?.professor
      ? {
          nombre: professorAssignment.professor.fullName,
          identificacion: professorAssignment.professor.identityDocument ?? undefined,
          empresaConsultora: professorAssignment.professor.company ?? undefined,
          correo: professorAssignment.professor.email ?? undefined,
          telefono: professorAssignment.professor.phone ?? undefined,
          perfil: professorAssignment.professor.profile ?? undefined,
        }
      : undefined;

  const lastRound = p.negotiationRounds?.[p.negotiationRounds.length - 1];
  const clientObservations =
    lastRound?.clientResponse === "CHANGES_REQUESTED" ? (lastRound.clientNote ?? undefined) : undefined;

  return {
    id: p.id,
    title: p.title ?? "(Sin título)",
    applicant: p.contact?.name ?? "—",
    type: p.program?.requestType ? REQUEST_TYPE_MAP[p.program.requestType] : "Otro",
    createdAt: p.createdAt,
    deadline: p.workflow?.deadline ?? undefined,
    status: STATUS_MAP[code],
    urgency: p.priority ? (PRIORITY_MAP[p.priority] ?? "media") : "media",
    participantes: participantsRange(p.program?.minParticipants, p.program?.maxParticipants),
    modalidad: p.program?.programModality ? MODALITY_MAP[p.program.programModality] : undefined,
    horas: p.program?.totalHours != null ? String(p.program.totalHours) : undefined,
    tipoOtro: p.program?.requestTypeOther ?? undefined,
    company: p.company?.name ?? "—",
    node: p.node?.name ?? "Por definir",
    productLeader: fullName(p.productLeader),
    kam: fullName(p.creator),
    professor: professorAssignment?.professor?.fullName ?? professorAssignment?.rawName ?? undefined,
    professorType,
    externalProfessorData,
    costing: mapCosting(p),
    clientObservations,
    statusUpdatedAt: p.workflow?.currentStatusSince ?? undefined,
    negotiationRounds: mapNegotiationRounds(p),
  };
}
