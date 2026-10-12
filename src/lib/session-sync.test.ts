import { afterEach, describe, expect, it, vi } from "vitest";
import { openSessionChannel, parseSessionSignal, sessionConflictReason } from "./session-sync";

describe("parseSessionSignal", () => {
  it("accepts login and logout signals", () => {
    expect(parseSessionSignal({ type: "login", userId: "u1" })).toEqual({ type: "login", userId: "u1" });
    expect(parseSessionSignal({ type: "logout" })).toEqual({ type: "logout" });
  });

  it("rejects anything else", () => {
    expect(parseSessionSignal(null)).toBeNull();
    expect(parseSessionSignal("login")).toBeNull();
    expect(parseSessionSignal({ type: "login" })).toBeNull();
    expect(parseSessionSignal({ type: "login", userId: "" })).toBeNull();
    expect(parseSessionSignal({ type: "other" })).toBeNull();
  });
});

describe("sessionConflictReason", () => {
  it("flags a login of a different user when this tab is signed in", () => {
    expect(sessionConflictReason("u1", { type: "login", userId: "u2" })).toBe("user-changed");
  });

  it("ignores a login of the same user", () => {
    expect(sessionConflictReason("u1", { type: "login", userId: "u1" })).toBeNull();
  });

  it("flags a logout when this tab is signed in", () => {
    expect(sessionConflictReason("u1", { type: "logout" })).toBe("signed-out");
  });

  it("never flags a tab that is not signed in", () => {
    expect(sessionConflictReason(null, { type: "login", userId: "u2" })).toBeNull();
    expect(sessionConflictReason(null, { type: "logout" })).toBeNull();
  });
});

describe("openSessionChannel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses BroadcastChannel when available", () => {
    const instances: FakeChannel[] = [];
    class FakeChannel {
      onmessage: ((event: MessageEvent) => void) | null = null;
      posted: unknown[] = [];
      closed = false;
      constructor(public name: string) {
        instances.push(this);
      }
      postMessage(message: unknown) {
        this.posted.push(message);
      }
      close() {
        this.closed = true;
      }
    }
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    const onSignal = vi.fn();

    const channel = openSessionChannel(onSignal);
    channel.post({ type: "login", userId: "u1" });
    instances[0].onmessage?.({ data: { type: "logout" } } as MessageEvent);
    instances[0].onmessage?.({ data: "garbage" } as MessageEvent);
    channel.close();

    expect(instances[0].posted).toEqual([{ type: "login", userId: "u1" }]);
    expect(onSignal).toHaveBeenCalledTimes(1);
    expect(onSignal).toHaveBeenCalledWith({ type: "logout" });
    expect(instances[0].closed).toBe(true);
  });

  it("is inert, and never touches localStorage, when BroadcastChannel does not exist", () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const onSignal = vi.fn();

    const channel = openSessionChannel(onSignal);
    channel.post({ type: "login", userId: "u1" });
    channel.close();

    expect(setItem).not.toHaveBeenCalled();
    expect(onSignal).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});
