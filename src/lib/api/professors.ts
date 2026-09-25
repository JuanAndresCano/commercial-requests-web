import { apiRequest } from "./client";

// Mirrors the backend contract of commercial-requests-backend (src/modules/professors).
// Professors have no account: this is a look-up directory for the product leader.
export type ProfessorType = "STAFF" | "EXTERNAL";

export interface Professor {
  id: string;
  fullName: string;
  type: ProfessorType;
  /** Only for STAFF professors; may be null while the faculty is unknown. */
  faculty: string | null;
  /** Only for EXTERNAL advisors (free text). */
  company: string | null;
  /** Only for EXTERNAL advisors; all optional, captured at registration time. */
  identityDocument: string | null;
  email: string | null;
  phone: string | null;
  profile: string | null;
  isActive: boolean;
}

export interface ProfessorSearchParams {
  q?: string;
  type?: ProfessorType;
  faculty?: string;
  /** 1–50, defaults to 20 on the backend. */
  limit?: number;
}

export interface NewExternalProfessor {
  fullName: string;
  company?: string;
  identityDocument?: string;
  email?: string;
  phone?: string;
  profile?: string;
}

export const professorsApi = {
  /** Searches active entries by name, company or faculty (PRODUCT_LEADER / ADMIN only). */
  list: (params: ProfessorSearchParams = {}) => {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.type) search.set("type", params.type);
    if (params.faculty) search.set("faculty", params.faculty);
    if (params.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    return apiRequest<Professor[]>(`/professors${qs ? `?${qs}` : ""}`);
  },
  /** Registers an external advisor once; answers 409 when the same name and company exist. */
  createExternal: (data: NewExternalProfessor) => apiRequest<Professor>("/professors", { method: "POST", body: data }),
};
