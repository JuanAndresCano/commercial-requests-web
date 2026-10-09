import { describe, expect, it } from "vitest";
import { cateringToPayload } from "./catering";

describe("cateringToPayload", () => {
  it("an empty answer means no catering and no notes", () => {
    expect(cateringToPayload("")).toEqual({ requiresCatering: false, cateringNotes: null });
    expect(cateringToPayload("   ")).toEqual({ requiresCatering: false, cateringNotes: null });
    expect(cateringToPayload(undefined)).toEqual({ requiresCatering: false, cateringNotes: null });
  });

  it("'No' means no catering, however it is typed", () => {
    for (const text of ["No", "no", " NO ", "No.", "no!"]) {
      expect(cateringToPayload(text)).toEqual({ requiresCatering: false, cateringNotes: null });
    }
  });

  it("'Sin alimentación', 'No aplica', 'Ninguna' and 'N/A' also mean no catering, ignoring case, accents and closing punctuation", () => {
    for (const text of [
      "Sin alimentación",
      "sin alimentacion",
      "SIN ALIMENTACIÓN.",
      "  Sin   alimentación  ",
      "No aplica",
      "no aplica.",
      "NO APLICA!",
      "Ninguna",
      "ninguna.",
      "Ninguno",
      "N/A",
      "n/a",
      "N/A.",
      "n.a.",
      "NA",
    ]) {
      expect(cateringToPayload(text), text).toEqual({ requiresCatering: false, cateringNotes: null });
    }
  });

  it("a phrase that only contains those words is still catering with that text", () => {
    for (const text of [
      "Sin alimentación para el equipo, pero sí café",
      "Ninguna restricción, almuerzo para 20",
      "No aplica para el día 1; refrigerio el día 2",
    ]) {
      expect(cateringToPayload(text)).toEqual({ requiresCatering: true, cateringNotes: text });
    }
  });

  it("'Sí - …' (what the detail shows) keeps only the detail as notes", () => {
    expect(cateringToPayload("Sí - Refrigerio am y pm")).toEqual({
      requiresCatering: true,
      cateringNotes: "Refrigerio am y pm",
    });
    expect(cateringToPayload("si: almuerzo")).toEqual({ requiresCatering: true, cateringNotes: "almuerzo" });
  });

  it("a bare 'Sí' means catering with no notes", () => {
    expect(cateringToPayload("Sí")).toEqual({ requiresCatering: true, cateringNotes: null });
    expect(cateringToPayload("si.")).toEqual({ requiresCatering: true, cateringNotes: null });
  });

  it("any other text is catering with that text as notes", () => {
    expect(cateringToPayload("Refrigerio am y pm para 25 personas")).toEqual({
      requiresCatering: true,
      cateringNotes: "Refrigerio am y pm para 25 personas",
    });
  });

  it("does not mistake words that merely start with 'no' or 'si' for the short answers", () => {
    expect(cateringToPayload("Nos encargamos nosotros")).toEqual({
      requiresCatering: true,
      cateringNotes: "Nos encargamos nosotros",
    });
    expect(cateringToPayload("Simplemente un café")).toEqual({
      requiresCatering: true,
      cateringNotes: "Simplemente un café",
    });
  });
});
