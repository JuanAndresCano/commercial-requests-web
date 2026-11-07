/**
 * CIIU (economic activity code): exactly four digits, for the principal code and for every secondary one.
 * Single source of the rule for the wizard, the request detail, the customer editor and the payloads;
 * the backend enforces the same contract. Pure helpers, no UI.
 */
import { pendingValue } from "./customer-contact";

export const CIIU_LENGTH = 4;
export const MAX_SECONDARY_CIIU = 20;
export const CIIU_ERROR = "El CIIU debe tener exactamente 4 dígitos";

const CIIU_RE = /^\d{4}$/;

export type CiiuParseResult = { ok: true; code: string } | { ok: false; error: string };

/**
 * Validates one code. Empty, blank or “Pendiente” means absence (`code: ""`). Anything else must be exactly
 * four digits: a pasted 13-digit value is reported, never cut down to something that looks valid.
 */
export function parseCiiu(raw: string | null | undefined): CiiuParseResult {
  const value = pendingValue(raw);
  if (value === undefined) return { ok: true, code: "" };
  return CIIU_RE.test(value) ? { ok: true, code: value } : { ok: false, error: CIIU_ERROR };
}

/**
 * Secondary codes: trimmed, absent ones (empty / “Pendiente”) dropped, repeats removed, and the one that
 * repeats the principal dropped. Invalid values are kept so they can be reported (see `ciiuListError`).
 */
export function normalizeCiiuList(raw: ReadonlyArray<string | null | undefined>, principal?: string | null): string[] {
  const main = pendingValue(principal);
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const item of raw) {
    const code = pendingValue(item);
    if (code === undefined || code === main || seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }
  return codes;
}

/** First problem of an already normalized secondary list, or undefined when it can be sent. */
export function ciiuListError(codes: readonly string[]): string | undefined {
  const invalid = codes.find((code) => !CIIU_RE.test(code));
  if (invalid !== undefined) return `${CIIU_ERROR} («${invalid}»).`;
  if (codes.length > MAX_SECONDARY_CIIU) return `Máximo ${MAX_SECONDARY_CIIU} CIIU secundarios.`;
  return undefined;
}

/**
 * For the `onChange` of a CIIU input: digits only, at most four. When several characters arrive at once
 * (a paste) the overflow is kept, so the field shows the error instead of silently saving a cut code.
 */
export function sanitizeCiiuInput(raw: string, previous = ""): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= CIIU_LENGTH) return digits;
  const added = digits.length - previous.replace(/\D/g, "").length;
  return added > 1 ? digits : digits.slice(0, CIIU_LENGTH);
}
