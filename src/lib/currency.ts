// Pro-Cultura stamp: open question on the rate (docs/08, Q12). Do not change it here.
export const PRO_CULTURA_PERCENT = 1.5;
const PRO_CULTURA_CATEGORY = "Capacitación";

const THOUSANDS_GROUPED = /^\d{1,3}(\.\d{3})+$/;
const COP_INPUT = /^\$?(\d[\d.]*)(?:,(\d{1,2}))?%?$/;
const PERCENT_INPUT = /^(\d+)(?:[.,](\d+))?%?$/;

/**
 * Parses money typed in es-CO format: "." groups thousands, "," is the decimal
 * separator, at most 2 decimals. Ignores whitespace, one leading "$" and one
 * trailing "%". Returns null for anything else (negatives, letters, "1.5",
 * "1,234", empty) instead of guessing.
 */
export function parseCopInput(raw: string): number | null {
  const match = COP_INPUT.exec(raw.replace(/\s/g, ""));
  if (!match) return null;

  const [, integerPart, decimalPart] = match;
  if (integerPart.includes(".") && !THOUSANDS_GROUPED.test(integerPart)) return null;

  const value = Number(`${integerPart.replace(/\./g, "")}${decimalPart ? `.${decimalPart}` : ""}`);
  return Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER ? value : null;
}

/**
 * Same output as `formatCop` in `@/lib/mock-data` (kept in sync by a parity
 * test); duplicated only to avoid a circular import with that module.
 */
export function formatCopPreview(value: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

/**
 * Literal translation of a percentage the user typed: "30" and "30%" give 30,
 * "0.3" and "0,3" give 0.3 — it never assumes 0.3 means 30%. Percentages have
 * no thousands, so a single "." or "," is a decimal separator. Null when not
 * parseable or negative.
 */
export function parsePercentInput(raw: string): number | null {
  const match = PERCENT_INPUT.exec(raw.replace(/\s/g, ""));
  if (!match) return null;

  const [, integerPart, decimalPart] = match;
  const value = Number(decimalPart ? `${integerPart}.${decimalPart}` : integerPart);
  return Number.isFinite(value) ? value : null;
}

/** True for values strictly between 0 and 1, which usually mean "0.3 typed instead of 30". */
export function isLikelyFraction(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value < 1;
}

/**
 * Informational Pro-Cultura stamp: 1.5% of the offered total, only for
 * "Capacitación". Never added to or subtracted from the total.
 */
export function calculateProCulturaReference(
  totalOfferedCop: number,
  serviceCategory: string,
): { applies: boolean; amount: number } {
  const applies = serviceCategory === PRO_CULTURA_CATEGORY;
  return { applies, amount: applies ? Math.round(totalOfferedCop * (PRO_CULTURA_PERCENT / 100)) : 0 };
}
