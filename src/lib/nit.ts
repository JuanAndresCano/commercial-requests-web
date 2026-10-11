/**
 * Colombian NIT: nine digits of number plus one check digit (DV) computed with the DIAN algorithm.
 * Pure helpers, no UI: the wizard stores the NIT as ten digits only and shows it as `890.903.938-8`.
 */

/** DIAN weights, applied from the rightmost digit of the number to the left. */
const DIAN_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/** Dots, hyphens and spaces are formatting; anything else is kept so it can be reported as invalid. */
export function normalizeNit(raw: string | null | undefined): string {
  return (raw ?? "").replace(/[.\-\s]/g, "");
}

/** Check digit (DV) of the base number (up to 15 digits): remainder 0 or 1 stays, otherwise 11 - remainder. */
export function calculateCheckDigit(base: string): number {
  const digits = [...base].reverse();
  const sum = digits.reduce((total, digit, index) => total + Number(digit) * DIAN_WEIGHTS[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? remainder : 11 - remainder;
}

export type NitParseResult = { ok: true; nit: string } | { ok: false; error: string };

/**
 * Validates what the KAM typed. An empty NIT is fine (it is optional). Nine digits get their check digit
 * appended; ten digits must carry the right one. The result is the ten digits, nothing else.
 */
export function parseNit(raw: string | null | undefined): NitParseResult {
  const compact = normalizeNit(raw);
  if (compact === "") return { ok: true, nit: "" };
  if (!/^\d+$/.test(compact)) {
    return { ok: false, error: "El NIT solo puede contener números (se aceptan puntos, guiones y espacios)." };
  }
  if (compact.length < 9) {
    return { ok: false, error: "El NIT debe tener 9 dígitos, más el dígito de verificación (opcional)." };
  }
  if (compact.length > 10) {
    return { ok: false, error: "El NIT no puede tener más de 10 dígitos (9 del número y 1 de verificación)." };
  }

  const base = compact.slice(0, 9);
  const expected = calculateCheckDigit(base);
  if (compact.length === 9) return { ok: true, nit: `${base}${expected}` };
  if (Number(compact[9]) !== expected) {
    return { ok: false, error: `El dígito de verificación no coincide (debería ser ${expected})` };
  }
  return { ok: true, nit: compact };
}

/** `8909039388` -> `890.903.938-8`. Anything that is not ten digits is returned as it came. */
export function formatNit(raw: string): string {
  const compact = normalizeNit(raw);
  if (!/^\d{10}$/.test(compact)) return raw;
  return `${compact.slice(0, 3)}.${compact.slice(3, 6)}.${compact.slice(6, 9)}-${compact[9]}`;
}

/** What to show for a NIT the KAM typed: formatted if it is valid, otherwise exactly as typed. */
export function displayNit(raw: string): string {
  const parsed = parseNit(raw);
  return parsed.ok && parsed.nit ? formatNit(parsed.nit) : raw;
}

/**
 * The form two NITs are compared in: a 9-digit NIT gets its check digit, so it equals the same company's
 * 10-digit NIT. Anything else is reduced to its digits (it can only equal itself).
 */
export function canonicalNit(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length === 9 ? `${digits}${calculateCheckDigit(digits)}` : digits;
}
