import type { RequestItem } from "@/lib/mock-data";
import { canonicalNit } from "@/lib/nit";

/** Lower-cases, drops accents and collapses spaces so names compare "exactly" the way people read them. */
export function normalizeCompanyName(name: string | null | undefined): string {
  return (name ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export interface CompanyHistoryQuery {
  name?: string;
  nit?: string;
}

/**
 * Antecedents of a company: requests whose company has exactly this NIT or
 * exactly this name. NITs are compared with their check digit (see `canonicalNit`),
 * so a 9-digit NIT finds the same company's 10-digit one and the other way round.
 * No partial or word-by-word matching, so a word like "Grupo" never brings in
 * other companies. Without NIT and name: no results.
 */
export function findCompanyProposals(requests: RequestItem[], query: CompanyHistoryQuery): RequestItem[] {
  const name = normalizeCompanyName(query.name);
  const nit = canonicalNit(query.nit);
  if (!name && !nit) return [];
  return requests.filter(
    (r) =>
      (name !== "" && normalizeCompanyName(r.company) === name) || (nit !== "" && canonicalNit(r.companyNit) === nit),
  );
}

/** What the free-text box searches: digits, dots, hyphens and spaces only means "this is a NIT". */
export function parseHistorySearchTerm(term: string): CompanyHistoryQuery {
  const trimmed = term.trim();
  if (!trimmed) return {};
  return /^[\d.\-\s]+$/.test(trimmed) ? { nit: trimmed } : { name: trimmed };
}
