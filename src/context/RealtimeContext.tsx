import React, { createContext, useContext } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRealtime } from "@/hooks/use-realtime";
import type { RealtimeStatus } from "@/lib/realtime";

export const RealtimeStatusContext = createContext<RealtimeStatus>("off");

/**
 * Opens the real-time channel once for the whole app, only while there is a session and
 * this tab is not blocked by the session-conflict dialog (its cookie no longer matches
 * the user it shows). Everything below can read the connection state.
 */
export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, sessionConflict } = useAuth();
  const connection = useRealtime({ enabled: status === "authenticated" && sessionConflict === null });
  return <RealtimeStatusContext.Provider value={connection}>{children}</RealtimeStatusContext.Provider>;
};

export function useRealtimeStatus(): RealtimeStatus {
  return useContext(RealtimeStatusContext);
}
