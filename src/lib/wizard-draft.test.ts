import { describe, expect, it } from "vitest";
import { restoreDraftData } from "./wizard-draft";

const INITIAL = { nodo: "", ldp: "", nombreReq: "", ciiusSecundarios: [] as string[], archivos: [] as unknown[] };

describe("restoreDraftData", () => {
  it("restores what the draft has and fills what it lacks with the initial values", () => {
    // A draft saved before the leader became mandatory has a node and no leader key at all.
    const restored = restoreDraftData({ nodo: "Nodo Uno", nombreReq: "Taller" }, INITIAL);
    expect(restored).toEqual({ ...INITIAL, nodo: "Nodo Uno", nombreReq: "Taller" });
  });

  it("does not invent a node or a leader: an old draft keeps exactly the ones it had", () => {
    expect(restoreDraftData({ nodo: "Nodo Uno", ldp: "" }, INITIAL)).toMatchObject({ nodo: "Nodo Uno", ldp: "" });
    expect(restoreDraftData({ ldp: "l1" }, INITIAL)).toMatchObject({ nodo: "", ldp: "l1" });
  });

  it("ignores keys that no longer exist and values of the wrong type", () => {
    const restored = restoreDraftData({ ldp: 42, ciiusSecundarios: "6412", legacyField: "x" }, INITIAL);
    expect(restored).toEqual(INITIAL);
    expect(restored).not.toHaveProperty("legacyField");
  });

  it("returns null when the draft is not an object", () => {
    expect(restoreDraftData(null, INITIAL)).toBeNull();
    expect(restoreDraftData("text", INITIAL)).toBeNull();
    expect(restoreDraftData([], INITIAL)).toBeNull();
  });
});
