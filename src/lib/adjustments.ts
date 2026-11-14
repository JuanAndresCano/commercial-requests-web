import type { RequestItem } from "./mock-data";

/**
 * "Sustentación y ajustes": the client returned the proposal with observations. Single source of
 * the rule for every board, card, badge and the detail view.
 *
 * - `pending`: the last return has not been presented again (the proposal is back in costing).
 * - `resent`: it was returned at least once and has already been presented again.
 * - `none`: the client never returned it.
 *
 * The server sends `adjustmentCount` and `hasPendingAdjustment`. When they are missing (local
 * fallback data or an older server) the rule falls back to the text of the observations and to
 * the rounds the client returned.
 */
export type AdjustmentState = "pending" | "resent" | "none";

/** Board filter value: "" = no filter. */
export type AdjustmentFilter = AdjustmentState | "";

export type AdjustmentSource = Pick<
  RequestItem,
  "status" | "clientObservations" | "adjustmentCount" | "hasPendingAdjustment"
> & { negotiationRounds?: Array<{ clientResponse: string }> };

export const ADJUSTMENT_FILTER_LABELS: Record<AdjustmentFilter, string> = {
  "": "Todas",
  pending: "Pendientes",
  resent: "Ya reenviadas",
  none: "Sin ajustes",
};

/** Dots shared by the filter and its legend: amber while pending, neutral once resent. */
export const ADJUSTMENT_THEME: Record<AdjustmentState, { dot: string }> = {
  pending: { dot: "bg-amber-600 dark:bg-amber-400" },
  resent: { dot: "bg-muted-foreground/50" },
  none: { dot: "bg-muted-foreground/30" },
};

export function isAdjustmentFilter(value: unknown): value is Exclude<AdjustmentFilter, ""> {
  return value === "pending" || value === "resent" || value === "none";
}

function isPending(req: AdjustmentSource): boolean {
  if (req.status !== "en-costeo") return false;
  if (typeof req.hasPendingAdjustment === "boolean") return req.hasPendingAdjustment;
  return Boolean(req.clientObservations?.trim());
}

export function hasPendingAdjustment(req: AdjustmentSource): boolean {
  return isPending(req);
}

/** How many "Sustentación y ajuste N" the proposal went through (the pending one included). */
export function getAdjustmentCount(req: AdjustmentSource): number {
  const count =
    typeof req.adjustmentCount === "number"
      ? req.adjustmentCount
      : (req.negotiationRounds?.filter((round) => round.clientResponse === "rechazada").length ?? 0);
  return isPending(req) ? Math.max(count, 1) : Math.max(count, 0);
}

export function getAdjustmentState(req: AdjustmentSource): AdjustmentState {
  if (isPending(req)) return "pending";
  return getAdjustmentCount(req) > 0 ? "resent" : "none";
}

export function matchesAdjustmentFilter(req: AdjustmentSource, filter: AdjustmentFilter): boolean {
  return !filter || getAdjustmentState(req) === filter;
}

export function countPendingAdjustments(requests: AdjustmentSource[]): number {
  return requests.filter(isPending).length;
}

export function adjustmentBadgeLabel(count: number): string {
  return `${count} ${count === 1 ? "ajuste" : "ajustes"}`;
}

export function adjustmentBadgeTitle(count: number): string {
  return count === 1 ? "Pasó por 1 sustentación y ajuste" : `Pasó por ${count} sustentaciones y ajustes`;
}
