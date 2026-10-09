import { Component, createContext, useContext, useLayoutEffect, useRef, type ReactNode } from "react";
import {
  MOTION_EASING,
  MOTION_TIMING,
  enterKeyframes,
  flyKeyframes,
  leaveKeyframes,
  moveKeyframes,
  planBoardMotion,
  prefersReducedMotion,
  type MotionBox,
} from "@/lib/board-motion";

interface BoardMotionApi {
  register: (id: string, group: string, element: HTMLElement) => void;
  unregister: (id: string, element: HTMLElement) => void;
}

const BoardMotionContext = createContext<BoardMotionApi | null>(null);

interface BoardMotionProps {
  /**
   * Anything that rearranges the board by the user's choice (search, filters, isolating a
   * column, switching view). When it changes between two updates nothing is animated: only
   * data changes (a card arriving, leaving or changing column) are worth showing.
   */
  layoutKey?: string;
  children: ReactNode;
}

interface Snapshot {
  boxes: Map<string, MotionBox>;
  layoutKey?: string;
}

const canAnimate = () => typeof Element !== "undefined" && typeof Element.prototype.animate === "function";

/**
 * Animates the cards of a board with FLIP (First, Last, Invert, Play): before React touches the
 * DOM it measures every card, afterwards it measures them again and plays only the difference
 * with transforms. Cards that changed column fly above the board (columns clip their content),
 * new cards fade and scale in, cards that left fade out as a ghost copy. Wrap the columns in
 * this component and each card in a MotionItem.
 *
 * It is a class on purpose: getSnapshotBeforeUpdate is the one hook that runs after render and
 * before the DOM changes, which is exactly when the "First" positions can be read.
 */
export class BoardMotion extends Component<BoardMotionProps, Record<string, never>, Snapshot> {
  private readonly elements = new Map<string, { element: HTMLElement; group: string }>();
  /** Elements of cards that unmounted in this update, kept to draw their goodbye. */
  private readonly detached = new Map<string, HTMLElement>();
  /** In-place animations still running; cancelled before measuring so layout reads are true. */
  private running: Animation[] = [];

  private readonly api: BoardMotionApi = {
    register: (id, group, element) => {
      this.elements.set(id, { element, group });
    },
    unregister: (id, element) => {
      if (this.elements.get(id)?.element === element) this.elements.delete(id);
      this.detached.set(id, element);
    },
  };

  private measure(): Map<string, MotionBox> {
    const boxes = new Map<string, MotionBox>();
    for (const [id, { element, group }] of this.elements) {
      const rect = element.getBoundingClientRect();
      boxes.set(id, {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
        group,
      });
    }
    return boxes;
  }

  getSnapshotBeforeUpdate(prevProps: BoardMotionProps): Snapshot | null {
    // Measured with any running animation included: a card caught mid-slide continues from
    // where the user sees it.
    return { boxes: this.measure(), layoutKey: prevProps.layoutKey };
  }

  componentDidUpdate(_prevProps: BoardMotionProps, _prevState: unknown, snapshot: Snapshot | undefined) {
    const detached = new Map(this.detached);
    this.detached.clear();
    if (!snapshot) return;

    const running = this.running;
    this.running = [];
    running.forEach((animation) => animation.cancel());

    if (
      snapshot.layoutKey !== this.props.layoutKey ||
      !canAnimate() ||
      prefersReducedMotion() ||
      document.visibilityState === "hidden"
    ) {
      return;
    }

    const after = this.measure();
    const plan = planBoardMotion(snapshot.boxes, after);

    for (const id of plan.entering) {
      this.play(this.elements.get(id)?.element, enterKeyframes(), MOTION_TIMING.enter);
    }

    for (const move of plan.moved) {
      const element = this.elements.get(move.id)?.element;
      if (!element) continue;
      if (move.crossGroup) {
        this.fly(element, move.dx, move.dy);
      } else {
        this.play(element, moveKeyframes(move.dx, move.dy), MOTION_TIMING.move);
      }
    }

    for (const id of plan.leaving) {
      const element = detached.get(id);
      const box = snapshot.boxes.get(id);
      if (element && box) this.fadeOutGhost(element, box);
    }
  }

  private play(element: HTMLElement | undefined, keyframes: Keyframe[], duration: number) {
    if (!element) return;
    this.running.push(element.animate(keyframes, { duration, easing: MOTION_EASING }));
  }

  private makeGhost(source: HTMLElement, left: number, top: number, width: number, height: number): HTMLElement {
    const ghost = source.cloneNode(true) as HTMLElement;
    ghost.removeAttribute("data-motion-id");
    ghost.setAttribute("data-motion-ghost", "");
    ghost.setAttribute("aria-hidden", "true");
    ghost.setAttribute("inert", "");
    Object.assign(ghost.style, {
      position: "fixed",
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      margin: "0",
      zIndex: "60",
      pointerEvents: "none",
    });
    document.body.appendChild(ghost);
    return ghost;
  }

  private removeWhenDone(ghost: HTMLElement, animation: Animation) {
    const remove = () => ghost.remove();
    animation.onfinish = remove;
    animation.oncancel = remove;
  }

  private fly(element: HTMLElement, dx: number, dy: number) {
    const rect = element.getBoundingClientRect();
    const duration = MOTION_TIMING.move + 80;
    const ghost = this.makeGhost(element, rect.left, rect.top, rect.width, rect.height);
    this.removeWhenDone(ghost, ghost.animate(flyKeyframes(dx, dy), { duration, easing: MOTION_EASING }));
    // The real card stays invisible while its copy travels, then simply is there.
    element.animate([{ opacity: 0 }, { opacity: 0 }], { duration });
  }

  private fadeOutGhost(element: HTMLElement, box: MotionBox) {
    const ghost = this.makeGhost(element, box.x - window.scrollX, box.y - window.scrollY, box.width, box.height);
    this.removeWhenDone(
      ghost,
      ghost.animate(leaveKeyframes(), { duration: MOTION_TIMING.leave, easing: MOTION_EASING, fill: "forwards" }),
    );
  }

  render() {
    return <BoardMotionContext.Provider value={this.api}>{this.props.children}</BoardMotionContext.Provider>;
  }
}

/** Wraps one card so the surrounding BoardMotion can track it. Harmless outside a board. */
export function MotionItem({ id, group, children }: { id: string; group: string; children: ReactNode }) {
  const api = useContext(BoardMotionContext);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!api || !element) return;
    api.register(id, group, element);
    return () => api.unregister(id, element);
  }, [api, id, group]);

  return (
    <div ref={ref} data-motion-id={id} className="h-full">
      {children}
    </div>
  );
}
