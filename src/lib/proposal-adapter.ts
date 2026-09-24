import type {
  ProposalListItem,
  ProposalDetail,
  RequestType as BackendRequestType,
  ProposalPriority,
} from "./api/requests";
import type { RequestItem, RequestStatus, Urgency, RequestType as FrontendRequestType } from "./mock-data";

export function mapBackendStatusToFrontend(statusCode: string | undefined): RequestStatus {
  switch (statusCode) {
    case "NEW":
      return "nueva";
    case "IN_PROGRESS":
      return "en-experto";
    case "IN_COSTING":
      return "en-costeo";
    case "DELIVERED":
    case "REJECTED":
      return "entregada";
    default:
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

export function mapProposalToRequestItem(p: ProposalListItem | ProposalDetail, currentKamName?: string): RequestItem {
  const currentEconomics = p.economics?.[0];
  const grossValueNum = currentEconomics ? Number(currentEconomics.grossValue ?? 0) : 0;
  const isReady = Boolean(currentEconomics?.readyForKam);

  const professorAssignment = p.assignments?.find((a) => a.role === "PROFESSOR");
  const professorName = professorAssignment?.professor?.fullName ?? professorAssignment?.rawName ?? undefined;
  const professorType = professorAssignment?.professor?.type === "EXTERNAL" ? "externo" : "planta";

  const leaderFullName = p.productLeader
    ? `${p.productLeader.firstName ?? ""} ${p.productLeader.lastName ?? ""}`.trim()
    : "Por definir";

  const detail = p as Partial<ProposalDetail>;
  const lastRejectedRound = detail.negotiationRounds?.find((r) => r.clientResponse === "CHANGES_REQUESTED");

  return {
    id: p.code ?? p.id,
    title: p.title ?? "Sin título",
    company: p.company?.name ?? "Empresa sin nombre",
    applicant: detail.contact?.name ?? "Contacto por definir",
    type: mapBackendTypeToFrontend(p.program?.requestType),
    status: mapBackendStatusToFrontend(p.workflow?.currentStatus?.code),
    urgency: mapBackendPriorityToFrontend(p.priority),
    createdAt: p.createdAt,
    deadline: p.workflow?.deadline ?? undefined,
    node: (detail.node?.name as string) ?? "Por definir",
    productLeader: leaderFullName || "Por definir",
    kam: currentKamName ?? "KAM Icesi",
    professor: professorName,
    professorType,
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
    participantes: p.program?.minParticipants
      ? `${p.program.minParticipants} - ${p.program.maxParticipants ?? ""}`
      : undefined,
    modalidad: p.program?.programModality ?? undefined,
    horas: p.program?.totalHours ? `${p.program.totalHours} horas` : undefined,
    tipoOtro: p.program?.requestTypeOther ?? undefined,
    companyNit: p.company?.nit ?? undefined,
  };
}
