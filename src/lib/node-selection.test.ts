import { describe, expect, it } from "vitest";
import {
  NO_NODE_LABEL,
  NO_NODE_VALUE,
  applyLeaderChange,
  applyNodeChange,
  nodeIdFromSelectValue,
  nodeLabel,
  nodePatchFor,
  selectValueForNode,
} from "./node-selection";

describe("nodeLabel", () => {
  it('shows "Sin nodo" when the request has no node', () => {
    expect(nodeLabel(null)).toBe("Sin nodo");
    expect(nodeLabel(undefined)).toBe("Sin nodo");
    expect(nodeLabel("   ")).toBe("Sin nodo");
    expect(NO_NODE_LABEL).toBe("Sin nodo");
  });

  it("shows the node name when there is one", () => {
    expect(nodeLabel("Salud Global")).toBe("Salud Global");
  });
});

describe("select value of the node", () => {
  it("uses a sentinel for no node, because a Select item cannot have an empty value", () => {
    expect(selectValueForNode(null)).toBe(NO_NODE_VALUE);
    expect(selectValueForNode("")).toBe(NO_NODE_VALUE);
    expect(selectValueForNode("n-1")).toBe("n-1");
  });

  it("turns the sentinel back into null", () => {
    expect(nodeIdFromSelectValue(NO_NODE_VALUE)).toBeNull();
    expect(nodeIdFromSelectValue("")).toBeNull();
    expect(nodeIdFromSelectValue("n-1")).toBe("n-1");
  });
});

describe("nodePatchFor (what the leader's node editor sends)", () => {
  it("returns nothing when the chosen value is the current node", () => {
    expect(nodePatchFor("n-1", "n-1")).toBeNull();
    expect(nodePatchFor(null, NO_NODE_VALUE)).toBeNull();
    expect(nodePatchFor(null, "")).toBeNull();
  });

  it("sends the new id when a node is put or changed", () => {
    expect(nodePatchFor(null, "n-2")).toEqual({ nodeId: "n-2" });
    expect(nodePatchFor("n-1", "n-2")).toEqual({ nodeId: "n-2" });
  });

  it("sends an explicit null to remove the node", () => {
    expect(nodePatchFor("n-1", NO_NODE_VALUE)).toEqual({ nodeId: null });
  });
});

describe("team correction state (KAM dialog)", () => {
  const state = { nodeId: null as string | null, leaderId: "l-1" };

  it("picks the suggested leader when a node is chosen", () => {
    expect(applyNodeChange(state, "n-2", "l-2")).toEqual({ nodeId: "n-2", leaderId: "l-2" });
  });

  it("keeps the leader when the node has no suggestion", () => {
    expect(applyNodeChange(state, "n-2", undefined)).toEqual({ nodeId: "n-2", leaderId: "l-1" });
  });

  it("allows an empty node and keeps the leader", () => {
    expect(applyNodeChange({ nodeId: "n-2", leaderId: "l-2" }, NO_NODE_VALUE, undefined)).toEqual({
      nodeId: null,
      leaderId: "l-2",
    });
  });

  it("never fills or changes the node when the leader changes", () => {
    expect(applyLeaderChange(state, "l-9")).toEqual({ nodeId: null, leaderId: "l-9" });
    expect(applyLeaderChange({ nodeId: "n-3", leaderId: "l-1" }, "l-9")).toEqual({ nodeId: "n-3", leaderId: "l-9" });
  });
});
