import { describe, expect, it } from "vitest";
import { MAX_TIMER_MS, isSessionActive, mapBackendRoles, msUntilExpiry } from "./session";

describe("isSessionActive", () => {
  const now = 1_000_000;

  it("is true only while expiresAt is in the future", () => {
    expect(isSessionActive(now + 1, now)).toBe(true);
    expect(isSessionActive(now, now)).toBe(false);
    expect(isSessionActive(now - 1, now)).toBe(false);
  });

  it("rejects non-finite expiry values", () => {
    expect(isSessionActive(Number.NaN, now)).toBe(false);
    expect(isSessionActive(Number.POSITIVE_INFINITY, now)).toBe(false);
  });
});

describe("msUntilExpiry", () => {
  it("never returns a negative delay", () => {
    expect(msUntilExpiry(500, 1_000)).toBe(0);
  });

  it("caps the delay to what setTimeout supports", () => {
    expect(msUntilExpiry(10 * MAX_TIMER_MS, 0)).toBe(MAX_TIMER_MS);
  });
});

describe("mapBackendRoles", () => {
  it("maps backend codes to UI roles and drops unknown ones", () => {
    expect(mapBackendRoles(["ADMIN", "KAM", "PRODUCT_LEADER", "ASSISTANT"])).toEqual([
      "administrador",
      "kam",
      "lider-producto",
    ]);
  });

  it("returns an empty list when no role is usable", () => {
    expect(mapBackendRoles(["ASSISTANT"])).toEqual([]);
  });

  it("does not repeat roles", () => {
    expect(mapBackendRoles(["KAM", "KAM"])).toEqual(["kam"]);
  });
});
