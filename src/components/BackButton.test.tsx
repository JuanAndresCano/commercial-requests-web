import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { BackButton } from "./BackButton";

describe("BackButton", () => {
  it("is a link to the given route with the given label", () => {
    render(
      <MemoryRouter>
        <BackButton to="/dashboard" label="Volver al tablero" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Volver al tablero/ })).toHaveAttribute("href", "/dashboard");
  });

  it("looks like a button (border, 36px height, readable text) and stays pinned while scrolling", () => {
    render(
      <MemoryRouter>
        <BackButton to="/dashboard" label="Volver al tablero" />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /Volver al tablero/ });
    expect(link.className).toMatch(/\bborder\b/);
    expect(link.className).toMatch(/\bh-9\b/);
    expect(link.className).toMatch(/\btext-sm\b/);
    expect(link.parentElement?.className).toMatch(/\bsticky\b/);
  });
});
