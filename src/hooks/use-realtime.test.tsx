import React from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { QueryClient, QueryClientProvider, type Query } from "@tanstack/react-query";
import { useRealtime } from "./use-realtime";
import { BACKUP_POLL_MS, REALTIME_BATCH_MS } from "@/lib/realtime";

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = FakeEventSource.CONNECTING;
  closed = false;

  constructor(
    public readonly url: string,
    public readonly init?: EventSourceInit,
  ) {
    FakeEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
    this.readyState = FakeEventSource.CLOSED;
  }

  // Test helpers: what the browser would do.
  open() {
    this.readyState = FakeEventSource.OPEN;
    this.onopen?.(new Event("open"));
  }
  message(data: string) {
    this.onmessage?.(new MessageEvent("message", { data }));
  }
  fail() {
    this.readyState = FakeEventSource.CLOSED;
    this.onerror?.(new Event("error"));
  }
}

const latest = () => FakeEventSource.instances[FakeEventSource.instances.length - 1];

let visibility: "visible" | "hidden" = "visible";
const setVisibility = (value: "visible" | "hidden") => {
  visibility = value;
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("useRealtime", () => {
  let client: QueryClient;
  let invalidate: MockInstance<QueryClient["invalidateQueries"]>;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const mount = (enabled = true) =>
    renderHook(({ on }) => useRealtime({ enabled: on }), { wrapper, initialProps: { on: enabled } });

  /** The query keys a given invalidateQueries call would mark stale among these samples. */
  const matched = (call: unknown[], keys: unknown[][]) => {
    const filters = call[0] as { predicate?: (q: Pick<Query, "queryKey">) => boolean };
    return keys.filter((queryKey) => filters.predicate?.({ queryKey }) ?? false);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    FakeEventSource.instances = [];
    visibility = "visible";
    vi.stubGlobal("EventSource", FakeEventSource);
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    client = new QueryClient();
    invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("opens the stream with the session cookie and reports it live once open", () => {
    const { result } = mount();

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(latest().url).toMatch(/\/events$/);
    expect(latest().init).toEqual({ withCredentials: true });
    expect(result.current).toBe("connecting");

    act(() => latest().open());

    expect(result.current).toBe("live");
  });

  it("does not open anything while disabled (no session)", () => {
    const { result } = mount(false);

    expect(FakeEventSource.instances).toHaveLength(0);
    expect(result.current).toBe("off");
  });

  it("groups a burst of events into one invalidation of the affected queries", () => {
    mount();
    act(() => latest().open());

    act(() => {
      latest().message('{"proposalId":"p-1","type":"status"}');
      latest().message('{"proposalId":"p-2","type":"costing"}');
      latest().message('{"proposalId":"p-1","type":"info"}');
    });
    expect(invalidate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(REALTIME_BATCH_MS);
    });

    expect(invalidate).toHaveBeenCalledTimes(1);
    const keys = [
      ["requests", {}],
      ["requests", "p-1"],
      ["requests", "p-2"],
      ["requests", "p-9"],
      ["dashboard-metrics"],
      ["nodes"],
    ];
    expect(matched(invalidate.mock.calls[0], keys)).toEqual([
      ["requests", {}],
      ["requests", "p-1"],
      ["requests", "p-2"],
      ["dashboard-metrics"],
    ]);
  });

  it("ignores malformed messages", () => {
    mount();
    act(() => latest().open());

    act(() => {
      latest().message("not json");
      vi.advanceTimersByTime(REALTIME_BATCH_MS * 2);
    });

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("falls back to polling every few seconds when the connection drops, then reconnects with backoff", () => {
    const { result } = mount();
    act(() => latest().open());

    act(() => latest().fail());
    expect(result.current).toBe("reconnecting");
    expect(latest().closed).toBe(true);

    invalidate.mockClear();
    act(() => {
      vi.advanceTimersByTime(BACKUP_POLL_MS);
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["requests"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-metrics"] });

    // The first retry is due about one second after the failure (+/-20 %), so by now a
    // second stream was tried; make it fail too and the next retry waits longer.
    expect(FakeEventSource.instances.length).toBeGreaterThanOrEqual(2);
  });

  it("goes back to live, stops the fallback polling and refreshes once when it reconnects", () => {
    const { result } = mount();
    act(() => latest().open());
    act(() => latest().fail());

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    const retry = latest();
    expect(retry.closed).toBe(false);
    expect(FakeEventSource.instances).toHaveLength(2);

    invalidate.mockClear();
    act(() => retry.open());

    expect(result.current).toBe("live");
    // Whatever happened while offline is fetched once.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["requests"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-metrics"] });

    invalidate.mockClear();
    act(() => {
      vi.advanceTimersByTime(BACKUP_POLL_MS * 3);
    });
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("keeps retrying with a growing delay while the server stays down", () => {
    mount();
    act(() => latest().open());
    act(() => latest().fail());

    const count = () => FakeEventSource.instances.length;
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(count()).toBe(2);
    act(() => latest().fail());

    // Second failure: the delay doubles (2 s +/-20 %), so 1 s later nothing new yet.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(count()).toBe(2);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(count()).toBe(3);
  });

  it("retries right away when the browser comes back online", () => {
    mount();
    act(() => latest().open());
    act(() => latest().fail());
    expect(FakeEventSource.instances).toHaveLength(1);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(FakeEventSource.instances).toHaveLength(2);
  });

  it("closes the stream and stops polling while the tab is hidden, and refreshes on return", () => {
    const { result } = mount();
    act(() => latest().open());
    const first = latest();

    act(() => setVisibility("hidden"));
    expect(first.closed).toBe(true);
    expect(result.current).toBe("paused");

    invalidate.mockClear();
    act(() => {
      vi.advanceTimersByTime(BACKUP_POLL_MS * 4);
    });
    expect(invalidate).not.toHaveBeenCalled();
    expect(FakeEventSource.instances).toHaveLength(1);

    act(() => setVisibility("visible"));
    expect(FakeEventSource.instances).toHaveLength(2);
    expect(result.current).toBe("connecting");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["requests"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-metrics"] });
  });

  it("does not poll in the background while reconnecting with the tab hidden", () => {
    mount();
    act(() => latest().open());
    act(() => latest().fail());
    act(() => setVisibility("hidden"));

    invalidate.mockClear();
    act(() => {
      vi.advanceTimersByTime(BACKUP_POLL_MS * 4);
    });

    expect(invalidate).not.toHaveBeenCalled();
    // The pending retry was cancelled with the pause: no new stream either.
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("closes everything when the session ends (disabled) and when unmounted", () => {
    const { result, rerender, unmount } = mount();
    act(() => latest().open());
    act(() => latest().fail());
    const stream = latest();

    rerender({ on: false });
    expect(result.current).toBe("off");
    expect(stream.closed).toBe(true);

    invalidate.mockClear();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(invalidate).not.toHaveBeenCalled();
    expect(FakeEventSource.instances).toHaveLength(1);

    rerender({ on: true });
    act(() => latest().open());
    const reopened = latest();
    unmount();
    expect(reopened.closed).toBe(true);
  });

  it("drops a batch that was still waiting when it is unmounted", () => {
    const { unmount } = mount();
    act(() => latest().open());
    act(() => latest().message('{"proposalId":"p-1","type":"status"}'));

    unmount();
    act(() => {
      vi.advanceTimersByTime(REALTIME_BATCH_MS * 2);
    });

    expect(invalidate).not.toHaveBeenCalled();
  });
});
