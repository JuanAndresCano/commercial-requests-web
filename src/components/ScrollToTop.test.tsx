import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRouter } from "@/lib/app-router";
import { TestRouter } from "@/test/router";
import { ScrollToTop } from "./ScrollToTop";

let navigate: ReturnType<typeof useRouter>;
function Capture() {
  navigate = useRouter();
  return null;
}

describe("ScrollToTop", () => {
  afterEach(() => vi.restoreAllMocks());

  it("scrolls to the top on mount and on every route change, including going back", () => {
    const scrollTo = vi.spyOn(window, "scrollTo");
    render(
      <TestRouter route="/dashboard">
        <ScrollToTop />
        <Capture />
      </TestRouter>,
    );
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);

    act(() => navigate.push("/solicitudes/REQ-1"));
    expect(scrollTo).toHaveBeenCalledTimes(2);

    act(() => navigate.back());
    expect(scrollTo).toHaveBeenCalledTimes(3);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it("turns the browser scroll restoration off so the old position never comes back", () => {
    window.history.scrollRestoration = "auto";
    render(
      <TestRouter route="/dashboard">
        <ScrollToTop />
      </TestRouter>,
    );
    expect(window.history.scrollRestoration).toBe("manual");
  });
});
