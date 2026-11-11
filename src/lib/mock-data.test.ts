import { describe, it, expect } from "vitest";
import { calculateCosting, MOCK_REQUESTS, getNiceScale } from "@/lib/mock-data";

describe("calculateCosting", () => {
  it("calcula el impuesto Pro-Cultura (1.5%) cuando el tipo es Capacitación", () => {
    const costing = calculateCosting("Capacitación", 1_000_000, 30, 100_000);

    expect(costing.proCulturaTaxPercent).toBe(1.5);
    expect(costing.proCulturaTaxAmount).toBe(15_000);
  });

  it("no cobra Pro-Cultura para tipos distintos de Capacitación", () => {
    const costing = calculateCosting("Consultoría", 1_000_000, 30, 100_000);

    expect(costing.proCulturaTaxPercent).toBe(0);
    expect(costing.proCulturaTaxAmount).toBe(0);
  });

  it("redondea el monto de Pro-Cultura al peso más cercano", () => {
    // 333_333 * 0.015 = 4999.995 -> debe redondear a 5000
    const costing = calculateCosting("Capacitación", 333_333, 30, 0);

    expect(costing.proCulturaTaxAmount).toBe(5_000);
  });

  it("nunca suma ni resta Pro-Cultura de totalOfferedCop", () => {
    const costing = calculateCosting("Capacitación", 1_000_000, 30, 0);

    expect(costing.totalOfferedCop).toBe(1_000_000);
  });

  it("usa 0 como default de marginAmountCop y deja readyForKam en false", () => {
    const costing = calculateCosting("Consultoría", 500_000, 20);

    expect(costing.marginAmountCop).toBe(0);
    expect(costing.readyForKam).toBe(false);
  });

  it("propaga negotiationNotes y readyForKam cuando se pasan explícitamente", () => {
    const costing = calculateCosting("Consultoría", 500_000, 20, 0, "nota del líder", true);

    expect(costing.negotiationNotes).toBe("nota del líder");
    expect(costing.readyForKam).toBe(true);
  });

  it("maneja totalOfferedCop en 0 sin lanzar error", () => {
    const costing = calculateCosting("Capacitación", 0, 0, 0);

    expect(costing.totalOfferedCop).toBe(0);
    expect(costing.proCulturaTaxAmount).toBe(0);
  });
});

describe("REQ-2026-0135 (backfill de negociación pre-historial, docs/04)", () => {
  it("conserva la ronda 1 backfillada consistente con clientObservations", () => {
    const req = MOCK_REQUESTS.find((r) => r.id === "REQ-2026-0135");

    expect(req?.negotiationRounds).toHaveLength(1);
    expect(req?.negotiationRounds?.[0]).toMatchObject({
      clientResponse: "rechazada",
      clientObservation: req?.clientObservations,
    });
  });
});

describe("getNiceScale", () => {
  it("generates a clean rounded scale with 5 ticks for 271.5M", () => {
    const scale = getNiceScale(271_500_000, 4);
    expect(scale.max).toBe(300_000_000);
    expect(scale.step).toBe(75_000_000);
    expect(scale.ticks).toEqual([300_000_000, 225_000_000, 150_000_000, 75_000_000, 0]);
  });

  it("handles empty or zero values gracefully with fallback", () => {
    const scale = getNiceScale(0, 4);
    expect(scale.max).toBe(10_000_000);
    expect(scale.ticks).toHaveLength(5);
    expect(scale.ticks[4]).toBe(0);
  });
});
