import type { UserRole } from "@/context/AuthContext";

/** setTimeout stores its delay in a signed 32-bit int; larger values fire immediately. */
export const MAX_TIMER_MS = 2_147_483_647;

/** The client never assumes a session is valid past the backend-declared expiry. */
export function isSessionActive(expiresAt: number, now: number = Date.now()): boolean {
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export function msUntilExpiry(expiresAt: number, now: number = Date.now()): number {
  return Math.min(Math.max(expiresAt - now, 0), MAX_TIMER_MS);
}

const BACKEND_ROLE_TO_USER_ROLE: Record<string, UserRole> = {
  KAM: "kam",
  PRODUCT_LEADER: "lider-producto",
  NODE_LEADER: "lider-nodo",
  PROFESSOR: "profesor",
};

/** Maps backend role codes to UI roles; codes without a UI counterpart (ADMIN, ASSISTANT) are dropped. */
export function mapBackendRoles(codes: string[]): UserRole[] {
  const mapped = codes.flatMap((code) => BACKEND_ROLE_TO_USER_ROLE[code] ?? []);
  return Array.from(new Set(mapped));
}
