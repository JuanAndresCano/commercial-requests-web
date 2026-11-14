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

  it("restores dark mode when remembered in localStorage", () => {
    window.localStorage.setItem("icesi_theme_mode", "dark");
    const theme = mountProvider();
    expect(theme.current.theme).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("toggles dark mode and persists the preference in localStorage", () => {
    const theme = mountProvider();
    expect(theme.current.theme).toBe("light");
    act(() => theme.current.toggleTheme());
    expect(theme.current.theme).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("icesi_theme_mode")).toBe("dark");

    act(() => theme.current.toggleTheme());
    expect(theme.current.theme).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(window.localStorage.getItem("icesi_theme_mode")).toBe("light");
  });
});

describe("systemTheme", () => {
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it("defaults to institutional light mode", () => {
    expect(systemTheme()).toBe("light");
  });
});
