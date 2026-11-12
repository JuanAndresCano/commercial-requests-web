const DAYS_PER_MONTH = 30.44;

export function monthsFromDays(days: number): number {
  return days / DAYS_PER_MONTH;
}

/** "menos de 1 mes", "1 mes", "6 meses", "1,8 meses" (one decimal below 10). */
export function formatMonths(months: number): string {
  if (months < 1) return "menos de 1 mes";
  const rounded = months < 10 ? Math.round(months * 10) / 10 : Math.round(months);
  const text = rounded.toLocaleString("es-CO", { maximumFractionDigits: 1 });
  return `${text} ${rounded === 1 ? "mes" : "meses"}`;
}

/** 0.181 -> "18,1 %" */
export function formatRate(rate: number): string {
  return `${(rate * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`;
}

export function formatCount(value: number): string {
  return value.toLocaleString("es-CO", { maximumFractionDigits: 1 });
}

/** "11 de noviembre de 2026" from a YYYY-MM-DD string, without time-zone shifts. */
export function formatDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return day;
  return new Date(year, month - 1, date).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface RateComparison {
  points: number;
  text: string;
  direction: "above" | "below" | "equal";
}

/** Difference to the area rate in percentage points, with an explicit sign and words. */
export function rateVsArea(rate: number, areaRate: number): RateComparison {
  const points = Math.round((rate - areaRate) * 1000) / 10;
  if (points === 0) return { points, direction: "equal", text: "igual que el área" };
  const abs = Math.abs(points).toLocaleString("es-CO", { maximumFractionDigits: 1 });
  return points > 0
    ? { points, direction: "above", text: `+${abs} pts sobre el área` }
    : { points, direction: "below", text: `−${abs} pts bajo el área` };
}

/** "FORMACION A LA MEDIDA" -> "Formacion a la medida": a readable fallback for values we have no label for. */
export function sentenceCase(text: string | null | undefined): string {
  if (!text) return "—";
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// The data stores these in capitals and without accents (it is the source's spelling and stays as it is in the
// database); only the way they are shown is fixed here.
const PROGRAM_TYPE_LABELS: Record<string, string> = {
  "FORMACION A LA MEDIDA PARA ORGANIZACIONES": "Formación a la medida para organizaciones",
  "CONSULTORIA / MENTORIA": "Consultoría / mentoría",
  DIPLOMADO: "Diplomado",
  "PROYECTOS ESPECIALES": "Proyectos especiales",
  SEMINARIO: "Seminario",
  "SERVICIO ESPECIALIZADOS": "Servicios especializados",
};

const COMPANY_TYPE_LABELS: Record<string, string> = {
  PRIVADA: "Privada",
  PUBLICA: "Pública",
  MIXTA: "Mixta",
  SIN_ANIMO_LUCRO: "Sin ánimo de lucro",
};

export function programTypeLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return PROGRAM_TYPE_LABELS[value.trim().toUpperCase()] ?? sentenceCase(value);
}

export function companyTypeLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return COMPANY_TYPE_LABELS[value.trim().toUpperCase()] ?? sentenceCase(value);
}
