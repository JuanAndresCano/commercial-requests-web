/**
 * Pure helpers of the real-time channel (Server-Sent Events from `GET /events`).
 * The backend only says "proposal X changed"; the browser then refetches through the
 * normal, authorized endpoints. Nothing here touches the network or React.
 */

export type RealtimeEventType =
  | "created"
  | "status"
  | "professor"
  | "costing"
  | "delivered"
  | "returned"
  | "reassigned"
  | "node"
  | "center"
  | "info"
  | "cancelled"
  /** A type this client does not know yet (newer backend): still a change worth refetching. */
  | "unknown";

export interface RealtimeEvent {
  proposalId: string;
  type: RealtimeEventType;
}

export type RealtimeStatus = "off" | "connecting" | "live" | "reconnecting" | "paused";

/** Events that arrive within this window are refetched together, not one request each. */
export const REALTIME_BATCH_MS = 250;
/** While there is no live connection the boards are polled at this pace instead. */
export const BACKUP_POLL_MS = 5000;

const KNOWN_TYPES: ReadonlySet<string> = new Set<RealtimeEventType>([
  "created",
  "status",
  "professor",
  "costing",
  "delivered",
  "returned",
  "reassigned",
  "node",
  "center",
  "info",
  "cancelled",
]);

export function parseRealtimeEvent(raw: string): RealtimeEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { proposalId, type } = value as { proposalId?: unknown; type?: unknown };
  if (typeof proposalId !== "string" || proposalId === "" || typeof type !== "string") return null;
  return {
    proposalId,
    type: KNOWN_TYPES.has(type) ? (type as RealtimeEventType) : "unknown",
  };
}

export interface InvalidationPlan {
  /** Proposals whose open detail must be refetched. */
  proposalIds: ReadonlySet<string>;
}

export function buildInvalidationPlan(events: readonly RealtimeEvent[]): InvalidationPlan {
  return { proposalIds: new Set(events.map((event) => event.proposalId)) };
}

/**
 * Which TanStack queries a batch of events makes stale: every board listing
 * (["requests", params]), the dashboard metrics, and the detail
 * (["requests", id]) of the proposals that changed. Nothing else.
 */
export function isQueryAffected(queryKey: readonly unknown[], plan: InvalidationPlan): boolean {
  const [scope, second] = queryKey;
  if (scope === "dashboard-metrics") return true;
  if (scope !== "requests") return false;
  if (typeof second === "string") return plan.proposalIds.has(second);
  return true;
}

/** Exponential backoff (1 s, 2 s, 4 s ... capped at 30 s) with +/-20 % jitter. */
export function nextReconnectDelay(attempt: number, random: () => number = Math.random): number {
  const base = 1000 * 2 ** Math.min(attempt, 10);
  const jitter = 0.8 + 0.4 * random();
  return Math.round(Math.min(base * jitter, 30_000));
}

/** The text of the small connection indicator; null = nothing to show. */
export function realtimeStatusLabel(status: RealtimeStatus): string | null {
  switch (status) {
    case "live":
      return "En vivo";
    case "reconnecting":
      return "Reconectando…";
    case "connecting":
      return "Conectando…";
    default:
      return null;
  }
}
