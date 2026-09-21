import { type NegotiationRound, type ProposalCosting, type RequestItem } from "@/lib/mock-data";

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
    marginAmountCop: req.costing.marginAmountCop,
    expectedMarginPercent: req.costing.expectedMarginPercent,
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
