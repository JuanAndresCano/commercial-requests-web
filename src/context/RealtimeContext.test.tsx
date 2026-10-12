import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RealtimeProvider, useRealtimeStatus } from "./RealtimeContext";

const auth = vi.hoisted(() => ({ value: { status: "authenticated", sessionConflict: null as string | null } }));
const useRealtime = vi.hoisted(() => vi.fn());

vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth.value }));
vi.mock("@/hooks/use-realtime", () => ({ useRealtime }));

function Probe() {
  return <p>estado: {useRealtimeStatus()}</p>;
}

describe("RealtimeProvider", () => {
  beforeEach(() => {
    useRealtime.mockReset().mockReturnValue("live");
    auth.value = { status: "authenticated", sessionConflict: null };
  });

  it("opens the channel for an authenticated session and shares its state", () => {
    render(
      <RealtimeProvider>
        <Probe />
      </RealtimeProvider>,
    );

    expect(useRealtime).toHaveBeenCalledWith({ enabled: true });
    expect(screen.getByText("estado: live")).toBeInTheDocument();
  });

  it.each([
    ["while the session is loading", { status: "loading", sessionConflict: null }],
    ["when nobody is signed in", { status: "unauthenticated", sessionConflict: null }],
    ["when another tab changed the session (blocked tab)", { status: "authenticated", sessionConflict: "signed-out" }],
  ])("keeps the channel closed %s", (_label, value) => {
    auth.value = value;

    render(
      <RealtimeProvider>
        <Probe />
      </RealtimeProvider>,
    );

    expect(useRealtime).toHaveBeenCalledWith({ enabled: false });
  });

  it("reads as off without a provider", () => {
    render(<Probe />);

    expect(screen.getByText("estado: off")).toBeInTheDocument();
  });
});
