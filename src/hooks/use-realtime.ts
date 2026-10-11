import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api/client";
import {
  BACKUP_POLL_MS,
  REALTIME_BATCH_MS,
  buildInvalidationPlan,
  isQueryAffected,
  nextReconnectDelay,
  parseRealtimeEvent,
  type RealtimeEvent,
  type RealtimeStatus,
} from "@/lib/realtime";

const isTabVisible = () => document.visibilityState !== "hidden";

/**
 * Keeps the boards live without reloading: opens `GET /events` (Server-Sent Events, session
 * cookie) and, for every "proposal X changed" notice, marks the affected TanStack queries
 * stale so the active ones refetch. Notices that arrive close together are refetched once.
 *
 * - If the stream drops it reconnects with backoff and, until it is back, polls the boards
 *   every few seconds; the normal (slower) polling of each query keeps running anyway.
 * - A hidden tab closes the stream and stops polling; it refreshes again when it is shown.
 * - `enabled = false` (no session, or the tab is blocked by the session-conflict dialog)
 *   closes everything.
 *
 * Mount it once, high in the tree (see RealtimeProvider).
 */
export function useRealtime({ enabled }: { enabled: boolean }): RealtimeStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>(enabled ? "connecting" : "off");

  useEffect(() => {
    if (!enabled) {
      setStatus("off");
      return;
    }

    let source: EventSource | null = null;
    let attempt = 0;
    let needsCatchUp = false;
    let retryTimer: number | undefined;
    let pollTimer: number | undefined;
    let batchTimer: number | undefined;
    let pending: RealtimeEvent[] = [];

    const refreshAll = () => {
      void queryClient.invalidateQueries({ queryKey: ["requests"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    };

    const flush = () => {
      batchTimer = undefined;
      const plan = buildInvalidationPlan(pending);
      pending = [];
      void queryClient.invalidateQueries({ predicate: (query) => isQueryAffected(query.queryKey, plan) });
    };

    const stopPolling = () => {
      window.clearInterval(pollTimer);
      pollTimer = undefined;
    };

    const startPolling = () => {
      if (pollTimer === undefined) pollTimer = window.setInterval(refreshAll, BACKUP_POLL_MS);
    };

    const clearRetry = () => {
      window.clearTimeout(retryTimer);
      retryTimer = undefined;
    };

    const closeSource = () => {
      if (source) {
        source.onopen = null;
        source.onmessage = null;
        source.onerror = null;
        source.close();
        source = null;
      }
    };

    const connect = () => {
      clearRetry();
      closeSource();
      const stream = new EventSource(`${API_URL}/events`, { withCredentials: true });
      source = stream;
      setStatus(needsCatchUp ? "reconnecting" : "connecting");

      stream.onopen = () => {
        attempt = 0;
        stopPolling();
        setStatus("live");
        if (needsCatchUp) {
          // Whatever changed while there was no stream is fetched once.
          needsCatchUp = false;
          refreshAll();
        }
      };
      stream.onmessage = (message: MessageEvent<string>) => {
        const event = parseRealtimeEvent(message.data);
        if (!event) return;
        pending.push(event);
        if (batchTimer === undefined) batchTimer = window.setTimeout(flush, REALTIME_BATCH_MS);
      };
      stream.onerror = () => {
        // Also covers fatal answers (e.g. 401, 429) after which the browser would not retry
        // by itself: the reconnection is always driven from here.
        closeSource();
        needsCatchUp = true;
        setStatus("reconnecting");
        startPolling();
        clearRetry();
        retryTimer = window.setTimeout(connect, nextReconnectDelay(attempt++));
      };
    };

    const pause = () => {
      clearRetry();
      stopPolling();
      window.clearTimeout(batchTimer);
      batchTimer = undefined;
      pending = [];
      closeSource();
      setStatus("paused");
    };

    const resume = () => {
      attempt = 0;
      needsCatchUp = false;
      refreshAll();
      connect();
    };

    const onVisibilityChange = () => {
      if (isTabVisible()) resume();
      else pause();
    };

    const onOnline = () => {
      // Only matters while waiting for a retry.
      if (retryTimer !== undefined) connect();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);

    if (isTabVisible()) connect();
    else setStatus("paused");

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      clearRetry();
      stopPolling();
      window.clearTimeout(batchTimer);
      pending = [];
      closeSource();
    };
  }, [enabled, queryClient]);

  return status;
}
