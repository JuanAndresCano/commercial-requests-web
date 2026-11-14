import { describe, expect, it } from "vitest";
import {
  ADJUSTMENT_FILTER_LABELS,
  adjustmentBadgeLabel,
  adjustmentBadgeTitle,
  countPendingAdjustments,
  getAdjustmentCount,
  getAdjustmentState,
  hasPendingAdjustment,
  isAdjustmentFilter,
  matchesAdjustmentFilter,
} from "./adjustments";

type Source = Parameters<typeof getAdjustmentState>[0];

const base: Source = { status: "entregada" };
const rejectedRound = { clientResponse: "rechazada" as const };
const pendingRound = { clientResponse: "pendiente" as const };

describe("adjustment state with the server fields", () => {
  it("is pending while the last return has not been presented again", () => {
    const req: Source = { status: "en-costeo", adjustmentCount: 2, hasPendingAdjustment: true };
    expect(getAdjustmentState(req)).toBe("pending");
    expect(hasPendingAdjustment(req)).toBe(true);
    expect(getAdjustmentCount(req)).toBe(2);
  });

  it("is resent once presented again, keeping the count", () => {
    const req: Source = { ...base, adjustmentCount: 2, hasPendingAdjustment: false };
    expect(getAdjustmentState(req)).toBe("resent");
    expect(hasPendingAdjustment(req)).toBe(false);
    expect(getAdjustmentCount(req)).toBe(2);
  });

  it("is none when the client never returned it", () => {
    const req: Source = { ...base, adjustmentCount: 0, hasPendingAdjustment: false };
    expect(getAdjustmentState(req)).toBe("none");
    expect(getAdjustmentCount(req)).toBe(0);
  });

  it("trusts the server flag over leftover observation text", () => {
    const req: Source = {
      status: "en-costeo",
      clientObservations: "texto viejo",
      adjustmentCount: 1,
      hasPendingAdjustment: false,
    };
    expect(getAdjustmentState(req)).toBe("resent");
  });

  it("is never pending outside costing, even if the flag says so", () => {
    expect(getAdjustmentState({ status: "entregada", adjustmentCount: 1, hasPendingAdjustment: true })).toBe("resent");
  });

  it("counts at least one while pending even if the count came as 0", () => {
    expect(getAdjustmentCount({ status: "en-costeo", adjustmentCount: 0, hasPendingAdjustment: true })).toBe(1);
  });

  it("uses the count alone when the pending flag is missing", () => {
    expect(getAdjustmentState({ ...base, adjustmentCount: 1 })).toBe("resent");
    expect(getAdjustmentState({ ...base, adjustmentCount: 0 })).toBe("none");
  });
});

describe("adjustment state fallback without server fields", () => {
  it("is pending in costing with observation text", () => {
    const req: Source = { status: "en-costeo", clientObservations: "Ajustar alcance" };
    expect(getAdjustmentState(req)).toBe("pending");
    expect(getAdjustmentCount(req)).toBe(1);
  });

  it("counts the rounds with observations while pending", () => {
    const req: Source = {
      status: "en-costeo",
      clientObservations: "Otra vez",
      negotiationRounds: [rejectedRound, rejectedRound, pendingRound],
    };
    expect(getAdjustmentCount(req)).toBe(2);
  });

  it("ignores blank observation text", () => {
    expect(getAdjustmentState({ status: "en-costeo", clientObservations: "   " })).toBe("none");
    expect(getAdjustmentState({ status: "en-costeo" })).toBe("none");
  });

  it("is never pending outside costing", () => {
    expect(getAdjustmentState({ status: "entregada", clientObservations: "x" })).toBe("none");
  });

  it("is resent when it left costing after rounds with observations", () => {
    const req: Source = { ...base, negotiationRounds: [rejectedRound, pendingRound] };
    expect(getAdjustmentState(req)).toBe("resent");
    expect(getAdjustmentCount(req)).toBe(1);
  });

  it("is none with no rounds with observations", () => {
    expect(getAdjustmentState({ ...base, negotiationRounds: [pendingRound] })).toBe("none");
    expect(getAdjustmentState({ ...base, negotiationRounds: [] })).toBe("none");
    expect(getAdjustmentCount(base)).toBe(0);
  });
});

describe("adjustment filter", () => {
  const pending: Source = { status: "en-costeo", adjustmentCount: 1, hasPendingAdjustment: true };
  const resent: Source = { status: "entregada", adjustmentCount: 1, hasPendingAdjustment: false };
  const none: Source = { status: "nueva", adjustmentCount: 0, hasPendingAdjustment: false };

  it("matches every request with the empty filter", () => {
    for (const req of [pending, resent, none]) expect(matchesAdjustmentFilter(req, "")).toBe(true);
  });

  it("matches only its own state otherwise", () => {
    expect([pending, resent, none].map((r) => matchesAdjustmentFilter(r, "pending"))).toEqual([true, false, false]);
    expect([pending, resent, none].map((r) => matchesAdjustmentFilter(r, "resent"))).toEqual([false, true, false]);
    expect([pending, resent, none].map((r) => matchesAdjustmentFilter(r, "none"))).toEqual([false, false, true]);
  });

  it("counts pending requests", () => {
    expect(countPendingAdjustments([pending, resent, none, pending])).toBe(2);
    expect(countPendingAdjustments([])).toBe(0);
  });

  it("validates stored values and names the four options", () => {
    expect(isAdjustmentFilter("pending")).toBe(true);
    expect(isAdjustmentFilter("resent")).toBe(true);
    expect(isAdjustmentFilter("none")).toBe(true);
    expect(isAdjustmentFilter("otro")).toBe(false);
    expect(isAdjustmentFilter(null)).toBe(false);
    expect(ADJUSTMENT_FILTER_LABELS).toEqual({
      "": "Todas",
      pending: "Pendientes",
      resent: "Ya reenviadas",
      none: "Sin ajustes",
    });
  });
});

describe("resent badge texts", () => {
  it("pluralises label and tooltip", () => {
    expect(adjustmentBadgeLabel(1)).toBe("1 ajuste");
    expect(adjustmentBadgeLabel(2)).toBe("2 ajustes");
    expect(adjustmentBadgeTitle(1)).toBe("Pasó por 1 sustentación y ajuste");
    expect(adjustmentBadgeTitle(2)).toBe("Pasó por 2 sustentaciones y ajustes");
  });
});
