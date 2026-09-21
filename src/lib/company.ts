import type { CompanyType } from "@/lib/api/companies";

/** Shows a stored NIT the usual way: nine digits, hyphen, check digit. */
export function formatNit(nit: string): string {
  return /^\d{10}$/.test(nit) ? `${nit.slice(0, 9)}-${nit.slice(9)}` : nit;
}

const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  PUBLICA: "Pública",
  PRIVADA: "Privada",
  MIXTA: "Mixta",
  SIN_ANIMO_LUCRO: "Sin ánimo de lucro",
};

export function companyTypeLabel(type: CompanyType | null): string | undefined {
  return type ? COMPANY_TYPE_LABELS[type] : undefined;
}
