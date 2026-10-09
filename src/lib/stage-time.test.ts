import { describe, expect, it } from "vitest";
import { formatStageDays, getStageTimes, type StageTimeSource } from "./stage-time";
import type { NegotiationRound, StatusHistoryEntry } from "./mock-data";

const NOW = new Date("2026-10-20T00:00:00.000Z");

const history = (...entries: [StatusHistoryEntry["status"], string][]): StatusHistoryEntry[] =>
  entries.map(([status, changedAt]) => ({ status, changedAt }));

const round = (roundNumber: number, sentToKamAt: string): NegotiationRound => ({
  id: `r${roundNumber}`,
  roundNumber,
  totalOfferedCop: 1,
  marginAmountCop: 0,
  expectedMarginPercent: 0,
  sentToKamAt,
  clientResponse: "pendiente",
});

const professorAssigned = (changedAt: string) => ({
  id: `p-${changedAt}`,
  newProfessor: "Dra. Paula Henao",
  newProfessorType: "planta" as const,
  changedBy: "Laura Diaz",
  changedAt,
  statusAtChange: "nueva" as const,
});

const daysOf = (rows: ReturnType<typeof getStageTimes>) =>
  Object.fromEntries((rows ?? []).map((r) => [r.stage, r.days]));

describe("getStageTimes for the leader", () => {
  it("lists the five leader stages with the board titles", () => {
    const rows = getStageTimes({ statusHistory: history(["nueva", "2026-10-18T00:00:00.000Z"]) }, "leader", NOW);
    expect(rows?.map((r) => r.label)).toEqual([
      "Nueva",
      "En proceso por experto",
      "En proceso de costeo",
      "Enviada al KAM",
      "Entregada",
    ]);
  });

  it("accumulates the whole days of each stage and marks the current one", () => {
    const rows = getStageTimes(
      {
        statusHistory: history(
          ["nueva", "2026-10-01T00:00:00.000Z"],
          ["en-experto", "2026-10-04T00:00:00.000Z"],
          ["en-costeo", "2026-10-10T00:00:00.000Z"],
        ),
        negotiationRounds: [round(1, "2026-10-15T00:00:00.000Z")],
      },
      "leader",
      NOW,
    );
    expect(daysOf(rows)).toEqual({
      nueva: 3,
      "en-experto": 6,
      "en-costeo": 5,
      "enviada-kam": 5,
      entregada: null,
    });
    expect(rows?.filter((r) => r.current).map((r) => r.stage)).toEqual(["enviada-kam"]);
  });

  it("adds up the repeated stretches when the client returned the request", () => {
    const rows = getStageTimes(
      {
        statusHistory: history(
          ["nueva", "2026-10-01T00:00:00.000Z"],
          ["en-experto", "2026-10-02T00:00:00.000Z"],
          ["en-costeo", "2026-10-04T00:00:00.000Z"],
          ["entregada", "2026-10-09T00:00:00.000Z"],
          ["en-costeo", "2026-10-12T00:00:00.000Z"],
        ),
        negotiationRounds: [round(1, "2026-10-06T00:00:00.000Z"), round(2, "2026-10-14T00:00:00.000Z")],
      },
      "leader",
      NOW,
    );
    expect(daysOf(rows)).toEqual({
      nueva: 1,
      "en-experto": 2,
      // costing: 2 days (04 to 06) + 2 days (12 to 14)
      "en-costeo": 4,
      // sent to the KAM: 3 days (06 to 09) + 6 days (14 to 20)
      "enviada-kam": 9,
      entregada: 3,
    });
    expect(rows?.find((r) => r.current)?.stage).toBe("enviada-kam");
  });

  it("sums fractions before rounding down, so two stretches of a day and a half make three days", () => {
    const rows = getStageTimes(
      {
        statusHistory: history(
          ["nueva", "2026-10-01T00:00:00.000Z"],
          ["en-experto", "2026-10-02T12:00:00.000Z"],
          ["nueva", "2026-10-03T00:00:00.000Z"],
          ["en-experto", "2026-10-04T12:00:00.000Z"],
        ),
      },
      "leader",
      NOW,
    );
    expect(daysOf(rows).nueva).toBe(3);
  });

  it("counts the current stage up to now, and 'entregada' when that is where it is", () => {
    const rows = getStageTimes(
      {
        statusHistory: history(["nueva", "2026-10-01T00:00:00.000Z"], ["entregada", "2026-10-18T00:00:00.000Z"]),
      },
      "leader",
      NOW,
    );
    expect(daysOf(rows).entregada).toBe(2);
    expect(rows?.find((r) => r.current)?.stage).toBe("entregada");
  });

  it("ignores rejected and cancelled stretches", () => {
    const rows = getStageTimes(
      { statusHistory: history(["nueva", "2026-10-15T00:00:00.000Z"], ["cancelada", "2026-10-17T00:00:00.000Z"]) },
      "leader",
      NOW,
    );
    expect(daysOf(rows).nueva).toBe(2);
    expect(rows?.some((r) => r.current)).toBe(false);
  });
});

