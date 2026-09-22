import { apiRequest } from "./client";

// Mirrors the backend contract of commercial-requests-backend (src/modules/companies).
export type CompanyType = "PUBLICA" | "PRIVADA" | "MIXTA" | "SIN_ANIMO_LUCRO";

export interface Company {
  id: string;
  name: string;
  /** Digits only (e.g. "8909006089"); null for historical companies without NIT. */
  nit: string | null;
  description: string | null;
  website: string | null;
  area: string | null;
  type: CompanyType | null;
  sector: string | null;
}

export const companiesApi = {
  /** Autocomplete search by company name or NIT (max 10 results). */
  search: (query: string) => apiRequest<Company[]>(`/companies/search?q=${encodeURIComponent(query)}`),
};
