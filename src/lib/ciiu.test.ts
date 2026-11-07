import { describe, expect, it } from "vitest";
import { CIIU_ERROR, MAX_SECONDARY_CIIU, ciiuListError, normalizeCiiuList, parseCiiu, sanitizeCiiuInput } from "./ciiu";

describe("parseCiiu", () => {
  it("accepts exactly four digits and trims them", () => {
    expect(parseCiiu("8544")).toEqual({ ok: true, code: "8544" });
    expect(parseCiiu("  8544 ")).toEqual({ ok: true, code: "8544" });
  });

  it("treats empty, blanks, null and Pendiente as absence", () => {
    for (const raw of ["", "   ", null, undefined, "Pendiente", " pendiente "]) {
      expect(parseCiiu(raw)).toEqual({ ok: true, code: "" });
    }
  });

  it("rejects anything that is not exactly four digits", () => {
    for (const raw of ["854", "85", "85445", "4845858858558", "85a4", "85 44", "-854"]) {
      expect(parseCiiu(raw)).toEqual({ ok: false, error: CIIU_ERROR });
    }
  });

  it("states the rule in the error", () => {
    expect(CIIU_ERROR).toBe("El CIIU debe tener exactamente 4 dígitos");
  });
});

describe("normalizeCiiuList", () => {
  it("trims, drops blanks and Pendiente, and removes repeats", () => {
    expect(normalizeCiiuList(["8559", " 7020 ", "", "Pendiente", "  ", "6201", "8559"])).toEqual([
      "8559",
      "7020",
      "6201",
    ]);
  });

  it("drops the one that repeats the principal", () => {
    expect(normalizeCiiuList(["8544", "7020"], "8544")).toEqual(["7020"]);
    expect(normalizeCiiuList(["8544", "7020"], " 8544 ")).toEqual(["7020"]);
  });

  it("keeps invalid values so they can be reported instead of vanishing", () => {
    expect(normalizeCiiuList(["85", "7020"])).toEqual(["85", "7020"]);
  });
});

describe("ciiuListError", () => {
  it("is undefined for a valid list or an empty one", () => {
    expect(ciiuListError([])).toBeUndefined();
    expect(ciiuListError(["8559", "7020"])).toBeUndefined();
  });

  it("names the offending value", () => {
    expect(ciiuListError(["8559", "85"])).toBe(`${CIIU_ERROR} («85»).`);
  });

  it("limits the list to twenty codes", () => {
    const many = Array.from({ length: MAX_SECONDARY_CIIU + 1 }, (_, i) => String(1000 + i));
    expect(ciiuListError(many)).toBe("Máximo 20 CIIU secundarios.");
    expect(ciiuListError(many.slice(0, MAX_SECONDARY_CIIU))).toBeUndefined();
  });
});

describe("sanitizeCiiuInput", () => {
  it("keeps only digits, at most four, while typing", () => {
    expect(sanitizeCiiuInput("85a4")).toBe("854");
    expect(sanitizeCiiuInput("Pendiente")).toBe("");
    expect(sanitizeCiiuInput("85445", "8544")).toBe("8544");
  });

  it("does not silently cut a pasted value: it stays long so it is reported", () => {
    expect(sanitizeCiiuInput("4845858858558", "")).toBe("4845858858558");
    expect(sanitizeCiiuInput("48-45", "")).toBe("4845");
  });
});
