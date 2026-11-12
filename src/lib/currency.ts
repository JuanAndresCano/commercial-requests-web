// Pro-Cultura stamp: open question on the rate (docs/08, Q12). Do not change it here.
export const PRO_CULTURA_PERCENT = 1.5;
const PRO_CULTURA_CATEGORY = "Capacitación";

const THOUSANDS_GROUPED = /^\d{1,3}(\.\d{3})+$/;
const COP_INPUT = /^\$?(\d[\d.]*)(?:,(\d+))?%?$/;
const PERCENT_INPUT = /^(\d+)(?:[.,](\d+))?%?$/;

/**
 * Parses money typed in es-CO format: "." groups thousands, "," is the decimal
 * separator with any number of digits, returned unrounded (the backend rounds
 * half-up to 2 decimals). Ignores whitespace, one leading "$" and one trailing
 * "%". Returns null for anything else (negatives, letters, "1.5", empty)
 * instead of guessing.
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

export function formatCop(amount: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
    amount,
  );
}

export function formatCompactCop(amount: number): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "$ 0 COP";
  }
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const formatted = Number.isInteger(millions) ? millions.toString() : millions.toFixed(1);
    return `${isNegative ? "-$ " : "$ "}${formatted}M COP`;
  }
  return isNegative ? `-${formatCop(abs)}` : formatCop(abs);
}

/**
 * Calculates a clean rounded scale (nice max, step size, and tick values)
 * for charts, ensuring grid lines and axis labels align on friendly numbers.
 */
export function getNiceScale(maxValue: number, steps = 4): { max: number; step: number; ticks: number[] } {
  if (typeof maxValue !== "number" || Number.isNaN(maxValue) || maxValue <= 0) {
    return { max: 10_000_000, step: 2_500_000, ticks: [10_000_000, 7_500_000, 5_000_000, 2_500_000, 0] };
  }

  const rawStep = maxValue / steps;
  const power = Math.pow(10, Math.floor(Math.log10(rawStep)));

  // Standard friendly tick steps
  const candidateFractions = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10];

  let selectedStep = 10 * power;
  for (const fraction of candidateFractions) {
    const candidateStep = fraction * power;
    if (candidateStep * steps >= maxValue) {
      selectedStep = candidateStep;
      break;
    }
  }

  const max = selectedStep * steps;
  const ticks: number[] = [];
  for (let i = steps; i >= 0; i--) {
    ticks.push(selectedStep * i);
  }

  return { max, step: selectedStep, ticks };
}
