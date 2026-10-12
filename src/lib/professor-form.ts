import type { Professor, ProfessorInput, ProfessorType } from "@/lib/api/professors";
import type { ExternalProfessorData } from "@/lib/mock-data";
import { normalizeText } from "@/lib/fuzzy";

/**
 * Pure helpers of the single "docente / asesor" form (HU 4.2): the product leader types the same fields
 * for both kinds. Kept out of the component so the rules are testable without rendering.
 */

/** Characters typed in the name before the directory is searched. */
export const MIN_SEARCH_CHARS = 2;

export interface ProfessorFormValues {
  type: ProfessorType;
  fullName: string;
  /** STAFF only. */
  faculty: string;
  /** EXTERNAL only. */
  company: string;
  identityDocument: string;
  email: string;
  phone: string;
  profile: string;
}

export interface ProfessorFormErrors {
  fullName?: string;
  email?: string;
}

export const EMPTY_PROFESSOR_FORM: ProfessorFormValues = {
  type: "STAFF",
  fullName: "",
  faculty: "",
  company: "",
  identityDocument: "",
  email: "",
  phone: "",
  profile: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateProfessorForm(values: ProfessorFormValues): ProfessorFormErrors {
  const errors: ProfessorFormErrors = {};
  if (!values.fullName.trim()) errors.fullName = "Ingresa el nombre completo.";
  const email = values.email.trim();
  if (email && !EMAIL_PATTERN.test(email)) errors.email = "Ingresa un correo válido, por ejemplo nombre@dominio.com.";
  return errors;
}

/** Form values of a directory entry: picking a suggestion fills the form with it. */
export function professorToFormValues(professor: Professor): ProfessorFormValues {
  return {
    type: professor.type,
    fullName: professor.fullName,
    faculty: professor.faculty ?? "",
    company: professor.company ?? "",
    identityDocument: professor.identityDocument ?? "",
    email: professor.email ?? "",
    phone: professor.phone ?? "",
    profile: professor.profile ?? "",
  };
}

const orUndefined = (value: string): string | undefined => value.trim() || undefined;

/** What the form hands to the page: the name, the kind and the optional data (trimmed, empty -> undefined). */
export function toProfessorData(values: ProfessorFormValues): ExternalProfessorData {
  return {
    nombre: values.fullName.trim(),
    identificacion: orUndefined(values.identityDocument),
    facultad: values.type === "STAFF" ? orUndefined(values.faculty) : undefined,
    empresaConsultora: values.type === "EXTERNAL" ? orUndefined(values.company) : undefined,
    correo: orUndefined(values.email),
    telefono: orUndefined(values.phone),
    perfil: orUndefined(values.profile),
  };
}

/** Body of `professor` for POST /professors and PATCH /requests/:id/professor. */
export function toProfessorInput(
  name: string,
  kind: "planta" | "externo",
  data: ExternalProfessorData | undefined,
): ProfessorInput {
  const isStaff = kind === "planta";
  const input: ProfessorInput = { fullName: name.trim(), type: isStaff ? "STAFF" : "EXTERNAL" };
  if (isStaff && data?.facultad) input.faculty = data.facultad;
  if (!isStaff && data?.empresaConsultora) input.company = data.empresaConsultora;
  if (data?.identificacion) input.identityDocument = data.identificacion;
  if (data?.correo) input.email = data.correo;
  if (data?.telefono) input.phone = data.telefono;
  if (data?.perfil) input.profile = data.perfil;
  return input;
}

/** Suggestions for a typed name: case and accents are ignored ("munoz" finds "Muñoz"). */
export function matchProfessorsByName(professors: Professor[], term: string): Professor[] {
  const needle = normalizeText(term);
  if (needle.length < MIN_SEARCH_CHARS) return [];
  return professors.filter((professor) => normalizeText(professor.fullName).includes(needle));
}
