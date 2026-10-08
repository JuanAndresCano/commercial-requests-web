import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KanbanColumn } from "./KanbanColumn";

function renderColumn(props: Partial<React.ComponentProps<typeof KanbanColumn<string>>> = {}) {
  return render(
    <KanbanColumn<string>
      stage="en-experto"
      title="En Proceso"
      items={["a", "b"]}
      getKey={(i) => i}
      renderItem={(i) => <p>{i}</p>}
      {...props}
    />,
  );
}

describe("KanbanColumn header", () => {
  it("is plain text, not a button, when no onHeaderClick is given", () => {
    renderColumn();
    expect(screen.getByRole("heading", { name: "En Proceso" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("becomes a button that calls onHeaderClick", () => {
    const onHeaderClick = vi.fn();
    renderColumn({ onHeaderClick });
    const header = screen.getByRole("button", { name: /En Proceso/ });
    expect(header).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(header);
    expect(onHeaderClick).toHaveBeenCalledTimes(1);
  });

  it("reports the isolated state through aria-pressed", () => {
    renderColumn({ onHeaderClick: vi.fn(), isolated: true });
    expect(screen.getByRole("button", { name: /En Proceso/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("makes the whole header area clickable, description included", () => {
    const onHeaderClick = vi.fn();
    renderColumn({ onHeaderClick, description: "El Líder de Producto la está formulando" });
    const header = screen.getByRole("button", { name: /En Proceso/ });
    expect(header).toHaveClass("w-full");
    fireEvent.click(screen.getByText("El Líder de Producto la está formulando"));
    expect(onHeaderClick).toHaveBeenCalledTimes(1);
  });

  it("keeps 'Ver las 4 fases' as a separate button that fires once", () => {
    const onHeaderClick = vi.fn();
    const onExitIsolation = vi.fn();
    renderColumn({ onHeaderClick, onExitIsolation, isolated: true });
    fireEvent.click(screen.getByRole("button", { name: /Ver las 4 fases/ }));
    expect(onExitIsolation).toHaveBeenCalledTimes(1);
    expect(onHeaderClick).not.toHaveBeenCalled();
  });
});
