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
});
