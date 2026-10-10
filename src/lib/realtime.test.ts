import { describe, expect, it } from "vitest";
import {
  BACKUP_POLL_MS,
  REALTIME_BATCH_MS,
  buildInvalidationPlan,
  isQueryAffected,
  nextReconnectDelay,
  parseRealtimeEvent,
  realtimeStatusLabel,
} from "./realtime";

describe("parseRealtimeEvent", () => {
  it("reads the minimal payload the backend sends", () => {
    expect(parseRealtimeEvent('{"proposalId":"p-1","type":"status"}')).toEqual({
      proposalId: "p-1",
      type: "status",
    });
  });

  it.each([
    ["not JSON", "hello"],
    ["a JSON array", "[]"],
    ["null", "null"],
    ["a missing proposalId", '{"type":"status"}'],
    ["an empty proposalId", '{"proposalId":"","type":"status"}'],
    ["a non-string proposalId", '{"proposalId":7,"type":"status"}'],
    ["a missing type", '{"proposalId":"p-1"}'],
  ])("ignores %s", (_label, raw) => {
    expect(parseRealtimeEvent(raw)).toBeNull();
  });

  it("keeps an unknown type (a newer backend) as a generic change instead of dropping it", () => {
    expect(parseRealtimeEvent('{"proposalId":"p-1","type":"something-new"}')).toEqual({
      proposalId: "p-1",
      type: "unknown",
    });
  });

  it("knows every type the backend can send", () => {
    for (const type of [
      "created",
      "status",
      "professor",
      "costing",
      "delivered",
      "returned",
      "reassigned",
      "node",
      "center",
      "info",
      "cancelled",
    ]) {
      expect(parseRealtimeEvent(JSON.stringify({ proposalId: "p", type }))?.type).toBe(type);
    }
  });
});

describe("buildInvalidationPlan / isQueryAffected", () => {
  const plan = buildInvalidationPlan([
    { proposalId: "p-1", type: "status" },
    { proposalId: "p-2", type: "costing" },
    { proposalId: "p-1", type: "info" },
  ]);

  it("collects each affected proposal once", () => {
    expect([...plan.proposalIds].sort()).toEqual(["p-1", "p-2"]);
  });

  it("refreshes every board listing", () => {
    expect(isQueryAffected(["requests", {}], plan)).toBe(true);
    expect(isQueryAffected(["requests", { status: "NEW" }], plan)).toBe(true);
  });

  it("refreshes the dashboard metrics", () => {
    expect(isQueryAffected(["dashboard-metrics"], plan)).toBe(true);
  });

  it("refreshes the detail of an affected proposal only", () => {
    expect(isQueryAffected(["requests", "p-1"], plan)).toBe(true);
    expect(isQueryAffected(["requests", "p-2"], plan)).toBe(true);
    expect(isQueryAffected(["requests", "p-3"], plan)).toBe(false);
  });

  it("leaves unrelated queries alone", () => {
    expect(isQueryAffected(["nodes"], plan)).toBe(false);
    expect(isQueryAffected(["professors", "ALL", ""], plan)).toBe(false);
    expect(isQueryAffected(["users", "PRODUCT_LEADER"], plan)).toBe(false);
  });

  it("an empty batch affects only listings and metrics", () => {
    const empty = buildInvalidationPlan([]);
    expect(isQueryAffected(["requests", "p-1"], empty)).toBe(false);
    expect(isQueryAffected(["requests", {}], empty)).toBe(true);
  });
});

describe("nextReconnectDelay", () => {
  const noJitter = () => 0.5; // jitter factor 1

  it("backs off exponentially from one second", () => {
    expect([0, 1, 2, 3].map((n) => nextReconnectDelay(n, noJitter))).toEqual([1000, 2000, 4000, 8000]);
  });

  it("never waits more than thirty seconds", () => {
    expect(nextReconnectDelay(20, noJitter)).toBe(30_000);
  });

  it("adds up to 20 percent of jitter either way", () => {
    expect(nextReconnectDelay(0, () => 0)).toBe(800);
    expect(nextReconnectDelay(0, () => 1)).toBe(1200);
  });
});

describe("constants and labels", () => {
  it("groups events in a short window and polls fast while disconnected", () => {
    expect(REALTIME_BATCH_MS).toBe(250);
    expect(BACKUP_POLL_MS).toBe(5000);
  });

  it("describes each connection state in Spanish", () => {
    expect(realtimeStatusLabel("live")).toBe("En vivo");
    expect(realtimeStatusLabel("reconnecting")).toBe("Reconectando…");
    expect(realtimeStatusLabel("connecting")).toBe("Conectando…");
    expect(realtimeStatusLabel("paused")).toBeNull();
    expect(realtimeStatusLabel("off")).toBeNull();
  });
});
