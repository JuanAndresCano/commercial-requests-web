import { calculateProCulturaReference, PRO_CULTURA_PERCENT } from "./currency";
import type {
  ProposalListItem,
  ProposalDetail,
  NegotiationRound,
  ProfessorAssignmentLog,
  RequestType as BackendRequestType,
  ProposalPriority,
  ProgramModality as BackendProgramModality,
} from "./api/requests";
import type {
  ExternalProfessorData,
  ProfessorAssignmentLogEntry,
  RequestItem,
  RequestStatus,
  NegotiationRound as FrontendNegotiationRound,
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

/** Prisma Decimals arrive as strings in JSON. null/undefined (never set, cleared, or
 * stripped for the KAM) stay undefined: 0 is a stored value, "no margin" is not 0. */
function decimalToNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type RoundScope = Pick<FrontendNegotiationRound, "participantes" | "modalidad" | "horas" | "type" | "necesidad">;

/** The scope the backend froze when the Product Leader pressed "Enviar a KAM" (`scopeSnapshot`, JSON),
 * in the labels the round history compares: the same ones the live request fields use. Anything that is
 * missing, null or not of the expected shape stays undefined — a round without a snapshot (legacy, or a
 * proposal without a program) simply has no scope to diff, exactly like the prototype's first round. */
function mapScopeSnapshot(raw: unknown): RoundScope {
  if (!isRecord(raw)) return {};
  const { requestType, programModality, totalHours, minParticipants, maxParticipants, generalDescription } = raw;
  return {
    participantes:
      typeof minParticipants === "number" && typeof maxParticipants === "number"
        ? `${minParticipants} - ${maxParticipants}`
        : undefined,
    modalidad:
      typeof programModality === "string" && programModality in MODALITY_MAP
        ? MODALITY_MAP[programModality as BackendProgramModality]
        : undefined,
    horas: typeof totalHours === "number" ? String(totalHours) : undefined,
    type:
      typeof requestType === "string" && (Object.values(REQUEST_TYPE_TO_BACKEND) as string[]).includes(requestType)
        ? mapBackendTypeToFrontend(requestType as BackendRequestType)
        : undefined,
    necesidad: typeof generalDescription === "string" && generalDescription.trim() ? generalDescription : undefined,
  };
}

const toFrontendProfessorType = (type: "STAFF" | "EXTERNAL"): "planta" | "externo" =>
  type === "EXTERNAL" ? "externo" : "planta";

/** Same entry the mock path builds with `assignProfessorWithHistory`. The block that shows it
 * reverses the list itself, so it goes in oldest first (the backend order is not trusted). */
function mapProfessorHistory(logs: ProfessorAssignmentLog[] | undefined): ProfessorAssignmentLogEntry[] | undefined {
  if (!logs || logs.length === 0) return undefined;
  return logs
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => Date.parse(a.entry.changedAt) - Date.parse(b.entry.changedAt) || a.index - b.index)
    .map(({ entry: l }) => ({
      id: l.id,
      previousProfessor: l.previousProfessorName ?? undefined,
      previousProfessorType: l.previousProfessorType ? toFrontendProfessorType(l.previousProfessorType) : undefined,
      newProfessor: l.newProfessorName,
      newProfessorType: toFrontendProfessorType(l.newProfessorType),
      changedBy: `${l.changedBy.firstName ?? ""} ${l.changedBy.lastName ?? ""}`.trim() || "Usuario sin nombre",
      changedAt: l.changedAt,
      statusAtChange: mapBackendStatusToFrontend(l.statusAtChange.code),
    }));
}

