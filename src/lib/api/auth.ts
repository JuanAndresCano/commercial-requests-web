import { apiRequest } from "./client";

// Mirrors the backend contract of commercial-requests-backend (src/modules/auth).
export interface LoginResponse {
  accessToken: string;
  /** Token expiry, epoch milliseconds (the JWT `exp`). */
  expiresAt: number;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  /** Backend role codes, e.g. KAM, PRODUCT_LEADER. */
  roles: string[];
  expiresAt: number;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipUnauthorizedHandler: true,
    }),
  /** Fails with 401 when there is no valid session cookie. */
  getMe: () => apiRequest<SessionUser>("/auth/me"),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
};
