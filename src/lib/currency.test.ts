import { describe, it, expect } from "vitest";
import {
  calculateProCulturaReference,
  formatCopPreview,
  isLikelyFraction,
  parseCopInput,
  parsePercentInput,
} from "@/lib/currency";
import { calculateCosting, formatCop } from "@/lib/mock-data";

describe("parseCopInput", () => {
  it.each([
    ["$32.000.000", 32_000_000],
    ["32.000.000", 32_000_000],
    ["32000000", 32_000_000],
    ["$ 32.000.000", 32_000_000],
    ["  $ 32.000.000  ", 32_000_000],
    ["$ 32.000.000", 32_000_000],
    ["32 000 000", 32_000_000],
    ["1.000", 1_000],
    ["999", 999],
    ["0", 0],
    ["007", 7],
  ])("parses %j as %d", (raw, expected) => {
    expect(parseCopInput(raw)).toBe(expected);
  });

  it("uses comma as decimal separator", () => {
    expect(parseCopInput("32.000.000,50")).toBe(32_000_000.5);
    expect(parseCopInput("$1.250,5")).toBe(1_250.5);
    expect(parseCopInput("0,25")).toBe(0.25);
    expect(parseCopInput("100,00")).toBe(100);
  });

  it("ignores a trailing percent sign and returns the literal number", () => {
    expect(parseCopInput("30%")).toBe(30);
    expect(parseCopInput("30 %")).toBe(30);
    expect(parseCopInput("30")).toBe(30);
  });

  it("accepts any number of decimals and returns them unrounded", () => {
    expect(parseCopInput("32.000.000,456")).toBe(32_000_000.456);
    expect(parseCopInput("1.234,5678")).toBe(1_234.5678);
    expect(parseCopInput("1,234")).toBe(1.234);
    expect(parseCopInput("1.000,999")).toBe(1_000.999);
    expect(parseCopInput("$0,005")).toBe(0.005);
  });

  it("returns null when the dot is not a valid thousands separator", () => {
    expect(parseCopInput("1.5")).toBeNull();
    expect(parseCopInput("0.3")).toBeNull();
    expect(parseCopInput("1.00")).toBeNull();
    expect(parseCopInput("1..000")).toBeNull();
    expect(parseCopInput("32.00.000")).toBeNull();
    expect(parseCopInput("1.000.")).toBeNull();
    expect(parseCopInput(".500")).toBeNull();
  });

  it("returns null for malformed decimal commas", () => {
    expect(parseCopInput("1,")).toBeNull();
    expect(parseCopInput(",50")).toBeNull();
    expect(parseCopInput("1,5,0")).toBeNull();
    expect(parseCopInput("1,000.50")).toBeNull();
  });

  it("returns null for negatives", () => {
    expect(parseCopInput("-5")).toBeNull();
    expect(parseCopInput("-$5")).toBeNull();
    expect(parseCopInput("$-5.000")).toBeNull();
    expect(parseCopInput("(5.000)")).toBeNull();
  });

  it("returns null for empty or whitespace-only input", () => {
    expect(parseCopInput("")).toBeNull();
    expect(parseCopInput("   ")).toBeNull();
    expect(parseCopInput("$")).toBeNull();
    expect(parseCopInput("%")).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(parseCopInput("abc")).toBeNull();
    expect(parseCopInput("12abc")).toBeNull();
    expect(parseCopInput("$$5")).toBeNull();
    expect(parseCopInput("5$")).toBeNull();
    expect(parseCopInput("1e6")).toBeNull();
    expect(parseCopInput("COP 5.000")).toBeNull();
    expect(parseCopInput("NaN")).toBeNull();
  });

  it("returns null above Number.MAX_SAFE_INTEGER", () => {
    expect(parseCopInput("99999999999999999999")).toBeNull();
  });

  it("round-trips the output of formatCop", () => {
    for (const amount of [0, 5_000, 32_000_000, 1_234_567_890]) {
      expect(parseCopInput(formatCop(amount))).toBe(amount);
    }
  });
});

