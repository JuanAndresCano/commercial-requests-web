/**
 * Keeps several tabs of the same browser honest about who is signed in. The
 * session is one cookie shared by every tab, so signing in as someone else (or
 * out) in one tab changes the identity of all of them. Tabs announce those
 * events here so the others can tell their user instead of failing with 403.
 */

export type SessionSignal = { type: "login"; userId: string } | { type: "logout" };

export const SESSION_CHANNEL_NAME = "icesi-session";

export function parseSessionSignal(raw: unknown): SessionSignal | null {
  if (typeof raw !== "object" || raw === null) return null;
  const candidate = raw as { type?: unknown; userId?: unknown };
  if (candidate.type === "logout") return { type: "logout" };
  if (candidate.type === "login" && typeof candidate.userId === "string" && candidate.userId !== "") {
    return { type: "login", userId: candidate.userId };
  }
  return null;
}

export type SessionConflictReason = "user-changed" | "signed-out";

/** Why what another tab did makes the user shown in this tab stale; null when it does not. */
export function sessionConflictReason(
  currentUserId: string | null,
  signal: SessionSignal,
): SessionConflictReason | null {
  if (currentUserId === null) return null;
  if (signal.type === "logout") return "signed-out";
  return signal.userId !== currentUserId ? "user-changed" : null;
}

export interface SessionChannel {
  post: (signal: SessionSignal) => void;
  close: () => void;
}

/**
 * Opens the cross-tab channel over BroadcastChannel (every current browser).
 * Where it does not exist the channel is inert: tabs are simply not warned.
 * There is deliberately no `storage`-event fallback: the repo forbids localStorage
 * outside the allow-listed UI-state files.
 */
export function openSessionChannel(onSignal: (signal: SessionSignal) => void): SessionChannel {
  if (typeof BroadcastChannel === "undefined") {
    return { post: () => undefined, close: () => undefined };
  }
  const channel = new BroadcastChannel(SESSION_CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent) => {
    const signal = parseSessionSignal(event.data);
    if (signal) onSignal(signal);
  };
  return {
    post: (signal) => channel.postMessage(signal),
    close: () => channel.close(),
  };
}
