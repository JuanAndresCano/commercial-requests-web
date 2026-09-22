import { describe, expect, it } from "vitest";
import { companyTypeLabel, formatNit } from "./company";

describe("formatNit", () => {
  it("adds the hyphen before the check digit of a 10-digit NIT", () => {
    expect(formatNit("8909006089")).toBe("890900608-9");
  });

  it("leaves other lengths untouched", () => {
    expect(formatNit("890900608")).toBe("890900608");
    expect(formatNit("12345")).toBe("12345");
  });
});

describe("companyTypeLabel", () => {
  it("maps every backend type to its Spanish label", () => {
    expect(companyTypeLabel("PUBLICA")).toBe("Pública");
    expect(companyTypeLabel("PRIVADA")).toBe("Privada");
    expect(companyTypeLabel("MIXTA")).toBe("Mixta");
    expect(companyTypeLabel("SIN_ANIMO_LUCRO")).toBe("Sin ánimo de lucro");
  });

  it("returns undefined when the company has no type", () => {
    expect(companyTypeLabel(null)).toBeUndefined();
  });
});
