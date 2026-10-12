import { useCallback, useEffect, useRef, useState } from "react";
import {
  openSessionChannel,
  sessionConflictReason,
  type SessionChannel,
  type SessionConflictReason,
  type SessionSignal,
} from "@/lib/session-sync";

/**
 * Cross-tab session awareness. `conflict` holds the reason (see
 * sessionConflictReason) once another tab of this browser signed in as someone
 * else or signed out while this tab still shows `currentUserId`; `announce`
 * tells the other tabs about this tab's own sign-in or sign-out.
 */
export function useSessionSync(currentUserId: string | null) {
  const [conflict, setConflict] = useState<SessionConflictReason | null>(null);
  const userIdRef = useRef(currentUserId);
  const channelRef = useRef<SessionChannel | null>(null);

  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    const channel = openSessionChannel((signal) => {
      const reason = sessionConflictReason(userIdRef.current, signal);
      if (reason) setConflict(reason);
    });
    channelRef.current = channel;
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const announce = useCallback((signal: SessionSignal) => {
    channelRef.current?.post(signal);
  }, []);

  return { conflict, announce };
}
