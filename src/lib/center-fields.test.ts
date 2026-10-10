import { describe, expect, it } from "vitest";
import { centerDraftOf, centerPatchFor, hasCenterData } from "./center-fields";

describe("centerDraftOf", () => {
  it("starts from the stored values, empty when there are none", () => {
    expect(centerDraftOf({ center: "Eduteka", costCenter: "CC-1" })).toEqual({ center: "Eduteka", costCenter: "CC-1" });
    expect(centerDraftOf({})).toEqual({ center: "", costCenter: "" });
  });
});

describe("centerPatchFor (body of PATCH /requests/:id/center)", () => {
  it("returns nothing when no field changed, ignoring surrounding spaces", () => {
    expect(centerPatchFor({ center: "OEM" }, { center: "  OEM ", costCenter: "" })).toBeNull();
    expect(centerPatchFor({}, { center: "", costCenter: "   " })).toBeNull();
  });

  it("sends only the field that changed", () => {
    expect(centerPatchFor({ center: "OEM" }, { center: "OEM", costCenter: " CC-9 " })).toEqual({ costCenter: "CC-9" });
    expect(centerPatchFor({}, { center: "Eduteka", costCenter: "" })).toEqual({ center: "Eduteka" });
  });

  it("sends null to clear a field that had a value", () => {
    expect(centerPatchFor({ center: "OEM", costCenter: "CC-1" }, { center: "", costCenter: "CC-1" })).toEqual({
      center: null,
    });
  });

  it("sends both when both changed", () => {
    expect(centerPatchFor({ center: "OEM" }, { center: "Eduteka", costCenter: "CC-2" })).toEqual({
      center: "Eduteka",
      costCenter: "CC-2",
    });
  });
});

describe("hasCenterData", () => {
  it("is true when either field has a value", () => {
    expect(hasCenterData({ center: "OEM" })).toBe(true);
    expect(hasCenterData({ costCenter: "CC-1" })).toBe(true);
    expect(hasCenterData({})).toBe(false);
    expect(hasCenterData({ center: "  ", costCenter: undefined })).toBe(false);
  });
});
