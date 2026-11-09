import { describe, expect, it } from "vitest";
import { matchesCommercialStatus, sumDeliveredValues } from "./commercial-status";

describe("commercial follow-up of delivered proposals", () => {
  it("keeps invoiced and rejected amounts in the delivered gross total without losing cents", () => {
    expect(
      sumDeliveredValues([
        { status: "entregada", deliveredValueCop: "5000000.10", commercialStatus: "INVOICED" },
        { status: "entregada", deliveredValueCop: "5000000.20", commercialStatus: "REJECTED" },
        { status: "en-costeo", deliveredValueCop: "999999.00" },
      ]),
    ).toBe("10000000.30");
  });

  it("filters a single commercial follow-up independently from operational stages", () => {
    expect(matchesCommercialStatus({ status: "entregada", commercialStatus: "INVOICED" }, "INVOICED")).toBe(true);
    expect(matchesCommercialStatus({ status: "entregada", commercialStatus: "REJECTED" }, "INVOICED")).toBe(false);
    expect(matchesCommercialStatus({ status: "entregada", commercialStatus: null }, "none")).toBe(true);
    expect(matchesCommercialStatus({ status: "nueva", commercialStatus: null }, "none")).toBe(false);
    expect(matchesCommercialStatus({ status: "en-costeo", commercialStatus: "INVOICED" }, "INVOICED")).toBe(false);
  });

  it("does not lose integers above the JavaScript safe range", () => {
    expect(
      sumDeliveredValues([
        { status: "entregada", deliveredValueCop: "9007199254740993.15" },
        { status: "entregada", deliveredValueCop: "0.20" },
      ]),
    ).toBe("9007199254740993.35");
  });

  it("reports missing or invalid delivered amounts instead of guessing from a private quote", () => {
    expect(sumDeliveredValues([{ status: "entregada" }])).toBeNull();
    expect(sumDeliveredValues([{ status: "entregada", deliveredValueCop: "-1.00" }])).toBeNull();
    expect(sumDeliveredValues([{ status: "entregada", deliveredValueCop: "1e6" }])).toBeNull();
    expect(sumDeliveredValues([{ status: "entregada", deliveredValueCop: "1.001" }])).toBeNull();
    expect(sumDeliveredValues([])).toBe("0.00");
  });
});
