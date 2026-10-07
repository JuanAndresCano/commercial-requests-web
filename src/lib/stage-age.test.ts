import { describe, expect, it } from "vitest";
import { formatStageAge, getStageAgeDays, getStageAgeLabel, getStageStartedAt } from "./stage-age";

const NOW = new Date("2026-10-10T12:00:00.000Z");

describe("getStageStartedAt", () => {
  it("uses statusUpdatedAt when present", () => {
    expect(
      getStageStartedAt({ createdAt: "2026-09-01T00:00:00Z", statusUpdatedAt: "2026-09-20T00:00:00Z" }, "en-experto"),
    ).toBe("2026-09-20T00:00:00Z");
  });

  it("falls back to createdAt when there is no statusUpdatedAt", () => {
    expect(getStageStartedAt({ createdAt: "2026-09-01T00:00:00Z" }, "nueva")).toBe("2026-09-01T00:00:00Z");
  });

  it("uses costingSentAt for the ready-to-deliver stage only", () => {
    const req = {
      createdAt: "2026-09-01T00:00:00Z",
      statusUpdatedAt: "2026-09-05T00:00:00Z",
      costing: {
        readyForKam: true,
        costingSentAt: "2026-10-08T00:00:00Z",
        totalOfferedCop: 1,
        expectedMarginPercent: 0,
        marginAmountCop: 0,
        proCulturaTaxPercent: 0,
        proCulturaTaxAmount: 0,
      },
    };
    expect(getStageStartedAt(req, "en-costeo")).toBe("2026-10-08T00:00:00Z");
    // En cualquier otra etapa mostrada, costingSentAt no aplica.
    expect(getStageStartedAt(req, "en-experto")).toBe("2026-09-05T00:00:00Z");
  });

  it("falls back to statusUpdatedAt in ready-to-deliver when costingSentAt is missing", () => {
    expect(
      getStageStartedAt({ createdAt: "2026-09-01T00:00:00Z", statusUpdatedAt: "2026-09-05T00:00:00Z" }, "en-costeo"),
    ).toBe("2026-09-05T00:00:00Z");
  });
});

describe("getStageAgeDays", () => {
  it("counts whole elapsed days", () => {
    expect(getStageAgeDays("2026-10-07T12:00:00.000Z", NOW)).toBe(3);
    expect(getStageAgeDays("2026-10-07T13:00:00.000Z", NOW)).toBe(2);
  });

  it("never goes negative for future dates", () => {
    expect(getStageAgeDays("2026-10-20T00:00:00.000Z", NOW)).toBe(0);
  });

  it("returns null for an invalid date", () => {
    expect(getStageAgeDays("no-es-una-fecha", NOW)).toBeNull();
  });
});

describe("formatStageAge", () => {
  it("handles zero, one and many days", () => {
    expect(formatStageAge(0)).toBe("Lleva menos de 1 día en esta etapa");
    expect(formatStageAge(1)).toBe("Lleva 1 día en esta etapa");
    expect(formatStageAge(5)).toBe("Lleva 5 días en esta etapa");
  });
});

describe("getStageAgeLabel", () => {
  it("combines start date and formatting", () => {
    expect(getStageAgeLabel({ createdAt: "2026-10-05T12:00:00.000Z" }, "nueva", NOW)).toBe(
      "Lleva 5 días en esta etapa",
    );
  });

  it("returns null when the date is unusable", () => {
    expect(getStageAgeLabel({ createdAt: "" }, "nueva", NOW)).toBeNull();
  });
});
