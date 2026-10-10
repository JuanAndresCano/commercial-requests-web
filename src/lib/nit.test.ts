import { describe, expect, it } from "vitest";
import { calculateCheckDigit, canonicalNit, displayNit, formatNit, normalizeNit, parseNit } from "./nit";

describe("normalizeNit", () => {
  it("drops dots, hyphens and spaces and keeps everything else", () => {
    expect(normalizeNit(" 890.903.938-8 ")).toBe("8909039388");
    expect(normalizeNit("890 903 938 - 8")).toBe("8909039388");
    expect(normalizeNit("89A")).toBe("89A");
    expect(normalizeNit(undefined)).toBe("");
    expect(normalizeNit(null)).toBe("");
  });
});

describe("calculateCheckDigit (DIAN algorithm)", () => {
  it("matches real, well-known NITs", () => {
    expect(calculateCheckDigit("890903938")).toBe(8);
    expect(calculateCheckDigit("890900608")).toBe(9);
    expect(calculateCheckDigit("800197268")).toBe(4);
    expect(calculateCheckDigit("860034313")).toBe(7);
  });

  it("maps a remainder of 0 to 0 and a remainder of 1 to 1, any other to 11 - remainder", () => {
    // The weighted sum of 890303893 is a multiple of 11 -> remainder 0 -> digit 0
    expect(calculateCheckDigit("890303893")).toBe(0);
    // Remainder 1: sum 12 -> only the last three digits count -> "000000004" weighs 4*3 = 12
    expect(calculateCheckDigit("000000004")).toBe(1);
    // Remainder 0: sum 0
    expect(calculateCheckDigit("000000000")).toBe(0);
  });
});

describe("parseNit", () => {
  it("treats an empty NIT as 'not provided' (it is optional)", () => {
    expect(parseNit("")).toEqual({ ok: true, nit: "" });
    expect(parseNit("  ")).toEqual({ ok: true, nit: "" });
    expect(parseNit(undefined)).toEqual({ ok: true, nit: "" });
  });

  it("computes the check digit for a 9-digit NIT and returns 10 digits only", () => {
    expect(parseNit("890903938")).toEqual({ ok: true, nit: "8909039388" });
    expect(parseNit("890.903.938")).toEqual({ ok: true, nit: "8909039388" });
  });

  it("accepts a 10-digit NIT whose check digit matches, in any formatting", () => {
    expect(parseNit("890903938-8")).toEqual({ ok: true, nit: "8909039388" });
    expect(parseNit("890.903.938-8")).toEqual({ ok: true, nit: "8909039388" });
    expect(parseNit("8909039388")).toEqual({ ok: true, nit: "8909039388" });
  });

  it("rejects a 10-digit NIT whose check digit does not match and says which one it should be", () => {
    expect(parseNit("890903938-5")).toEqual({
      ok: false,
      error: "El dígito de verificación no coincide (debería ser 8)",
    });
  });

  it("rejects fewer than 9 digits", () => {
    const result = parseNit("89090393");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/9 dígitos/);
  });

  it("rejects more than 10 digits", () => {
    const result = parseNit("89090393885");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/10 dígitos/);
  });

  it("rejects non-numeric characters", () => {
    for (const raw of ["89090393A", "NIT 890903938", "890,903,938"]) {
      const result = parseNit(raw);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/solo puede contener números/);
    }
  });
});

describe("formatNit", () => {
  it("shows a 10-digit NIT as 890.903.938-8", () => {
    expect(formatNit("8909039388")).toBe("890.903.938-8");
    expect(formatNit("890903938-8")).toBe("890.903.938-8");
  });

  it("leaves anything that is not a 10-digit NIT as it was typed", () => {
    expect(formatNit("890900608")).toBe("890900608");
    expect(formatNit("12345")).toBe("12345");
    expect(formatNit("")).toBe("");
  });
});

describe("canonicalNit", () => {
  it("makes a 9-digit NIT and its 10-digit form the same value", () => {
    expect(canonicalNit("890903938")).toBe("8909039388");
    expect(canonicalNit("890.903.938-8")).toBe("8909039388");
    expect(canonicalNit("8909039388")).toBe("8909039388");
  });

  it("keeps only the digits of anything else, so partial NITs never equal a real one", () => {
    expect(canonicalNit("89090393")).toBe("89090393");
    expect(canonicalNit(undefined)).toBe("");
    expect(canonicalNit("-")).toBe("");
  });
});

describe("displayNit", () => {
  it("shows a valid NIT formatted, adding the check digit to a 9-digit one", () => {
    expect(displayNit("890903938")).toBe("890.903.938-8");
    expect(displayNit("8909039388")).toBe("890.903.938-8");
  });

  it("shows an invalid NIT exactly as typed", () => {
    expect(displayNit("890903938-5")).toBe("890903938-5");
    expect(displayNit("abc")).toBe("abc");
  });
});
