import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, systemTheme, useTheme } from "./ThemeContext";

const realMatchMedia = window.matchMedia;

function setSystemDark(dark: boolean) {
  window.matchMedia = ((query: string) => ({ matches: dark, media: query })) as typeof window.matchMedia;
}

function mountProvider() {
  const ref: { current: ReturnType<typeof useTheme> | null } = { current: null };
  function Probe() {
    ref.current = useTheme();
    return null;
  }
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  return ref as { current: ReturnType<typeof useTheme> };
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
  });
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it("defaults to light mode when nothing is stored", () => {
    setSystemDark(true);
    const theme = mountProvider();
    expect(theme.current.theme).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("prefers the stored choice from localStorage", () => {
    window.localStorage.setItem("icesi_theme_mode", "dark");
    expect(mountProvider().current.theme).toBe("dark");
  });

  it("toggles and persists the selected mode", () => {
    const theme = mountProvider();
    expect(theme.current.theme).toBe("light");
    act(() => theme.current.toggleTheme());
    expect(theme.current.theme).toBe("dark");
    expect(window.localStorage.getItem("icesi_theme_mode")).toBe("dark");
  });
});

describe("systemTheme", () => {
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it("falls back to light when matchMedia is unavailable", () => {
    // @ts-expect-error simulating an environment without matchMedia
    window.matchMedia = undefined;
    expect(systemTheme()).toBe("light");
  });
});
