import React from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRequests } from "./use-requests";
import { useRequestDetail } from "./use-request-detail";
import { useDashboardMetrics } from "./use-dashboard-metrics";
import { requestsApi } from "@/lib/api/requests";
import { LIVE_REFRESH_MS } from "@/lib/live-refresh";

vi.mock("@/lib/api/requests", () => ({
  requestsApi: {
    list: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({ id: "p1" }),
    getDashboardMetrics: vi.fn().mockResolvedValue({ total: 0 }),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("live refresh between roles", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["the request list", () => useRequests(), () => requestsApi.list],
    ["the request detail", () => useRequestDetail("p1"), () => requestsApi.getById],
    ["the dashboard metrics", () => useDashboardMetrics(), () => requestsApi.getDashboardMetrics],
  ])("re-fetches %s on its own", async (_label, hook, fn) => {
    renderHook(hook, { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fn()).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(LIVE_REFRESH_MS + 100);
    });
    expect(fn()).toHaveBeenCalledTimes(2);
  });
});
