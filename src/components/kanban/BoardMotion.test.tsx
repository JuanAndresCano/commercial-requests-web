import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BoardMotion, MotionItem } from "./BoardMotion";

type Columns = Record<string, string[]>;

function Board({ columns, layoutKey = "a" }: { columns: Columns; layoutKey?: string }) {
  return (
    <BoardMotion layoutKey={layoutKey}>
      {Object.entries(columns).map(([name, ids], index) => (
        <div key={name} data-column={name} data-column-index={index}>
          {ids.map((id) => (
            <MotionItem key={id} id={id} group={name}>
              <article>{`card ${id}`}</article>
            </MotionItem>
          ))}
        </div>
      ))}
    </BoardMotion>
  );
}

interface FakeAnimation {
  onfinish: (() => void) | null;
  oncancel: (() => void) | null;
  cancel: () => void;
}

describe("BoardMotion", () => {
  const originalMatchMedia = window.matchMedia;
  let animate: ReturnType<typeof vi.fn>;
  let animations: Array<{
    target: Element;
    keyframes: Keyframe[];
    options: KeyframeAnimationOptions;
    handle: FakeAnimation;
  }>;

  /** A tiny layout engine: columns side by side, cards stacked 130px apart. */
  const mockLayout = () =>
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const column = this.closest<HTMLElement>("[data-column]");
      if (!column || !this.hasAttribute("data-motion-id")) {
        return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) };
      }
      const left = Number(column.dataset.columnIndex) * 320;
      const top = Array.from(column.children).indexOf(this) * 130;
      return {
        left,
        top,
        right: left + 300,
        bottom: top + 120,
        width: 300,
        height: 120,
        x: left,
        y: top,
        toJSON: () => ({}),
      };
    });

  const animatedWrapper = (id: string) =>
    animations.filter((a) => (a.target as HTMLElement).getAttribute?.("data-motion-id") === id);

  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    animations = [];
    animate = vi.fn(function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
      const handle: FakeAnimation = { onfinish: null, oncancel: null, cancel: vi.fn() };
      animations.push({ target: this, keyframes, options, handle });
      return handle;
    });
    Object.defineProperty(Element.prototype, "animate", { configurable: true, writable: true, value: animate });
    mockLayout();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
    // @ts-expect-error cleaning the stub installed for these tests
    delete Element.prototype.animate;
    document.body.querySelectorAll("[data-motion-ghost]").forEach((n) => n.remove());
  });

  const base: Columns = { nueva: ["a", "b"], "en-experto": ["c"], "en-costeo": [] };

  it("does not animate the first paint", () => {
    render(<Board columns={base} />);

    expect(animate).not.toHaveBeenCalled();
  });

  it("does not animate when an update changes nothing", () => {
    const { rerender } = render(<Board columns={base} />);

    rerender(<Board columns={{ ...base }} />);

    expect(animate).not.toHaveBeenCalled();
  });

  it("fades a new card in", () => {
    const { rerender } = render(<Board columns={base} />);

    rerender(<Board columns={{ ...base, nueva: ["n", "a", "b"] }} />);

    const entering = animatedWrapper("n");
    expect(entering).toHaveLength(1);
    expect(entering[0].keyframes[0]).toMatchObject({ opacity: 0 });
    expect(entering[0].keyframes[1]).toMatchObject({ opacity: 1 });
  });

  it("slides the cards below a new one down instead of snapping", () => {
    const { rerender } = render(<Board columns={base} />);

    rerender(<Board columns={{ ...base, nueva: ["n", "a", "b"] }} />);

    // `a` was at y=0 and is now at y=130: it starts 130px above its new place.
    expect(animatedWrapper("a")[0].keyframes[0]).toMatchObject({ transform: "translate(0px, -130px)" });
    expect(animatedWrapper("b")[0].keyframes[0]).toMatchObject({ transform: "translate(0px, -130px)" });
  });

  it("flies a card that changed column above the board and hides the real one meanwhile", () => {
    const { rerender } = render(<Board columns={base} />);

    rerender(<Board columns={{ nueva: ["b"], "en-experto": ["c", "a"], "en-costeo": [] }} />);

    const ghost = document.body.querySelector<HTMLElement>("[data-motion-ghost]");
    expect(ghost).not.toBeNull();
    expect(ghost).toHaveAttribute("aria-hidden", "true");
    expect(ghost).toHaveTextContent("card a");
    expect(ghost!.style.position).toBe("fixed");

    const flight = animations.find((a) => a.target === ghost)!;
    // `a` went from column 0 / row 0 to column 1 / row 1.
    expect(flight.keyframes[0]).toMatchObject({ transform: "translate(-320px, -130px)" });

    const real = animatedWrapper("a");
    expect(real).toHaveLength(1);
    expect(real[0].keyframes.every((k) => k.opacity === 0)).toBe(true);

    flight.handle.onfinish?.();
    expect(document.body.querySelector("[data-motion-ghost]")).toBeNull();
  });

  it("fades out a card that left the board without cloning it twice", () => {
    const { rerender } = render(<Board columns={base} />);

    rerender(<Board columns={{ ...base, nueva: ["a"] }} />);

    const ghost = document.body.querySelector<HTMLElement>("[data-motion-ghost]");
    expect(ghost).toHaveTextContent("card b");
    const fade = animations.find((a) => a.target === ghost)!;
    expect(fade.keyframes[0]).toMatchObject({ opacity: 1 });
    expect(fade.keyframes[1]).toMatchObject({ opacity: 0 });

    fade.handle.onfinish?.();
    expect(document.body.querySelector("[data-motion-ghost]")).toBeNull();
  });

  it("skips every animation when the user prefers reduced motion", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    const { rerender } = render(<Board columns={base} />);

    rerender(<Board columns={{ nueva: ["n", "b"], "en-experto": ["c", "a"], "en-costeo": [] }} />);

    expect(animate).not.toHaveBeenCalled();
    expect(document.body.querySelector("[data-motion-ghost]")).toBeNull();
  });

  it("does not animate when the board layout itself changed (filters, isolating a column)", () => {
    const { rerender } = render(<Board columns={base} layoutKey="all" />);

    rerender(<Board columns={{ nueva: ["a"], "en-experto": [], "en-costeo": [] }} layoutKey="only-nueva" />);

    expect(animate).not.toHaveBeenCalled();
    expect(document.body.querySelector("[data-motion-ghost]")).toBeNull();
  });

  it("cancels a running animation before measuring again so positions stay true", () => {
    const { rerender } = render(<Board columns={base} />);
    rerender(<Board columns={{ ...base, nueva: ["n", "a", "b"] }} />);
    const running = animatedWrapper("a")[0].handle;

    rerender(<Board columns={{ ...base, nueva: ["n", "a", "b", "z"] }} />);

    expect(running.cancel).toHaveBeenCalled();
  });

  it("renders the cards normally outside a board (no provider)", () => {
    const { getByText } = render(
      <MotionItem id="solo" group="nueva">
        <article>solo card</article>
      </MotionItem>,
    );

    expect(getByText("solo card")).toBeInTheDocument();
  });

  it("works where the browser has no Web Animations API", () => {
    // @ts-expect-error simulating a browser without element.animate
    delete Element.prototype.animate;
    const { rerender } = render(<Board columns={base} />);

    expect(() =>
      rerender(<Board columns={{ nueva: ["b"], "en-experto": ["c", "a"], "en-costeo": [] }} />),
    ).not.toThrow();
  });
});
