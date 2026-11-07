import { ApiError } from "@/lib/api/client";

/** Missing customer data stays missing; the UI may display or accept “Pendiente”. */
export function pendingValue(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return !trimmed || trimmed.toLocaleLowerCase("es") === "pendiente" ? undefined : trimmed;
}

export interface CustomerChannels {
  companyPhone?: string | null;
  companyEmail?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactSecondaryPhone?: string | null;
  contactAlternativeEmail?: string | null;
}

const PHONE_FIELDS = ["companyPhone", "contactPhone", "contactSecondaryPhone"] as const;
const EMAIL_FIELDS = ["companyEmail", "contactEmail", "contactAlternativeEmail"] as const;
const PRIMARY_FIELDS = ["companyPhone", "companyEmail", "contactPhone", "contactEmail"] as const;
/** Colombian phone: exactly 10 digits, with an optional +57 / 57 prefix. Same contract as the backend. */
const PHONE_PATTERN = /^(?:\+?57)?\d{10}$/;
export const PHONE_ERROR = "El teléfono debe tener 10 dígitos (puede iniciar con +57)";
export const CONTACTABILITY_ERROR = "Deja al menos un teléfono o correo válido";
export const NIT_IN_USE_ERROR = "Ya existe otra empresa registrada con ese NIT";

/** The one phone rule of the client: separators (spaces, hyphens, dots, parentheses) are ignored, then it must match. */
export function isValidPhone(raw: string | null | undefined): boolean {
  const value = pendingValue(raw);
  return value !== undefined && PHONE_PATTERN.test(value.replace(/[\s\-.()]/g, ""));
}

/** Error for one phone field, or undefined when it is absent (blank / Pendiente) or well formed. */
export function phoneError(raw: string | null | undefined): string | undefined {
  return pendingValue(raw) && !isValidPhone(raw) ? PHONE_ERROR : undefined;
}

/** The trimmed phone when it is valid; undefined when absent or invalid, so a malformed one is never sent. */
export function phoneValue(raw: string | null | undefined): string | undefined {
  return isValidPhone(raw) ? pendingValue(raw) : undefined;
}

/** Spanish text for the contact/phone 400s and the duplicated-NIT 409 the server may still return; undefined when the error is none of them. */
export function customerContactServerMessage(error: unknown): string | undefined {
  if (error instanceof ApiError && error.status === 409 && /\bNIT\b/i.test(error.message)) return NIT_IN_USE_ERROR;
  if (!(error instanceof ApiError) || error.status !== 400) return undefined;
  if (/at least one valid customer phone or email/i.test(error.message)) return CONTACTABILITY_ERROR;
  if (/phone|tel[eé]fono/i.test(error.message)) return PHONE_ERROR;
  return undefined;
}

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** Both provided channels must be valid, and at least one principal channel must exist. */
export function customerContactErrors(channels: CustomerChannels): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of PHONE_FIELDS) {
    const error = phoneError(channels[key]);
    if (error) errors[key] = error;
  }
  for (const key of EMAIL_FIELDS) {
    const value = pendingValue(channels[key]);
    if (value && !validEmail(value)) {
      errors[key] = "Ingresa un correo válido o marca el dato como Pendiente.";
    }
  }
  if (!PRIMARY_FIELDS.some((key) => pendingValue(channels[key]) && !errors[key])) {
    errors.contactability = CONTACTABILITY_ERROR;
  }
  return errors;
}

/** True when at least one principal channel is present and well formed (pending/blank/malformed do not count). */
export function hasValidContactChannel(channels: CustomerChannels): boolean {
  const errors = customerContactErrors(channels);
  return PRIMARY_FIELDS.some((key) => pendingValue(channels[key]) && !errors[key]);
}
