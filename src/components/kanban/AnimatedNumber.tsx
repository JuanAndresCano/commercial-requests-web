import { useEffect, useRef, useState } from "react";
import { MOTION_TIMING, interpolateCount, prefersReducedMotion } from "@/lib/board-motion";

/**
 * A counter that counts to its new value instead of jumping (stage totals going up and down
 * as cards arrive and move). Jumps straight to it when the user prefers reduced motion.
 */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  // What is on screen right now: a change mid-count continues from there, not from the old target.
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    if (prefersReducedMotion() || typeof requestAnimationFrame !== "function") {
      shownRef.current = value;
      setShown(value);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;
    const tick = () => {
      const progress = (performance.now() - startedAt) / MOTION_TIMING.count;
      const next = progress >= 1 ? value : interpolateCount(from, value, progress);
      shownRef.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={className}>{shown}</span>;
}
