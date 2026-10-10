import { describe, expect, it } from "vitest";
import type { Professor } from "@/lib/api/professors";
import {
  EMPTY_PROFESSOR_FORM,
  matchProfessorsByName,
  professorToFormValues,
  toProfessorData,
  toProfessorInput,
  validateProfessorForm,
} from "./professor-form";

const professor = (overrides: Partial<Professor>): Professor => ({
  id: "p1",
  fullName: "Nohra Villegas",
  type: "STAFF",
  faculty: null,
  company: null,
  identityDocument: null,
  email: null,
  phone: null,
  profile: null,
  isActive: true,
  ...overrides,
});

describe("validateProfessorForm", () => {
  it("only requires the name", () => {
    expect(validateProfessorForm(EMPTY_PROFESSOR_FORM)).toEqual({ fullName: "Ingresa el nombre completo." });
    expect(validateProfessorForm({ ...EMPTY_PROFESSOR_FORM, fullName: "  Ana Ruiz " })).toEqual({});
  });

  it("rejects a malformed e-mail but accepts an empty one", () => {
    const base = { ...EMPTY_PROFESSOR_FORM, fullName: "Ana Ruiz" };
    expect(validateProfessorForm({ ...base, email: "ana@" }).email).toBeDefined();
    expect(validateProfessorForm({ ...base, email: "ana ruiz@x.com" }).email).toBeDefined();
    expect(validateProfessorForm({ ...base, email: "ana@x.com" })).toEqual({});
    expect(validateProfessorForm({ ...base, email: "  " })).toEqual({});
  });
});

describe("toProfessorData / toProfessorInput", () => {
  it("keeps only the faculty for a planta professor and only the company for an external one", () => {
    const typed = { ...EMPTY_PROFESSOR_FORM, fullName: " Ana Ruiz ", faculty: "Derecho", company: "Mora SAS" };
    expect(toProfessorData({ ...typed, type: "STAFF" })).toMatchObject({
      nombre: "Ana Ruiz",
      facultad: "Derecho",
      empresaConsultora: undefined,
    });
    expect(toProfessorData({ ...typed, type: "EXTERNAL" })).toMatchObject({
      facultad: undefined,
      empresaConsultora: "Mora SAS",
    });
  });

  it("builds the request body without empty fields", () => {
    const data = toProfessorData({
      ...EMPTY_PROFESSOR_FORM,
      type: "EXTERNAL",
      fullName: "Luis Mora",
      company: "Mora SAS",
      email: " luis@mora.co ",
    });
    expect(toProfessorInput(data.nombre, "externo", data)).toEqual({
      fullName: "Luis Mora",
      type: "EXTERNAL",
      company: "Mora SAS",
      email: "luis@mora.co",
    });
    expect(toProfessorInput("Solo Nombre", "planta", undefined)).toEqual({ fullName: "Solo Nombre", type: "STAFF" });
  });
});

describe("professorToFormValues", () => {
  it("turns null directory fields into empty strings", () => {
    expect(professorToFormValues(professor({ faculty: "Ingeniería" }))).toEqual({
      ...EMPTY_PROFESSOR_FORM,
      fullName: "Nohra Villegas",
      faculty: "Ingeniería",
    });
  });
});

describe("matchProfessorsByName", () => {
  const directory = [professor({ fullName: "Andrés Muñoz" }), professor({ id: "p2", fullName: "Lina Ayala" })];

  it("ignores case and accents in both directions", () => {
    expect(matchProfessorsByName(directory, "munoz")).toHaveLength(1);
    expect(matchProfessorsByName(directory, "ANDRÉS")).toHaveLength(1);
    expect(matchProfessorsByName(directory, "andres muñ")).toHaveLength(1);
  });

  it("does not suggest anything before two characters", () => {
    expect(matchProfessorsByName(directory, "a")).toEqual([]);
    expect(matchProfessorsByName(directory, " l ")).toEqual([]);
  });

  it("returns nothing when the name matches no entry", () => {
    expect(matchProfessorsByName(directory, "zzz")).toEqual([]);
  });
});
