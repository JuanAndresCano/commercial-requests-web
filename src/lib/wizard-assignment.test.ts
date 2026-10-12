import { describe, expect, it } from "vitest";
import { leaderDisplayName, resolveNodeId, resolveProductLeaderId, toLeaderOptions } from "./wizard-assignment";

const leaders = [
  { id: "l1", email: "ana@example.org", firstName: "Ana", lastName: "Gómez" },
  { id: "l2", email: "luis@example.org", firstName: null, lastName: null },
];
const nodes = [
  { id: "n1", name: "Nodo Uno" },
  { id: "n2", name: "Nodo Dos" },
];

describe("resolveProductLeaderId", () => {
  it("finds the leader by id, by full name (ignoring case) or by e-mail", () => {
    expect(resolveProductLeaderId("l1", leaders)).toBe("l1");
    expect(resolveProductLeaderId("ana gómez", leaders)).toBe("l1");
    expect(resolveProductLeaderId("LUIS@example.org", leaders)).toBe("l2");
  });

  it("is undefined when nothing was chosen or the directory does not know the leader", () => {
    expect(resolveProductLeaderId("", leaders)).toBeUndefined();
    expect(resolveProductLeaderId("Otra Persona", leaders)).toBeUndefined();
    expect(resolveProductLeaderId("l1", undefined)).toBeUndefined();
  });
});

describe("resolveNodeId", () => {
  it("finds the node by id or by name (ignoring case)", () => {
    expect(resolveNodeId("n2", nodes)).toBe("n2");
    expect(resolveNodeId("nodo uno", nodes)).toBe("n1");
  });

  it("is undefined when no node was chosen: the node is optional", () => {
    expect(resolveNodeId("", nodes)).toBeUndefined();
    expect(resolveNodeId("Nodo Tres", nodes)).toBeUndefined();
    expect(resolveNodeId("n1", undefined)).toBeUndefined();
  });
});

describe("leaderDisplayName", () => {
  it("shows the name of the chosen leader, or the e-mail when the directory has no name", () => {
    expect(leaderDisplayName("l1", leaders)).toBe("Ana Gómez");
    expect(leaderDisplayName("l2", leaders)).toBe("luis@example.org");
  });

  it("falls back to what was stored and is empty without a leader", () => {
    expect(leaderDisplayName("Diana Romero", leaders)).toBe("Diana Romero");
    expect(leaderDisplayName("", leaders)).toBe("");
  });
});

describe("toLeaderOptions", () => {
  it("lists the directory leaders when there are any", () => {
    expect(toLeaderOptions(leaders, ["Fallback"])).toEqual([
      { id: "l1", name: "Ana Gómez" },
      { id: "l2", name: "luis@example.org" },
    ]);
  });

  it("lists the fallback names without id when the directory is empty or missing", () => {
    expect(toLeaderOptions([], ["Fallback"])).toEqual([{ id: "", name: "Fallback" }]);
    expect(toLeaderOptions(undefined, ["Fallback"])).toEqual([{ id: "", name: "Fallback" }]);
  });
});
