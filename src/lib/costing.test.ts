import { describe, expect, it } from "vitest";
import { calculateCosting, PRO_CULTURA_TAX_PERCENT } from "./costing";
import type { RequestType } from "./mock-data";

/** Verbatim copy of the prototype formula before extraction — parity reference. */
function legacyCalculateCosting(
  type: RequestType,
  baseCostCop: number,
  expectedMarginPercent: number,
  customOffered?: number,
) {
  const isCapacitacion = type === "Capacitación";
  const proCulturaTaxPercent = isCapacitacion ? 1.5 : 0;
  const marginAmount = baseCostCop * (expectedMarginPercent / 100);
  const proCulturaTaxAmount = isCapacitacion ? Math.round(baseCostCop * 0.015) : 0;
  const suggestedTotalCop = Math.round(baseCostCop + marginAmount + proCulturaTaxAmount);
  const totalOfferedCop = customOffered !== undefined && customOffered !== null ? customOffered : suggestedTotalCop;
  return { proCulturaTaxPercent, proCulturaTaxAmount, suggestedTotalCop, totalOfferedCop };
}

const TYPES: RequestType[] = [
  "Capacitación",
  "Consultoría",
  "Mentoría",
  "Investigación",
  "Proyectos Especiales (Eventos)",
  "Otro",
];

describe("calculateCosting", () => {
  it("applies the Pro-Cultura stamp only to Capacitación", () => {
    const result = calculateCosting("Capacitación", 10_000_000, 30);

    expect(result.proCulturaTaxPercent).toBe(PRO_CULTURA_TAX_PERCENT);
    expect(result.proCulturaTaxAmount).toBe(150_000);
    expect(result.suggestedTotalCop).toBe(13_150_000);
    expect(result.totalOfferedCop).toBe(13_150_000);
  });

  it.each(TYPES.filter((t) => t !== "Capacitación"))("charges no stamp for %s", (type) => {
    const result = calculateCosting(type, 10_000_000, 30);

    expect(result.proCulturaTaxPercent).toBe(0);
    expect(result.proCulturaTaxAmount).toBe(0);
    expect(result.suggestedTotalCop).toBe(13_000_000);
  });

  it("rounds the stamp and the suggested total to whole pesos", () => {
    const result = calculateCosting("Capacitación", 1_234_567, 31.5);

    expect(result.proCulturaTaxAmount).toBe(18_519);
    expect(result.suggestedTotalCop).toBe(1_641_975);
  });

  it("lets a negotiated value override the suggested total", () => {
    const result = calculateCosting("Consultoría", 9_500_000, 31.5, 12_500_000);

    expect(result.suggestedTotalCop).toBe(12_492_500);
    expect(result.totalOfferedCop).toBe(12_500_000);
  });

  it("keeps an explicit offered value of 0 instead of falling back", () => {
    expect(calculateCosting("Mentoría", 5_000_000, 30, 0).totalOfferedCop).toBe(0);
  });

  it("returns an empty costing for a request that was never costed", () => {
    const result = calculateCosting("Capacitación", 0, 30);

    expect(result.suggestedTotalCop).toBe(0);
    expect(result.totalOfferedCop).toBe(0);
  });

  it("carries advisor and negotiation metadata through unchanged", () => {
    const result = calculateCosting("Otro", 1, 0, undefined, true, "Firma X", "Descuento por volumen");

    expect(result).toMatchObject({
      requiresExternalAdvisor: true,
      externalAdvisorDetails: "Firma X",
      negotiationNotes: "Descuento por volumen",
    });
  });

  it("matches the prototype formula for every type and a grid of inputs", () => {
    const bases = [0, 1, 999, 1_234_567, 14_000_000, 87_654_321];
    const margins = [0, 25, 30, 31.5, 35, 40, 100];
    const offers = [undefined, 0, 12_500_000];

    for (const type of TYPES)
      for (const base of bases)
        for (const margin of margins)
          for (const offer of offers) {
            const { proCulturaTaxPercent, proCulturaTaxAmount, suggestedTotalCop, totalOfferedCop } = calculateCosting(
              type,
              base,
              margin,
              offer,
            );

            expect({ proCulturaTaxPercent, proCulturaTaxAmount, suggestedTotalCop, totalOfferedCop }).toEqual(
              legacyCalculateCosting(type, base, margin, offer),
            );
          }
  });
});
