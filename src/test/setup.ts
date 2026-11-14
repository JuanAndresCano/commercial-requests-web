import "@testing-library/jest-dom";

// The app talks to Next.js only through @/lib/app-router. Outside a Next.js runtime there is no app
// router, so tests get an in-memory one (configured per test with <TestRouter> from src/test/router.tsx).
vi.mock("next/navigation", () => import("./next-navigation-mock"));
vi.mock("next/link", async () => ({ default: (await import("./mock-link")).MockLink }));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom 20 bundles nwsapi 2.2.x, whose `:modal` matcher recurses into jsdom's own `matches` until the
// stack overflows (the RangeError is swallowed, so the result is `false`, but each call costs ~200 ms).
// @floating-ui (Radix Popper: DropdownMenu, Popover, Select, Tooltip...) calls `el.matches(":modal")`
// many times per positioning pass, which made every open menu take 10-15 s. jsdom has no native modal
// <dialog> support, so `false` is exactly what the call already returned; this only skips the overflow.
const nativeMatches = Element.prototype.matches;
Element.prototype.matches = function matches(this: Element, selector: string) {
  return selector === ":modal" ? false : nativeMatches.call(this, selector);
};

window.HTMLElement.prototype.scrollIntoView = () => {};
window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.setPointerCapture = () => {};
window.HTMLElement.prototype.releasePointerCapture = () => {};
window.scrollTo = () => {};

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
