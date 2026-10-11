/**
 * Pure logic of the board animations (FLIP): given where every card was before an update
 * and where it is after, which ones come in, go out or move. The DOM work lives in
 * components/kanban/BoardMotion.tsx; counters in AnimatedNumber.tsx.
 */

/** A card's box in PAGE coordinates (scroll included), tagged with the column it sits in. */
export interface MotionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  group: string;
}

export interface MotionMove {
  id: string;
  /** Where the card was minus where it is now: the distance it has to travel back from. */
  dx: number;
  dy: number;
  /** It changed column (the animation flies above the board instead of sliding in place). */
  crossGroup: boolean;
}

export interface MotionPlan {
  entering: string[];
  leaving: string[];
  moved: MotionMove[];
}

export const MOTION_TIMING = {
  move: 320,
  enter: 260,
  leave: 200,
  count: 450,
} as const;

const MOVE_THRESHOLD_PX = 1;
const DEFAULT_MAX_ANIMATIONS = 40;

export function planBoardMotion(
  before: ReadonlyMap<string, MotionBox>,
  after: ReadonlyMap<string, MotionBox>,
  options: { maxAnimations?: number } = {},
): MotionPlan {
  // No previous state = first paint (or a freshly mounted board): nothing to animate from.
  if (before.size === 0) return { entering: [], leaving: [], moved: [] };

  const entering: string[] = [];
  const crossMoves: MotionMove[] = [];
  const shifts: MotionMove[] = [];
  for (const [id, now] of after) {
    const was = before.get(id);
    if (!was) {
      entering.push(id);
      continue;
    }
    const dx = was.x - now.x;
    const dy = was.y - now.y;
    if (was.group !== now.group) {
      crossMoves.push({ id, dx, dy, crossGroup: true });
    } else if (Math.abs(dx) >= MOVE_THRESHOLD_PX || Math.abs(dy) >= MOVE_THRESHOLD_PX) {
      shifts.push({ id, dx, dy, crossGroup: false });
    }
  }
  const leaving = [...before.keys()].filter((id) => !after.has(id));

  // Many simultaneous animations only cost frames: past the cap the rest simply snap.
  // A card changing column is the story, so it gets its animation first.
  let budget = options.maxAnimations ?? DEFAULT_MAX_ANIMATIONS;
  const take = <T>(items: T[]): T[] => {
    const kept = items.slice(0, Math.max(budget, 0));
    budget -= kept.length;
    return kept;
  };
  const keptCross = take(crossMoves);
  const keptEntering = take(entering);
  const keptLeaving = take(leaving);
  const keptShifts = take(shifts);

  return { entering: keptEntering, leaving: keptLeaving, moved: [...keptCross, ...keptShifts] };
}

export const moveKeyframes = (dx: number, dy: number): Keyframe[] => [
  { transform: `translate(${dx}px, ${dy}px)` },
  { transform: "translate(0, 0)" },
];

export const flyKeyframes = (dx: number, dy: number): Keyframe[] => [
  { transform: `translate(${dx}px, ${dy}px)`, boxShadow: "0 14px 30px rgba(15, 23, 42, 0.22)" },
  { transform: "translate(0, 0)", boxShadow: "0 0 0 rgba(15, 23, 42, 0)" },
];

export const enterKeyframes = (): Keyframe[] => [
  { opacity: 0, transform: "translateY(-8px) scale(0.96)" },
  { opacity: 1, transform: "translateY(0) scale(1)" },
];

export const leaveKeyframes = (): Keyframe[] => [
  { opacity: 1, transform: "scale(1)" },
  { opacity: 0, transform: "scale(0.96)" },
];

export const MOTION_EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

export const easeOutCubic = (progress: number): number => 1 - (1 - progress) ** 3;

/** The whole number shown `progress` (0..1) of the way from one counter value to the next. */
export function interpolateCount(from: number, to: number, progress: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return Math.round(from + (to - from) * easeOutCubic(clamped));
}

/** Users who asked the system for less motion get none of the above. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
