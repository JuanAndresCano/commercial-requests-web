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
