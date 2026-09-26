import { describe, expect, it } from "vitest";
import { fuzzyScore, fuzzyMatch, fuzzyFilter, normalizeText, levenshtein } from "./fuzzy";

describe("fuzzy utility", () => {
  it("normalizes accents and whitespace", () => {
    expect(normalizeText("  Tecnoquímicas S.A.  ")).toBe("tecnoquimicas s.a.");
  });

  it("calculates levenshtein distance correctly", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("banco", "banco")).toBe(0);
    expect(levenshtein("bancolobia", "bancolombia")).toBe(1);
  });

  it("matches exact and substring patterns with high scores", () => {
    expect(fuzzyScore("bancolombia", "Bancolombia S.A.")).toBeGreaterThan(0.9);
    expect(fuzzyMatch("banco", "Bancolombia")).toBe(true);
  });

  it("matches with typos in company name", () => {
    // "Bancolobia" should match "Bancolombia"
    expect(fuzzyMatch("bancolobia", "Bancolombia")).toBe(true);
    // "Manuelta" should match "Manuelita"
    expect(fuzzyMatch("manuelta", "Manuelita S.A.")).toBe(true);
  });

  it("rejects completely unrelated words", () => {
    expect(fuzzyMatch("aeropuerto", "Nutresa")).toBe(false);
  });

  it("fuzzyFilter sorts by relevance", () => {
    const companies = [{ name: "Sura Seguros" }, { name: "Bancolombia Corporativo" }, { name: "Banco de Occidente" }];

    const results = fuzzyFilter(companies, "bancolobia", (c) => [c.name]);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toBe("Bancolombia Corporativo");
  });
});
