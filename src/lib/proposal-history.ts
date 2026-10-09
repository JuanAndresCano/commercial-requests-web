import type { RequestItem } from "@/lib/mock-data";

/** Lower-cases, drops accents and collapses spaces so names compare "exactly" the way people read them. */
export function normalizeCompanyName(name: string | null | undefined): string {
  return (name ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** A NIT is compared by its digits only (dots, hyphens and spaces are formatting). */
export function normalizeNit(nit: string | null | undefined): string {
  return (nit ?? "").replace(/\D/g, "");
}

export interface CompanyHistoryQuery {
  name?: string;
  nit?: string;
}

/**
 * Antecedents of a company: requests whose company has exactly this NIT or
 * exactly this name. No partial or word-by-word matching, so a word like
 * "Grupo" never brings in other companies. Without NIT and name: no results.
 */
export function findCompanyProposals(requests: RequestItem[], query: CompanyHistoryQuery): RequestItem[] {
  const name = normalizeCompanyName(query.name);
  const nit = normalizeNit(query.nit);
  if (!name && !nit) return [];
  return requests.filter(
    (r) =>
      (name !== "" && normalizeCompanyName(r.company) === name) || (nit !== "" && normalizeNit(r.companyNit) === nit),
  );
}

/** What the free-text box searches: digits, dots, hyphens and spaces only means "this is a NIT". */
export function parseHistorySearchTerm(term: string): CompanyHistoryQuery {
  const trimmed = term.trim();
  if (!trimmed) return {};
  return /^[\d.\-\s]+$/.test(trimmed) ? { nit: trimmed } : { name: trimmed };
}
