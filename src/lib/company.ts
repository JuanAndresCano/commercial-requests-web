import type { CompanyType } from "@/lib/api/companies";

const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  PUBLICA: "Pública",
  PRIVADA: "Privada",
  MIXTA: "Mixta",
  SIN_ANIMO_LUCRO: "Sin ánimo de lucro",
};

export function companyTypeLabel(type: CompanyType | null): string | undefined {
  return type ? COMPANY_TYPE_LABELS[type] : undefined;
}
