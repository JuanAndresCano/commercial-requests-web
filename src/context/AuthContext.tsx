import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi, type SessionUser } from "@/lib/api/auth";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { isSessionActive, mapBackendRoles, msUntilExpiry } from "@/lib/session";
import { useSessionSync } from "@/hooks/use-session-sync";
import type { SessionConflictReason } from "@/lib/session-sync";
import { resetDashboardUiState } from "@/lib/dashboard-ui-state";
import { useTheme } from "@/context/ThemeContext";
import { toTitleCase } from "@/lib/format-name";

export type UserRole = "kam" | "lider-producto" | "administrador";

export interface User {
  role: UserRole;
  roleLabel: string;
  name: string;
  email: string;
  node?: string;
  requestedRole?: "KAM" | "PRODUCT_LEADER" | null;
}

export const ROLE_CONFIGS: Record<UserRole, { label: string; node?: string }> = {
  kam: { label: "KAM" },
  "lider-producto": {
    label: "Líder de Producto",
    node: "Inteligencia Artificial y Tecnologías Digitales",
  },
  administrador: { label: "Administrador" },
};

// Legacy keys for previous mock login and mock storage; session now lives in httpOnly cookies.
const LEGACY_STORAGE_KEY_USER = "icesi_auth_user_v3";
const STORAGE_KEY_REQUESTS = "icesi_requests_data_v3";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "pending-role";

// Placeholder while nobody is signed in. Routes are guarded by RequireAuth, so
// no page renders with it; it only keeps `user` non-nullable for consumers.
const ANONYMOUS_USER: User = { role: "kam", roleLabel: "", name: "", email: "" };

interface AuthContextType {
  user: User;
  status: AuthStatus;
  login: (email: string, password?: string) => Promise<void>;
  devLogin: (email: string) => Promise<void>;
  refreshSession: () => Promise<SessionUser | null>;
  requestRole: (role: "KAM" | "PRODUCT_LEADER") => Promise<void>;
  logout: () => void;
  /**
   * Another tab of this browser signed in as someone else (or signed out), so the
   * session cookie no longer belongs to the user this tab shows. Reload to continue.
   */
  sessionConflict: SessionConflictReason | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User>(ANONYMOUS_USER);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { conflict: sessionConflict, announce } = useSessionSync(userId);

  const { setTheme } = useTheme();

  // Every session starts like the first visit: light theme and clean boards.
  const resetUiForNewSession = useCallback(() => {
    resetDashboardUiState();
    setTheme("light");
  }, [setTheme]);

  const clearSession = useCallback(() => {
    // Query keys are shared by authenticated screens. Destroying the old queries
    // also cancels their in-flight results, so a late A response cannot populate
    // B's dashboard after this tab changes account (money, lists and details).
    queryClient.clear();
    setUser(ANONYMOUS_USER);
    setUserId(null);
    setExpiresAt(null);
    setStatus("unauthenticated");
    resetUiForNewSession();
  }, [queryClient, resetUiForNewSession]);

  // Returns false (and leaves the user signed out) when the session is expired
  // or the account has no role the UI knows about.
  const applySession = useCallback(
    (session: SessionUser): boolean => {
      if (!isSessionActive(session.expiresAt)) {
        clearSession();
        return false;
      }
      const roles = mapBackendRoles(session.roles);
      if (session.isPendingRole || roles.length === 0) {
        const fullName = toTitleCase([session.firstName, session.lastName].filter(Boolean).join(" "));
        setUser({
          role: "kam",
          roleLabel: "Pendiente de Aprobación",
          name: fullName || session.email,
          email: session.email,
          requestedRole: session.requestedRole,
        });
        setUserId(session.id);
        setExpiresAt(session.expiresAt);
        setStatus("pending-role");
        return true;
      }
      if (roles.length > 1) {
        console.warn(
          `[auth] Session for user ${session.id} arrived with ${roles.length} roles; expected exactly one. ` +
            `Received: ${session.roles.join(", ")}. Using "${roles[0]}".`,
        );
      }
      const cfg = ROLE_CONFIGS[roles[0]];
      const fullName = toTitleCase([session.firstName, session.lastName].filter(Boolean).join(" "));
      queryClient.clear();
      setUser({
        role: roles[0],
        roleLabel: cfg.label,
        name: fullName || session.email,
        email: session.email,
        node: cfg.node,
        requestedRole: session.requestedRole,
      });
      setUserId(session.id);
      setExpiresAt(session.expiresAt);
      setStatus("authenticated");
      return true;
    },
    [clearSession, queryClient],
  );

  // Restore the session from the cookie on load; never trust local state.
  useEffect(() => {
    localStorage.removeItem(LEGACY_STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_REQUESTS);
    let cancelled = false;
    authApi
      .getMe()
      .then((session) => {
        if (!cancelled) applySession(session);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      });
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  // Any 401 on an authenticated request (revoked or expired session) signs out.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Sign out the moment the token expires, even if the tab stays idle.
  useEffect(() => {
    if (expiresAt === null) return;
    const timer = window.setTimeout(clearSession, msUntilExpiry(expiresAt));
    return () => window.clearTimeout(timer);
  }, [expiresAt, clearSession]);

  const devLogin = useCallback(
    async (email: string) => {
      resetUiForNewSession();
      await authApi.devLogin(email);
      const session = await authApi.getMe();
      if (!applySession(session)) {
        throw new Error("No se pudo iniciar sesión con la cuenta seleccionada.");
      }
      announce({ type: "login", userId: session.id });
    },
    [applySession, announce, resetUiForNewSession],
  );

  const refreshSession = useCallback(async (): Promise<SessionUser | null> => {
    try {
      const session = await authApi.getMe();
      applySession(session);
      return session;
    } catch {
      clearSession();
      return null;
    }
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email: string, _password?: string) => {
      await devLogin(email);
    },
    [devLogin],
  );

  const requestRole = useCallback(async (role: "KAM" | "PRODUCT_LEADER") => {
    await authApi.requestRole(role);
    setUser((prev) => ({ ...prev, requestedRole: role }));
  }, []);

  const logout = () => {
    // Clear local state first; the request still carries the cookie and bumps
    // tokenVersion server-side so the token cannot be replayed.
    clearSession();
    announce({ type: "logout" });
    void authApi.logout().catch(() => undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        devLogin,
        refreshSession,
        requestRole,
        logout,
        sessionConflict,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
