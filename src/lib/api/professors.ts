import { apiRequest } from "./client";

// Mirrors the backend contract of commercial-requests-backend (src/modules/professors).
// Professors have no account: this is a directory the product leader types into and looks up.
export type ProfessorType = "STAFF" | "EXTERNAL";

export interface Professor {
  id: string;
  fullName: string;
  type: ProfessorType;
  /** Only for STAFF professors; may be null while the faculty is unknown. */
  faculty: string | null;
  /** Only for EXTERNAL advisors (free text). */
  company: string | null;
  /** Optional data typed by the product leader (any kind). The KAM never receives `identityDocument`. */
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

/**
 * What the product leader types, for both kinds, in one shape. `faculty` only makes sense for STAFF and
 * `company` for EXTERNAL. Only `fullName` is required.
 */
export interface ProfessorInput {
  fullName: string;
  type: ProfessorType;
  faculty?: string;
  company?: string;
  identityDocument?: string;
  email?: string;
  phone?: string;
  profile?: string;
}

/** Answer of POST /professors: 201 when created, 200 when an existing entry was reused (never updated). */
export interface SavedProfessor extends Professor {
  reused: boolean;
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
  /** Creates the professor/advisor, or reuses the existing entry without updating it (`reused: true`). */
  create: (data: ProfessorInput) => apiRequest<SavedProfessor>("/professors", { method: "POST", body: data }),
};
