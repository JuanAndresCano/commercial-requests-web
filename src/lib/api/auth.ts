import { apiRequest } from "./client";

// Mirrors the backend contract of commercial-requests-backend (src/modules/auth).
export interface LoginResponse {
  accessToken: string;
  /** Token expiry, epoch milliseconds (the JWT `exp`). */
  expiresAt: number;
  isPendingRole?: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  /** Backend role codes, e.g. KAM, PRODUCT_LEADER. */
  roles: string[];
  isPendingRole?: boolean;
  requestedRole?: "KAM" | "PRODUCT_LEADER" | null;
  expiresAt: number;
}

export const authApi = {
  login: (email: string, _password?: string) =>
    apiRequest<LoginResponse>("/auth/dev-login", {
      method: "POST",
      body: { email },
      skipUnauthorizedHandler: true,
    }),
  devLogin: (email: string) =>
    apiRequest<LoginResponse>("/auth/dev-login", {
      method: "POST",
      body: { email },
      skipUnauthorizedHandler: true,
    }),
  /** Fails with 401 when there is no valid session cookie. */
  getMe: () => apiRequest<SessionUser>("/auth/me"),
  requestRole: (role: "KAM" | "PRODUCT_LEADER") =>
    apiRequest<{ success: boolean; requestedRole: string }>("/auth/request-role", {
      method: "POST",
      body: { role },
    }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
};
