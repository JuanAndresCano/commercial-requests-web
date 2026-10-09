import { describe, expect, it } from "vitest";
import {
  formatStageAge,
  getLeaderStageAgeLabel,
  getLeaderStageStartedAt,
  getStageAgeDays,
  getStageAgeLabel,
  getStageStartedAt,
  getTotalAgeLabel,
} from "./stage-age";

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

describe("getStageStartedAt when the KAM's stage changes without a status change", () => {
  const created = "2026-09-01T00:00:00Z";

  it("does not restart the clock when a professor is assigned (nueva shown as 'En Proceso')", () => {
    const req = { createdAt: created, statusUpdatedAt: created };
    expect(getStageStartedAt(req, "nueva")).toBe(created);
    expect(getStageStartedAt(req, "en-experto")).toBe(created);
  });

  it("falls back to createdAt for a new request with no status timestamp", () => {
    expect(getStageStartedAt({ createdAt: created }, "en-experto")).toBe(created);
  });
});

describe("getLeaderStageStartedAt", () => {
  const costing = {
    readyForKam: true,
    costingSentAt: "2026-10-08T00:00:00Z",
    totalOfferedCop: 1,
    expectedMarginPercent: 0,
    marginAmountCop: 0,
    proCulturaTaxPercent: 0,
    proCulturaTaxAmount: 0,
  };
  const req = { createdAt: "2026-09-01T00:00:00Z", statusUpdatedAt: "2026-09-05T00:00:00Z", costing };

  it("counts 'Enviada al KAM' from the moment the leader sent it", () => {
    expect(getLeaderStageStartedAt(req, "enviada-kam")).toBe("2026-10-08T00:00:00Z");
  });

  it("falls back to statusUpdatedAt when costingSentAt is missing", () => {
    expect(getLeaderStageStartedAt({ ...req, costing: { ...costing, costingSentAt: undefined } }, "enviada-kam")).toBe(
      "2026-09-05T00:00:00Z",
    );
  });

  it("ignores costingSentAt in the other stages, including 'En proceso de costeo'", () => {
    expect(getLeaderStageStartedAt(req, "en-costeo")).toBe("2026-09-05T00:00:00Z");
    expect(getLeaderStageStartedAt({ createdAt: "2026-09-01T00:00:00Z" }, "nueva")).toBe("2026-09-01T00:00:00Z");
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

describe("getTotalAgeLabel (days since the request was created)", () => {
  it("counts whole days from the creation, whatever the stage", () => {
    expect(getTotalAgeLabel({ createdAt: "2026-09-30T12:00:00.000Z" }, NOW)).toBe("Total 10 días");
  });

  it("handles zero and one day", () => {
    expect(getTotalAgeLabel({ createdAt: "2026-10-10T08:00:00.000Z" }, NOW)).toBe("Total menos de 1 día");
    expect(getTotalAgeLabel({ createdAt: "2026-10-09T08:00:00.000Z" }, NOW)).toBe("Total 1 día");
  });

  it("returns null when the creation date is unusable", () => {
    expect(getTotalAgeLabel({ createdAt: "" }, NOW)).toBeNull();
  });
});

describe("getLeaderStageAgeLabel", () => {
  const costing = {
    readyForKam: true,
    costingSentAt: "2026-10-08T12:00:00.000Z",
    totalOfferedCop: 1,
    expectedMarginPercent: 0,
    marginAmountCop: 0,
    proCulturaTaxPercent: 0,
    proCulturaTaxAmount: 0,
  };
  const req = { createdAt: "2026-09-01T00:00:00Z", statusUpdatedAt: "2026-10-05T12:00:00.000Z", costing };

  it("uses the same wording as the KAM board", () => {
    expect(getLeaderStageAgeLabel(req, "en-costeo", NOW)).toBe("Lleva 5 días en esta etapa");
  });

  it("counts 'Enviada al KAM' from the moment the leader sent it", () => {
    expect(getLeaderStageAgeLabel(req, "enviada-kam", NOW)).toBe("Lleva 2 días en esta etapa");
  });

  it("returns null when the date is unusable", () => {
    expect(getLeaderStageAgeLabel({ createdAt: "" }, "nueva", NOW)).toBeNull();
  });
});
