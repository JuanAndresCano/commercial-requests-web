import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionSignal } from "@/lib/session-sync";
import { useSessionSync } from "./use-session-sync";

const channelState = vi.hoisted(() => ({
  handler: null as ((signal: SessionSignal) => void) | null,
  post: vi.fn(),
  close: vi.fn(),
}));

vi.mock("@/lib/session-sync", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session-sync")>()),
  openSessionChannel: (handler: (signal: SessionSignal) => void) => {
    channelState.handler = handler;
    return { post: channelState.post, close: channelState.close };
  },
}));

const receive = (signal: SessionSignal) => act(() => channelState.handler?.(signal));

describe("useSessionSync", () => {
  beforeEach(() => {
    channelState.handler = null;
    channelState.post.mockReset();
    channelState.close.mockReset();
  });

  it("flags a conflict when another tab signs in as a different user", () => {
    const { result } = renderHook(() => useSessionSync("u1"));
    expect(result.current.conflict).toBeNull();

    receive({ type: "login", userId: "u2" });
    expect(result.current.conflict).toBe("user-changed");
  });

  it("flags a conflict when another tab signs out", () => {
    const { result } = renderHook(() => useSessionSync("u1"));

    receive({ type: "logout" });
    expect(result.current.conflict).toBe("signed-out");
  });

  it("does not flag the same user or a signed-out tab", () => {
    const { result, rerender } = renderHook(({ id }) => useSessionSync(id), {
      initialProps: { id: "u1" as string | null },
    });

    receive({ type: "login", userId: "u1" });
    expect(result.current.conflict).toBeNull();

    rerender({ id: null });
    receive({ type: "login", userId: "u2" });
    expect(result.current.conflict).toBeNull();
  });

  it("judges signals against the user of the moment, not the one at mount", () => {
    const { result, rerender } = renderHook(({ id }) => useSessionSync(id), {
      initialProps: { id: null as string | null },
    });

    rerender({ id: "u1" });
    receive({ type: "login", userId: "u1" });
    expect(result.current.conflict).toBeNull();
    receive({ type: "login", userId: "u2" });
    expect(result.current.conflict).toBe("user-changed");
  });

  it("announces through the channel and closes it on unmount", () => {
    const { result, unmount } = renderHook(() => useSessionSync("u1"));

    result.current.announce({ type: "login", userId: "u1" });
    expect(channelState.post).toHaveBeenCalledWith({ type: "login", userId: "u1" });

    unmount();
    expect(channelState.close).toHaveBeenCalledTimes(1);
  });
});