describe("parsePercentInput", () => {
  it.each([
    ["30", 30],
    ["30%", 30],
    ["30 %", 30],
    ["  30%  ", 30],
    ["0", 0],
    ["100", 100],
    ["12.5", 12.5],
    ["12,5", 12.5],
    ["12,5%", 12.5],
    ["33.333", 33.333],
  ])("parses %j as %d", (raw, expected) => {
    expect(parsePercentInput(raw)).toBe(expected);
  });

  it("translates 0.3 literally and never assumes it means 30%", () => {
    expect(parsePercentInput("0.3")).toBe(0.3);
    expect(parsePercentInput("0,3")).toBe(0.3);
    expect(parsePercentInput("0.3%")).toBe(0.3);
    expect(parsePercentInput("30")).toBe(30);
    expect(parsePercentInput("0.3")).not.toBe(parsePercentInput("30"));
  });

  it("returns null for negatives", () => {
    expect(parsePercentInput("-5")).toBeNull();
    expect(parsePercentInput("-0.3%")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parsePercentInput("")).toBeNull();
    expect(parsePercentInput("   ")).toBeNull();
    expect(parsePercentInput("%")).toBeNull();
  });

  it("returns null for non-numeric or malformed input", () => {
    expect(parsePercentInput("abc")).toBeNull();
    expect(parsePercentInput("30 por ciento")).toBeNull();
    expect(parsePercentInput("$30")).toBeNull();
    expect(parsePercentInput("%30")).toBeNull();
    expect(parsePercentInput("30%%")).toBeNull();
    expect(parsePercentInput("1.2.3")).toBeNull();
    expect(parsePercentInput("1,2,3")).toBeNull();
    expect(parsePercentInput("12.")).toBeNull();
    expect(parsePercentInput(".5")).toBeNull();
    expect(parsePercentInput("1e2")).toBeNull();
  });
});

describe("isLikelyFraction", () => {
  it("is true only strictly between 0 and 1", () => {
    expect(isLikelyFraction(0.3)).toBe(true);
    expect(isLikelyFraction(0.0001)).toBe(true);
    expect(isLikelyFraction(0.9999)).toBe(true);
  });

  it("is false at the boundaries and outside the range", () => {
    expect(isLikelyFraction(0)).toBe(false);
    expect(isLikelyFraction(1)).toBe(false);
    expect(isLikelyFraction(30)).toBe(false);
    expect(isLikelyFraction(-0.3)).toBe(false);
  });

  it("is false for non-finite numbers", () => {
    expect(isLikelyFraction(NaN)).toBe(false);
    expect(isLikelyFraction(Infinity)).toBe(false);
    expect(isLikelyFraction(-Infinity)).toBe(false);
  });

  it("flags what parsePercentInput returns for '0.3' but not for '30'", () => {
    expect(isLikelyFraction(parsePercentInput("0.3") as number)).toBe(true);
    expect(isLikelyFraction(parsePercentInput("30") as number)).toBe(false);
  });
});

describe("formatCopPreview", () => {
  it.each([0, 5_000, 32_000_000, 1_234_567.89, -1_500])("matches formatCop for %d", (value) => {
    expect(formatCopPreview(value)).toBe(formatCop(value));
  });

  it("shows a rounded value for an unrounded parsed amount, without altering the parsed number", () => {
    const parsed = parseCopInput("32.000.000,456") as number;
    expect(parsed).toBe(32_000_000.456);
    expect(formatCopPreview(parsed)).toBe(formatCopPreview(32_000_000));
    expect(formatCopPreview(parseCopInput("1.234,5678") as number)).toBe(formatCopPreview(1_235));
  });
});

describe("calculateProCulturaReference", () => {
  it("applies 1.5% for Capacitación (same case as mock-data.test.ts: 1.000.000 -> 15.000)", () => {
    expect(calculateProCulturaReference(1_000_000, "Capacitación")).toEqual({ applies: true, amount: 15_000 });
  });

  it("rounds to the nearest peso (same case as mock-data.test.ts: 333.333 -> 5.000)", () => {
    expect(calculateProCulturaReference(333_333, "Capacitación")).toEqual({ applies: true, amount: 5_000 });
  });

  it("applies but yields 0 for a total of 0 (same case as mock-data.test.ts)", () => {
    expect(calculateProCulturaReference(0, "Capacitación")).toEqual({ applies: true, amount: 0 });
  });

  it.each(["Consultoría", "Mentoría", "Investigación", "Proyectos Especiales (Eventos)", "Otro"])(
    "does not apply for %s",
    (category) => {
      expect(calculateProCulturaReference(1_000_000, category)).toEqual({ applies: false, amount: 0 });
    },
  );

  it("requires the exact category string", () => {
    for (const category of ["capacitación", "Capacitacion", "CAPACITACION", " Capacitación", "", "Capacitación "]) {
      expect(calculateProCulturaReference(1_000_000, category)).toEqual({ applies: false, amount: 0 });
    }
  });

  it("gives the same amount as calculateCosting for every case", () => {
    const cases: [string, number][] = [
      ["Capacitación", 1_000_000],
      ["Capacitación", 333_333],
      ["Capacitación", 0],
      ["Capacitación", 32_000_000],
      ["Consultoría", 1_000_000],
    ];
    for (const [type, total] of cases) {
      const costing = calculateCosting(type as Parameters<typeof calculateCosting>[0], total, 30);
      expect(calculateProCulturaReference(total, type).amount).toBe(costing.proCulturaTaxAmount);
    }
  });
});
