import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MOTION_TIMING,
  easeOutCubic,
  enterKeyframes,
  flyKeyframes,
  interpolateCount,
  leaveKeyframes,
  moveKeyframes,
  planBoardMotion,
  prefersReducedMotion,
  type MotionBox,
} from "./board-motion";

const box = (x: number, y: number, group = "nueva", width = 300, height = 120): MotionBox => ({
  x,
  y,
  width,
  height,
  group,
});
const boxes = (entries: Record<string, MotionBox>) => new Map(Object.entries(entries));

describe("planBoardMotion", () => {
  it("is empty when nothing changed", () => {
    const state = boxes({ a: box(0, 0), b: box(0, 130) });

    expect(planBoardMotion(state, state)).toEqual({ entering: [], leaving: [], moved: [] });
  });

  it("detects cards that appear", () => {
    const plan = planBoardMotion(boxes({ a: box(0, 0) }), boxes({ a: box(0, 130), n: box(0, 0) }));

    expect(plan.entering).toEqual(["n"]);
    expect(plan.leaving).toEqual([]);
  });

  it("detects cards that disappear", () => {
    const plan = planBoardMotion(boxes({ a: box(0, 0), g: box(0, 130) }), boxes({ a: box(0, 0) }));

    expect(plan.leaving).toEqual(["g"]);
    expect(plan.entering).toEqual([]);
  });

  it("moves a card that changed column, with the distance it must travel", () => {
    const before = boxes({ a: box(0, 40, "nueva") });
    const after = boxes({ a: box(320, 10, "en-experto") });

    expect(planBoardMotion(before, after).moved).toEqual([{ id: "a", dx: -320, dy: 30, crossGroup: true }]);
  });

  it("moves a card that shifted inside its column because others came or left", () => {
    const before = boxes({ a: box(0, 0), b: box(0, 130) });
    const after = boxes({ a: box(0, 130), b: box(0, 0) });

    const plan = planBoardMotion(before, after);

    expect(plan.moved).toEqual([
      { id: "a", dx: 0, dy: -130, crossGroup: false },
      { id: "b", dx: 0, dy: 130, crossGroup: false },
    ]);
  });

  it("ignores sub-pixel shifts", () => {
    const plan = planBoardMotion(boxes({ a: box(0, 0) }), boxes({ a: box(0.4, 0.3) }));

    expect(plan.moved).toEqual([]);
  });

  it("treats a card that moved column but did not shift as moved too", () => {
    const plan = planBoardMotion(boxes({ a: box(0, 0, "nueva") }), boxes({ a: box(0, 0, "en-costeo") }));

    expect(plan.moved).toEqual([{ id: "a", dx: 0, dy: 0, crossGroup: true }]);
  });

  it("does nothing when there was no previous state (first paint)", () => {
    const plan = planBoardMotion(new Map(), boxes({ a: box(0, 0), b: box(0, 130) }));

    expect(plan).toEqual({ entering: [], leaving: [], moved: [] });
  });

  it("caps the animated cards, keeping column changes first", () => {
    const before = boxes({
      ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`s${i}`, box(0, i * 130)])),
      x: box(0, 2000, "nueva"),
    });
    const after = boxes({
      ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`s${i}`, box(0, i * 130 + 50)])),
      x: box(320, 0, "en-costeo"),
    });

    const plan = planBoardMotion(before, after, { maxAnimations: 3 });

    expect(plan.moved).toHaveLength(3);
    expect(plan.moved[0].id).toBe("x");
  });
});

describe("keyframes", () => {
  it("moves from the old position back to its place", () => {
    expect(moveKeyframes(-320, 30)).toEqual([
      { transform: "translate(-320px, 30px)" },
      { transform: "translate(0, 0)" },
    ]);
  });

  it("fades and scales a new card in", () => {
    const [from, to] = enterKeyframes();

    expect(from.opacity).toBe(0);
    expect(to.opacity).toBe(1);
    expect(from.transform).toContain("scale(");
  });

  it("fades a leaving card out", () => {
    const [from, to] = leaveKeyframes();

    expect(from.opacity).toBe(1);
    expect(to.opacity).toBe(0);
  });

  it("keeps every transition short", () => {
    for (const ms of Object.values(MOTION_TIMING)) {
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(600);
    }
  });
});

describe("counter transition", () => {
  it("eases out between 0 and 1", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it("starts at the old value and lands exactly on the new one", () => {
    expect(interpolateCount(3, 8, 0)).toBe(3);
    expect(interpolateCount(3, 8, 1)).toBe(8);
  });

  it("only shows whole numbers in between, going up or down", () => {
    for (const p of [0.1, 0.3, 0.6, 0.9]) {
      expect(Number.isInteger(interpolateCount(3, 8, p))).toBe(true);
      expect(interpolateCount(3, 8, p)).toBeGreaterThanOrEqual(3);
      expect(interpolateCount(3, 8, p)).toBeLessThanOrEqual(8);
      expect(interpolateCount(8, 3, p)).toBeGreaterThanOrEqual(3);
      expect(interpolateCount(8, 3, p)).toBeLessThanOrEqual(8);
    }
  });

  it("clamps progress outside 0..1", () => {
    expect(interpolateCount(0, 10, -1)).toBe(0);
    expect(interpolateCount(0, 10, 5)).toBe(10);
  });
});

describe("prefersReducedMotion", () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
  });

  it("follows the system setting", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");

    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(false);
  });

  it("is false where matchMedia does not exist", () => {
    // @ts-expect-error simulating an old environment without matchMedia
    window.matchMedia = undefined;
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("flyKeyframes", () => {
  it("lifts the card with a shadow while it crosses to its new column", () => {
    const [from, to] = flyKeyframes(-320, 30);

    expect(from.transform).toBe("translate(-320px, 30px)");
    expect(String(from.boxShadow)).not.toBe("none");
    expect(to.transform).toBe("translate(0, 0)");
  });
});
