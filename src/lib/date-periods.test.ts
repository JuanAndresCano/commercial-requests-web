import { describe, it, expect } from "vitest";
import { isPeriodInFuture, isPeriodBeforeHistory } from "./date-periods";

describe("date-periods utility", () => {
  const refDate = new Date("2026-05-15T12:00:00Z"); // May 2026 (Q2)

  it("identifies future years, quarters and months correctly", () => {
    // 2027 is in the future
    expect(isPeriodInFuture(2027, { quarter: 1 }, refDate)).toBe(true);

    // 2025 is in the past
    expect(isPeriodInFuture(2025, { quarter: 4 }, refDate)).toBe(false);

    // 2026: Q1 and Q2 are past/current, Q3 and Q4 are future
    expect(isPeriodInFuture(2026, { quarter: 1 }, refDate)).toBe(false);
    expect(isPeriodInFuture(2026, { quarter: 2 }, refDate)).toBe(false);
    expect(isPeriodInFuture(2026, { quarter: 3 }, refDate)).toBe(true);
    expect(isPeriodInFuture(2026, { quarter: 4 }, refDate)).toBe(true);

    // 2026: May (5) is current, June (6) is future
    expect(isPeriodInFuture(2026, { month: 5 }, refDate)).toBe(false);
    expect(isPeriodInFuture(2026, { month: 6 }, refDate)).toBe(true);
  });

  it("identifies periods before history correctly", () => {
    const minDate = "2024-09-01T00:00:00Z";

    // 2023 is before history
    expect(isPeriodBeforeHistory(2023, { quarter: 4 }, minDate)).toBe(true);

    // 2024: Q1/Q2 are before Sept (Q3), Q3 and Q4 are within history
    expect(isPeriodBeforeHistory(2024, { quarter: 1 }, minDate)).toBe(true);
    expect(isPeriodBeforeHistory(2024, { quarter: 2 }, minDate)).toBe(true);
    expect(isPeriodBeforeHistory(2024, { quarter: 3 }, minDate)).toBe(false);
    expect(isPeriodBeforeHistory(2024, { quarter: 4 }, minDate)).toBe(false);

    // 2024: August (8) is before, September (9) is valid
    expect(isPeriodBeforeHistory(2024, { month: 8 }, minDate)).toBe(true);
    expect(isPeriodBeforeHistory(2024, { month: 9 }, minDate)).toBe(false);

    // 2025 is after 2024, so not before history
    expect(isPeriodBeforeHistory(2025, { month: 1 }, minDate)).toBe(false);
  });
});