export function mapProposalToRequestItem(p: ProposalListItem | ProposalDetail, currentKamName?: string): RequestItem {
  const currentEconomics = p.economics?.find((e) => e.isCurrent) ?? p.economics?.[0];
  const grossValueNum = currentEconomics ? Number(currentEconomics.grossValue ?? 0) : 0;
  const isReady = Boolean(currentEconomics?.readyForKam);

  const professorAssignment = p.assignments?.find((a) => a.role === "PROFESSOR");
  const professorName = professorAssignment?.professor?.fullName ?? professorAssignment?.rawName ?? undefined;
  const professorType = professorAssignment?.professor?.type === "EXTERNAL" ? "externo" : "planta";

  // HU 4.2 — the typed data of the assigned professor/advisor, of either kind. The KAM's payload carries
  // the contact fields but never `identityDocument`, so `identificacion` stays empty for the KAM.
  const assignedProfessor = professorAssignment?.professor;
  const externalProfessorData: ExternalProfessorData | undefined = assignedProfessor
    ? {
        nombre: assignedProfessor.fullName,
        identificacion: assignedProfessor.identityDocument ?? undefined,
        facultad: assignedProfessor.faculty ?? undefined,
        empresaConsultora: assignedProfessor.company ?? undefined,
        correo: assignedProfessor.email ?? undefined,
        telefono: assignedProfessor.phone ?? undefined,
        perfil: assignedProfessor.profile ?? undefined,
      }
    : undefined;

  const leaderFullName = p.productLeader
    ? `${p.productLeader.firstName ?? ""} ${p.productLeader.lastName ?? ""}`.trim()
    : "Por definir";

  const creatorFullName = p.creator ? `${p.creator.firstName ?? ""} ${p.creator.lastName ?? ""}`.trim() : undefined;

  // Only the exact backend code gets the stamp; mapBackendTypeToFrontend falls back to
  // "Capacitación" for null/unknown types, which must not.
  const proCultura = calculateProCulturaReference(
    grossValueNum,
    p.program?.requestType === "CAPACITACION" ? "Capacitación" : "",
  );

  const detail = p as Partial<ProposalDetail>;
  const status = mapBackendStatusToFrontend(p.workflow?.currentStatus?.code);

  // The API order is not a contract: the detail sends every round, the list only the
  // latest. Ascending by roundNumber, so "the last one" is always the current round.
  const rounds = [...(p.negotiationRounds ?? [])].sort((a, b) => a.roundNumber - b.roundNumber);
  // The prototype sets the client's note when the KAM returns the proposal and clears it only when the
  // KAM redelivers it to the client (status back to "entregada"). Pressing "Enviar a KAM" opens a new
  // PENDING round but does NOT clear it. So while the proposal is in costing it is the note of the
  // highest-numbered CHANGES_REQUESTED round — not necessarily the latest round. The list sends that
  // round on purpose (latest + latest returned).
  const returnedRound =
    status === "en-costeo" ? [...rounds].reverse().find((r) => r.clientResponse === "CHANGES_REQUESTED") : undefined;
  const returnedNote = returnedRound?.clientNote ?? undefined;
  // List rounds carry three fields; only the detail's full rounds feed the history panel.
  const fullRounds = p.negotiationRounds && rounds.every((r): r is NegotiationRound => "id" in r) ? rounds : undefined;

  return {
    id: p.id,
    code: p.code ?? p.id,
    title: p.title ?? "Sin título",
    company: p.company?.name ?? "Empresa sin nombre",
    applicant: detail.contact?.name ?? "Contacto por definir",
    type: mapBackendTypeToFrontend(p.program?.requestType),
    status,
    urgency: mapBackendPriorityToFrontend(p.priority),
    createdAt: p.createdAt,
    deadline: p.workflow?.deadline ?? undefined,
    // HU 4.1/4.3/4.4 (Líder de Producto) read this — kept populated even outside detail.
    statusUpdatedAt: p.workflow?.currentStatusSince ?? undefined,
    node: (detail.node?.name as string) ?? "Por definir",
    productLeader: leaderFullName || "Por definir",
    kam: creatorFullName || currentKamName || "KAM Icesi",
    professor: professorName,
    professorType,
    externalProfessorData,
    professorHistory: mapProfessorHistory(detail.professorAssignmentLogs),
    totalCostCop: grossValueNum,
    costing: {
      totalOfferedCop: grossValueNum,
      expectedMarginPercent: decimalToNumber(currentEconomics?.marginPercentage),
      marginAmountCop: decimalToNumber(currentEconomics?.estimatedMargin),
      proCulturaTaxPercent: proCultura.applies ? PRO_CULTURA_PERCENT : 0,
      proCulturaTaxAmount: proCultura.amount,
      negotiationNotes: currentEconomics?.negotiationNotes ?? undefined,
      readyForKam: isReady,
      costingSentAt: currentEconomics?.readyForKamAt ?? undefined,
    },
    clientObservations: returnedNote,
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
    negotiationRounds: fullRounds?.map((nr) => {
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
        clientRespondedAt: nr.clientRespondedAt ?? undefined,
        ...mapScopeSnapshot(nr.scopeSnapshot),
      };
    }),
  };
}
