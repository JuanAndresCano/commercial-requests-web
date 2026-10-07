import { describe, expect, it } from "vitest";
import {
  EMPTY_KAM_BOARD_FILTERS,
  deriveKamBoardFilterOptions,
  hasActiveKamBoardFilters,
  matchesKamBoardFilters,
  sanitizeKamBoardFilters,
} from "./kam-board-filters";

const reqs = [
  { productLeader: "Carlos Gómez", company: "Bancolombia", type: "Capacitación" },
  { productLeader: "Ana Ruiz", company: "Carvajal", type: "Consultoría" },
  { productLeader: "Carlos Gómez", company: "Carvajal", type: "Capacitación" },
  { productLeader: "", company: "Álvaro SAS", type: "Capacitación" },
];

describe("deriveKamBoardFilterOptions", () => {
  it("returns unique, sorted, non-empty values", () => {
    expect(deriveKamBoardFilterOptions(reqs)).toEqual({
      productLeaders: ["Ana Ruiz", "Carlos Gómez"],
      companies: ["Álvaro SAS", "Bancolombia", "Carvajal"],
      types: ["Capacitación", "Consultoría"],
    });
  });

  it("returns empty lists for no requests", () => {
    expect(deriveKamBoardFilterOptions([])).toEqual({ productLeaders: [], companies: [], types: [] });
  });
});

describe("matchesKamBoardFilters", () => {
  const only = (patch: Partial<typeof EMPTY_KAM_BOARD_FILTERS>) => ({ ...EMPTY_KAM_BOARD_FILTERS, ...patch });

  it("matches everything with empty filters", () => {
    expect(reqs.every((r) => matchesKamBoardFilters(r, EMPTY_KAM_BOARD_FILTERS))).toBe(true);
  });

  it("filters by each field on its own", () => {
    expect(reqs.filter((r) => matchesKamBoardFilters(r, only({ company: "Carvajal" })))).toHaveLength(2);
    expect(reqs.filter((r) => matchesKamBoardFilters(r, only({ type: "Consultoría" })))).toHaveLength(1);
    expect(reqs.filter((r) => matchesKamBoardFilters(r, only({ productLeader: "Carlos Gómez" })))).toHaveLength(2);
  });

  it("combines the three filters with AND", () => {
    const filters = { productLeader: "Carlos Gómez", company: "Carvajal", type: "Capacitación" };
    expect(reqs.filter((r) => matchesKamBoardFilters(r, filters))).toEqual([reqs[2]]);
    expect(matchesKamBoardFilters(reqs[1], filters)).toBe(false);
  });
});

describe("sanitizeKamBoardFilters", () => {
  const options = deriveKamBoardFilterOptions(reqs);

  it("keeps selections that still exist", () => {
    const filters = { productLeader: "Ana Ruiz", company: "Carvajal", type: "Consultoría" };
    expect(sanitizeKamBoardFilters(filters, options)).toEqual(filters);
  });

  it("drops stale selections", () => {
    expect(
      sanitizeKamBoardFilters({ productLeader: "Fulano", company: "Carvajal", type: "Mentoría" }, options),
    ).toEqual({ productLeader: "", company: "Carvajal", type: "" });
  });
});

describe("hasActiveKamBoardFilters", () => {
  it("detects any active filter", () => {
    expect(hasActiveKamBoardFilters(EMPTY_KAM_BOARD_FILTERS)).toBe(false);
    expect(hasActiveKamBoardFilters({ ...EMPTY_KAM_BOARD_FILTERS, type: "Consultoría" })).toBe(true);
  });
});
