import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfflineBanner } from "./OfflineBanner";

function setOnline(value: boolean) {
  vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(value);
  act(() => {
    window.dispatchEvent(new Event(value ? "online" : "offline"));
  });
}

describe("OfflineBanner (UX H9)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows nothing while there is a connection", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("announces the lost connection and removes the notice when it returns", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
    render(<OfflineBanner />);

    setOnline(false);
    expect(screen.getByRole("status")).toHaveTextContent(/Sin conexión/i);

    setOnline(true);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
