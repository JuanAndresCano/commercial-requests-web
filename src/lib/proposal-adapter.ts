import type {
  ProposalListItem,
  ProposalDetail,
  RequestType as BackendRequestType,
  ProposalPriority,
  ProgramModality as BackendProgramModality,
} from "./api/requests";
import type {
  ExternalProfessorData,
  RequestItem,
  RequestStatus,
  Urgency,
  RequestType as FrontendRequestType,
} from "./mock-data";

export function mapBackendStatusToFrontend(statusCode: string | undefined): RequestStatus {
  switch (statusCode) {
    case "NEW":
      return "nueva";
    case "IN_PROGRESS":
      return "en-experto";
    case "IN_COSTING":
      return "en-costeo";
    case "DELIVERED":
      return "entregada";
    case "REJECTED":
      return "rechazada";
    case "CANCELLED":
      return "cancelada";
    default:
      console.warn(`[proposal-adapter] Unknown status code: ${statusCode}`);
      return "nueva";
  }
}

export function mapBackendTypeToFrontend(type: BackendRequestType | null | undefined): FrontendRequestType {
  switch (type) {
    case "CAPACITACION":
      return "Capacitación";
    case "CONSULTORIA":
      return "Consultoría";
    case "MENTORIA":
      return "Mentoría";
    case "INVESTIGACION":
      return "Investigación";
    case "SPECIAL_PROJECTS":
      return "Proyectos Especiales (Eventos)";
    case "OTHER":
      return "Otro";
    default:
      return "Capacitación";
  }
}

export function mapBackendPriorityToFrontend(priority: ProposalPriority | null | undefined): Urgency {
  switch (priority) {
    case "ALTA":
      return "alta";
    case "MEDIA":
      return "media";
    case "BAJA":
      return "baja";
    default:
      return "media";
  }
}

export function formatRelativeTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "Reciente";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "Reciente";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return diffHours === 1 ? "Hace 1 hora" : `Hace ${diffHours} horas`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

// HU 4.1/4.3/4.4/4.5 (Líder de Producto, not in #7's original adapter) — same labels
// the specs-edit form already shows, translated to/from the backend's enum codes.
const MODALITY_MAP: Record<BackendProgramModality, string> = {
  VIRTUAL: "Virtual sincrónica",
  PRESENCIAL_ICESI: "Presencial en campus Icesi",
  PRESENCIAL_CLIENTE: "Presencial en sede cliente",
  PRESENCIAL_OTRO: "Presencial en otra sede",
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
  "Presencial en otra sede": "PRESENCIAL_OTRO",
  Híbrida: "HIBRIDA",
};

/** Reverses mapBackendTypeToFrontend/MODALITY_MAP for the specs edit form (HU 4.5) —
 * same labels the front already shows, translated back to backend codes. */
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

