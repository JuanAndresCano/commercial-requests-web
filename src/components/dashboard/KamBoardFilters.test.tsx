import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KamBoardFilters } from "./KamBoardFilters";
import { EMPTY_KAM_BOARD_FILTERS } from "@/lib/kam-board-filters";

const options = {
  productLeaders: ["Ana Ruiz", "Carlos Gómez"],
  companies: ["Bancolombia", "Carvajal"],
  types: ["Capacitación", "Consultoría"],
};

describe("KamBoardFilters", () => {
  it("renders the three filters with the loaded options", () => {
    render(
      <KamBoardFilters filters={EMPTY_KAM_BOARD_FILTERS} options={options} onChange={vi.fn()} onClear={vi.fn()} />,
    );
    expect(screen.getByLabelText("Filtrar por líder de producto")).toHaveDisplayValue("Todos los líderes");
    expect(screen.getByLabelText("Filtrar por empresa")).toHaveDisplayValue("Todas las empresas");
    expect(screen.getByLabelText("Filtrar por tipo de solicitud")).toHaveDisplayValue("Todos los tipos");
    expect(screen.getByRole("option", { name: "Carvajal" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Quitar filtros/i })).not.toBeInTheDocument();
  });

  it("emits the new selection keeping the other filters", () => {
    const onChange = vi.fn();
    render(
      <KamBoardFilters
        filters={{ ...EMPTY_KAM_BOARD_FILTERS, company: "Carvajal" }}
        options={options}
        onChange={onChange}
        onClear={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Filtrar por tipo de solicitud"), { target: { value: "Consultoría" } });
    expect(onChange).toHaveBeenCalledWith({ productLeader: "", company: "Carvajal", type: "Consultoría" });
  });

  it("offers to clear only when a filter is active", () => {
    const onClear = vi.fn();
    render(
      <KamBoardFilters
        filters={{ ...EMPTY_KAM_BOARD_FILTERS, type: "Consultoría" }}
        options={options}
        onChange={vi.fn()}
        onClear={onClear}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Quitar filtros/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
