import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedNumber } from "./AnimatedNumber";
import { MOTION_TIMING } from "@/lib/board-motion";

const reduceMotion = (reduce: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia;
};

describe("AnimatedNumber", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout"] });
    reduceMotion(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  const advance = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  it("shows the value at once on first render", () => {
    render(<AnimatedNumber value={3} />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("counts from the old value to the new one and lands exactly on it", () => {
    const { rerender } = render(<AnimatedNumber value={2} />);

    rerender(<AnimatedNumber value={10} />);
    advance(MOTION_TIMING.count / 2);
    const midway = Number(screen.getByText(/^\d+$/).textContent);
    expect(midway).toBeGreaterThan(2);
    expect(midway).toBeLessThan(10);

    advance(MOTION_TIMING.count);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("also counts down", () => {
    const { rerender } = render(<AnimatedNumber value={9} />);

    rerender(<AnimatedNumber value={4} />);
    advance(MOTION_TIMING.count / 2);
    const midway = Number(screen.getByText(/^\d+$/).textContent);
    expect(midway).toBeLessThan(9);
    expect(midway).toBeGreaterThan(4);

    advance(MOTION_TIMING.count);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("continues from what is on screen when the value changes again mid-count", () => {
    const { rerender } = render(<AnimatedNumber value={0} />);
    rerender(<AnimatedNumber value={20} />);
    advance(MOTION_TIMING.count / 2);
    const shown = Number(screen.getByText(/^\d+$/).textContent);

    rerender(<AnimatedNumber value={0} />);
    advance(16);
    const next = Number(screen.getByText(/^\d+$/).textContent);

    expect(next).toBeLessThanOrEqual(shown);
    advance(MOTION_TIMING.count * 2);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("jumps straight to the new value when the user asked for less motion", () => {
    reduceMotion(true);
    const { rerender } = render(<AnimatedNumber value={1} />);

    rerender(<AnimatedNumber value={7} />);

    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("does not update after being unmounted", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { rerender, unmount } = render(<AnimatedNumber value={1} />);
    rerender(<AnimatedNumber value={9} />);

    unmount();
    advance(MOTION_TIMING.count * 2);

    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
