import { describe, expect, it } from "vitest";
import { companyTypeLabel } from "./company";

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