export function mapProposalToRequestItem(p: ProposalListItem | ProposalDetail, currentKamName?: string): RequestItem {
  const currentEconomics = p.economics?.find((e) => e.isCurrent) ?? p.economics?.[0];
  const grossValueNum = currentEconomics ? Number(currentEconomics.grossValue ?? 0) : 0;
  const isReady = Boolean(currentEconomics?.readyForKam);

  const professorAssignment = p.assignments?.find((a) => a.role === "PROFESSOR");
  const professorName = professorAssignment?.professor?.fullName ?? professorAssignment?.rawName ?? undefined;
  const professorType = professorAssignment?.professor?.type === "EXTERNAL" ? "externo" : "planta";

  // HU 4.2 (Líder de Producto, not in #7) — only populated for an external advisor.
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

  const leaderFullName = p.productLeader
    ? `${p.productLeader.firstName ?? ""} ${p.productLeader.lastName ?? ""}`.trim()
    : "Por definir";

  const detail = p as Partial<ProposalDetail>;
  const lastRejectedRound = detail.negotiationRounds?.find((r) => r.clientResponse === "CHANGES_REQUESTED");

  return {
    id: p.id,
    code: p.code ?? p.id,
    title: p.title ?? "Sin título",
    company: p.company?.name ?? "Empresa sin nombre",
    applicant: detail.contact?.name ?? "Contacto por definir",
    type: mapBackendTypeToFrontend(p.program?.requestType),
    status: mapBackendStatusToFrontend(p.workflow?.currentStatus?.code),
    urgency: mapBackendPriorityToFrontend(p.priority),
    createdAt: p.createdAt,
    deadline: p.workflow?.deadline ?? undefined,
    // HU 4.1/4.3/4.4 (Líder de Producto) read this — kept populated even outside detail.
    statusUpdatedAt: p.workflow?.currentStatusSince ?? undefined,
    node: (detail.node?.name as string) ?? "Por definir",
    productLeader: leaderFullName || "Por definir",
    kam: currentKamName ?? "KAM Icesi",
    professor: professorName,
    professorType,
    externalProfessorData,
    totalCostCop: grossValueNum,
    costing: {
      totalOfferedCop: grossValueNum,
      expectedMarginPercent:
        currentEconomics && "marginPercentage" in currentEconomics
          ? Number((currentEconomics as { marginPercentage?: string | number | null }).marginPercentage ?? 0)
          : 0,
      marginAmountCop:
        currentEconomics && "estimatedMargin" in currentEconomics
          ? Number((currentEconomics as { estimatedMargin?: string | number | null }).estimatedMargin ?? 0)
          : 0,
      proCulturaTaxPercent: p.program?.requestType === "CAPACITACION" ? 1.5 : 0,
      proCulturaTaxAmount: p.program?.requestType === "CAPACITACION" ? Math.round(grossValueNum * 0.015) : 0,
      readyForKam: isReady,
      costingSentAt: currentEconomics?.readyForKamAt ?? undefined,
    },
    clientObservations: lastRejectedRound?.clientNote ?? undefined,
    // "N - M" only when both ends are known (HU 4.5's specs Select is a closed set of
    // fixed ranges, e.g. "Más de 25" — this mapper doesn't guess an open-ended one).
    participantes:
      p.program?.minParticipants != null && p.program?.maxParticipants != null
        ? `${p.program.minParticipants} - ${p.program.maxParticipants}`
        : undefined,
    // Spanish label, not the raw backend code — HU 4.5's Select and modalityToBackend
    // round-trip on this exact label.
    modalidad: p.program?.programModality ? MODALITY_MAP[p.program.programModality] : undefined,
    // Bare number, not "N horas" — HU 4.5's specs form edits this as a number input and
    // appends the "horas" suffix itself at display time only.
    horas: p.program?.totalHours != null ? String(p.program.totalHours) : undefined,
    tipoOtro: p.program?.requestTypeOther ?? undefined,
    companyNit: p.company?.nit ?? undefined,
    companyTipo: p.company?.type ?? undefined,
    companyDescripcion: p.company?.description ?? undefined,
    companyWeb: p.company?.website ?? undefined,
    contactCargo: detail.contact?.role ?? undefined,
    contactArea: detail.contact?.areaDependency ?? undefined,
    contactTelefono: detail.contact?.phone ?? undefined,
    contactCorreo: detail.contact?.email ?? undefined,
    necesidad: p.program?.programDescription ?? p.generalDescription ?? undefined,
    competencias: p.program?.competencies ?? undefined,
    exito: p.program?.successMetrics ?? undefined,
    resultados: p.program?.expectedResults ?? undefined,
    areaParticipantes: p.program?.participantArea ?? undefined,
    alimentacion: p.program?.requiresCatering
      ? p.program?.cateringNotes
        ? `Sí - ${p.program.cateringNotes}`
        : "Sí"
      : "No",
    formacionPrevia:
      p.program?.previousTraining === "Si" || p.program?.previousTraining === "Sí"
        ? "Sí"
        : p.program?.previousTraining === "No"
          ? "No"
          : p.program?.previousTraining === "No sé" || p.program?.previousTraining === "No se"
            ? "No sé"
            : undefined,
    descFormacion: p.program?.previousTrainingDetail ?? undefined,
    empresaPrevia: p.program?.previousTrainingCompany ?? undefined,
    fechaPrevia: p.program?.previousTrainingDate ? p.program.previousTrainingDate.slice(0, 10) : undefined,
    observaciones: p.comments ?? undefined,
    negotiationRounds: detail.negotiationRounds?.map((nr) => {
      const isRejected = nr.clientResponse === "CHANGES_REQUESTED";
      return {
        id: nr.id,
        roundNumber: nr.roundNumber,
        totalOfferedCop: Number(nr.offeredValue ?? 0),
        marginAmountCop: nr.marginAmount != null ? Number(nr.marginAmount) : 0,
        expectedMarginPercent: nr.marginPercentage != null ? Number(nr.marginPercentage) : 0,
        leaderNote: nr.leaderNote ?? undefined,
        sentToKamAt: nr.sentToKamAt,
        sentToClientAt: nr.sentToClientAt ?? undefined,
        clientResponse: isRejected ? "rechazada" : "pendiente",
        clientObservation: nr.clientNote ?? undefined,
        clientRespondedAt: undefined,
      };
    }),
  };
}
