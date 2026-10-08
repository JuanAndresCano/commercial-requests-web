import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCop, type NegotiationRound, type ProposalCosting, type RequestItem } from "@/lib/mock-data";

/**
 * Lógica pura de las rondas de negociación comercial (docs/04), extraída de
 * `RequestDetail.tsx` para poder testearla sin montar el componente. No
 * cambia ningún comportamiento: son las mismas transformaciones que ya
 * vivían inline en los handlers.
 */

export interface OpenRoundResult {
  costing: ProposalCosting;
  negotiationRounds: NegotiationRound[];
}

/**
 * Abre una ronda nueva de negociación al confirmar "Enviar a KAM": congela
 * un snapshot del valor final, margen y alcance vigentes, y marca el gate
 * `readyForKam` en true.
 */
export function openNegotiationRound(
  req: Pick<RequestItem, "id" | "costing" | "participantes" | "modalidad" | "horas" | "type" | "necesidad">,
  negotiationRounds: NegotiationRound[],
  leaderNote: string | undefined,
  now: string = new Date().toISOString(),
): OpenRoundResult {
  if (!req.costing) {
    throw new Error("No se puede abrir una ronda de negociación sin costeo");
  }
  const roundNumber = negotiationRounds.length + 1;
  const newRound: NegotiationRound = {
    id: `${req.id}-r${roundNumber}`,
    roundNumber,
    totalOfferedCop: req.costing.totalOfferedCop,
    marginAmountCop: req.costing.marginAmountCop ?? 0,
    expectedMarginPercent: req.costing.expectedMarginPercent ?? 0,
    leaderNote: leaderNote?.trim() || undefined,
    sentToKamAt: now,
    clientResponse: "pendiente",
    participantes: req.participantes,
    modalidad: req.modalidad,
    horas: req.horas,
    type: req.type,
    necesidad: req.necesidad,
  };
  return {
    costing: { ...req.costing, readyForKam: true, costingSentAt: now },
    negotiationRounds: [...negotiationRounds, newRound],
  };
}

/**
 * Cierra la ronda vigente (la última del historial) con la fecha de entrega
 * efectiva al cliente. Solo la última ronda puede estar "pendiente" — puede
 * haber rondas anteriores también marcadas "pendiente" en el historial (las
 * que se reemplazaron sin llegar a entregarse), por lo que filtrar solo por
 * `clientResponse` marcaría todas a la vez.
 */
export function closeRoundForClientDelivery(
  negotiationRounds: NegotiationRound[],
  now: string = new Date().toISOString(),
): NegotiationRound[] {
  const lastRoundIndex = negotiationRounds.length - 1;
  return negotiationRounds.map((round, idx) =>
    idx === lastRoundIndex && round.clientResponse === "pendiente" ? { ...round, sentToClientAt: now } : round,
  );
}

export interface RejectRoundResult {
  negotiationRounds: NegotiationRound[];
  costing: ProposalCosting | undefined;
}

/**
 * Marca la ronda vigente como rechazada con la observación del cliente, y
 * resetea el gate `readyForKam`/`costingSentAt` del ciclo anterior — bug
 * corregido en docs/04: sin este reset, "Enviar a cliente" quedaba
 * re-habilitado para el KAM antes de que el Líder tocara nada.
 */
export function rejectRoundWithObservations(
  negotiationRounds: NegotiationRound[],
  costing: ProposalCosting | undefined,
  clientObservation: string | undefined,
  now: string = new Date().toISOString(),
): RejectRoundResult {
  const lastRoundIndex = negotiationRounds.length - 1;
  const updatedRounds = negotiationRounds.map((round, idx) =>
    idx === lastRoundIndex && round.clientResponse === "pendiente"
      ? {
          ...round,
          clientResponse: "rechazada" as const,
          clientObservation,
          clientRespondedAt: now,
        }
      : round,
  );
  return {
    negotiationRounds: updatedRounds,
    costing: costing ? { ...costing, readyForKam: false, costingSentAt: undefined } : costing,
  };
}

type RoundScopeKey = Exclude<
  keyof NegotiationRound,
  | "id"
  | "roundNumber"
  | "totalOfferedCop"
  | "marginAmountCop"
  | "expectedMarginPercent"
  | "leaderNote"
  | "sentToKamAt"
  | "sentToClientAt"
  | "clientResponse"
  | "clientObservation"
  | "clientRespondedAt"
  | "hasScopeSnapshot"
>;

/** Campos de alcance que se comparan entre rondas, en el orden en que se listan. */
const ROUND_SCOPE_FIELDS: { key: RoundScopeKey; label: string }[] = [
  { key: "participantes", label: "Participantes" },
  { key: "modalidad", label: "Modalidad" },
  { key: "horas", label: "Horas" },
  { key: "type", label: "Tipo de servicio" },
  { key: "deadline", label: "Fecha de entrega" },
  { key: "necesidad", label: "Necesidad" },
  { key: "competencias", label: "Competencias" },
  { key: "exito", label: "Indicadores de éxito" },
  { key: "resultados", label: "Resultados esperados" },
  { key: "areaParticipantes", label: "Área de participantes" },
  { key: "alimentacion", label: "Alimentación" },
  { key: "formacionPrevia", label: "Formación previa" },
];

const NOT_SET = "Sin definir";

function displayScopeValue(key: RoundScopeKey, value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (key === "deadline") {
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? trimmed : format(date, "d MMM yyyy", { locale: es });
  }
  return trimmed;
}

/**
 * Qué cambió frente a la ronda anterior: primero el valor ofertado y luego cada
 * campo de alcance ("Sin definir" cuando no tenía dato). Nunca el margen ni el
 * costo base (el KAM también ve este historial). Si alguna de las dos rondas no
 * congeló su alcance (datos antiguos), solo se compara el precio.
 */
export function getRoundChanges(round: NegotiationRound, previousRound?: NegotiationRound): string[] {
  if (!previousRound) return [];
  const changes: string[] = [];
  if (round.totalOfferedCop !== previousRound.totalOfferedCop) {
    changes.push(`Valor ofertado: ${formatCop(previousRound.totalOfferedCop)} → ${formatCop(round.totalOfferedCop)}`);
  }
  if (round.hasScopeSnapshot === false || previousRound.hasScopeSnapshot === false) return changes;
  for (const { key, label } of ROUND_SCOPE_FIELDS) {
    const before = displayScopeValue(key, previousRound[key]);
    const after = displayScopeValue(key, round[key]);
    if (before !== after) changes.push(`${label}: ${before ?? NOT_SET} → ${after ?? NOT_SET}`);
  }
  return changes;
}