describe("getStageTimes for the KAM", () => {
  it("lists the four KAM stages with the KAM labels", () => {
    const rows = getStageTimes({ statusHistory: history(["nueva", "2026-10-18T00:00:00.000Z"]) }, "kam", NOW);
    expect(rows?.map((r) => r.label)).toEqual(["Entregada al líder", "En Proceso", "Lista para Entregar", "Entregada"]);
  });

  it("counts a new request with a professor as 'En Proceso', like the board does", () => {
    const source: StageTimeSource = {
      statusHistory: history(["nueva", "2026-10-01T00:00:00.000Z"], ["en-experto", "2026-10-08T00:00:00.000Z"]),
      professorHistory: [professorAssigned("2026-10-03T00:00:00.000Z")],
    };
    const rows = getStageTimes(source, "kam", NOW);
    // nueva: 01 to 03 without professor; en-experto: 03 to 08 with professor + 08 to 20
    expect(daysOf(rows)).toEqual({ nueva: 2, "en-experto": 17, "en-costeo": null, entregada: null });
    expect(rows?.find((r) => r.current)?.stage).toBe("en-experto");
  });

  it("keeps costing as 'En Proceso' until the leader sends it, then 'Lista para Entregar'", () => {
    const rows = getStageTimes(
      {
        statusHistory: history(
          ["nueva", "2026-10-01T00:00:00.000Z"],
          ["en-experto", "2026-10-02T00:00:00.000Z"],
          ["en-costeo", "2026-10-06T00:00:00.000Z"],
        ),
        negotiationRounds: [round(1, "2026-10-16T00:00:00.000Z")],
      },
      "kam",
      NOW,
    );
    expect(daysOf(rows)).toEqual({
      nueva: 1,
      // 02 to 06 with the expert + 06 to 16 costing not sent yet
      "en-experto": 14,
      "en-costeo": 4,
      entregada: null,
    });
    expect(rows?.find((r) => r.current)?.stage).toBe("en-costeo");
  });

  it("adds up the repeated stretches of a request the client returned", () => {
    const rows = getStageTimes(
      {
        statusHistory: history(
          ["nueva", "2026-10-01T00:00:00.000Z"],
          ["en-costeo", "2026-10-02T00:00:00.000Z"],
          ["entregada", "2026-10-06T00:00:00.000Z"],
          ["en-costeo", "2026-10-08T00:00:00.000Z"],
        ),
        negotiationRounds: [round(1, "2026-10-04T00:00:00.000Z"), round(2, "2026-10-10T00:00:00.000Z")],
      },
      "kam",
      NOW,
    );
    expect(daysOf(rows)).toEqual({
      nueva: 1,
      // 02 to 04 and 08 to 10 while the leader worked on it
      "en-experto": 4,
      // 04 to 06 and 10 to 20 waiting for the KAM to deliver
      "en-costeo": 12,
      entregada: 2,
    });
  });

  it("does not count a professor assigned in an earlier stretch of 'nueva'", () => {
    const rows = getStageTimes(
      {
        statusHistory: history(
          ["nueva", "2026-10-01T00:00:00.000Z"],
          ["en-experto", "2026-10-03T00:00:00.000Z"],
          // reassigned to another leader: back to nueva, professor cleared
          ["nueva", "2026-10-05T00:00:00.000Z"],
        ),
        professorHistory: [professorAssigned("2026-10-02T00:00:00.000Z")],
      },
      "kam",
      NOW,
    );
    // nueva 01 to 02 + 05 to 20 = 16 days; en-experto 02 to 03 (professor) + 03 to 05 = 3 days
    expect(daysOf(rows)).toEqual({ nueva: 16, "en-experto": 3, "en-costeo": null, entregada: null });
  });
});

describe("getStageTimes without a usable history", () => {
  it("returns null when there is no history or only unusable dates", () => {
    expect(getStageTimes({}, "kam", NOW)).toBeNull();
    expect(getStageTimes({ statusHistory: [] }, "leader", NOW)).toBeNull();
    expect(getStageTimes({ statusHistory: history(["nueva", "no-es-fecha"]) }, "leader", NOW)).toBeNull();
  });
});

describe("formatStageDays", () => {
  it("handles never reached, less than a day, one and many days", () => {
    expect(formatStageDays(null)).toBe("—");
    expect(formatStageDays(0)).toBe("menos de 1 día");
    expect(formatStageDays(1)).toBe("1 día");
    expect(formatStageDays(7)).toBe("7 días");
  });
});
