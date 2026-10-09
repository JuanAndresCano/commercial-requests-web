import { differenceInDays } from "date-fns";
import type { RequestItem, RequestStatus } from "@/lib/mock-data";
import type { BoardStage } from "@/lib/board-stages";

type StageAgeSource = Pick<RequestItem, "createdAt" | "statusUpdatedAt" | "costing">;

/**
 * Momento en que la solicitud entró a la etapa que se muestra en pantalla.
 *
 * Normalmente es `statusUpdatedAt` (último cambio de estado real), con
 * `createdAt` como respaldo. La excepción es la etapa "Lista para entregar" del
 * KAM: ahí la solicitud ya estaba en `en-costeo` desde antes (el Líder la
 * estaba costeando) y solo se vuelve entregable cuando el Líder pulsa "Enviar a
 * KAM", así que el reloj de esa etapa arranca en `costing.costingSentAt`.
 *
 * `displayedStage` es la etapa tal como la percibe quien mira el tablero (para
 * el KAM, ver `kamStageOf`), no necesariamente `req.status`.
 */
export function getStageStartedAt(req: StageAgeSource, displayedStage: RequestStatus): string {
  if (displayedStage === "en-costeo" && req.costing?.costingSentAt) return req.costing.costingSentAt;
  return req.statusUpdatedAt ?? req.createdAt;
}

/**
 * Same idea for the product leader's board. "Enviada al KAM" counts from the moment the leader
 * sent it (`costing.costingSentAt`); every other stage, including "En proceso de costeo", counts
 * from the last real status change.
 */
export function getLeaderStageStartedAt(req: StageAgeSource, stage: BoardStage): string {
  if (stage === "enviada-kam" && req.costing?.costingSentAt) return req.costing.costingSentAt;
  return req.statusUpdatedAt ?? req.createdAt;
}

/** Días completos transcurridos desde `startedAt`. Nunca negativo; `null` si la fecha no es válida. */
export function getStageAgeDays(startedAt: string, now: Date = new Date()): number | null {
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  return Math.max(0, differenceInDays(now, start));
}

/** Texto del indicador, p. ej. "Lleva 3 días en esta etapa". */
export function formatStageAge(days: number): string {
  if (days < 1) return "Lleva menos de 1 día en esta etapa";
  if (days === 1) return "Lleva 1 día en esta etapa";
  return `Lleva ${days} días en esta etapa`;
}

/** Atajo para las vistas: texto del indicador de una solicitud, o `null` si no hay fecha utilizable. */
export function getStageAgeLabel(
  req: StageAgeSource,
  displayedStage: RequestStatus,
  now: Date = new Date(),
): string | null {
  const days = getStageAgeDays(getStageStartedAt(req, displayedStage), now);
  return days === null ? null : formatStageAge(days);
}
