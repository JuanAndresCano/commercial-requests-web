import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StageTimeSection } from "./StageTimeSection";
import type { StageTimeRow } from "@/lib/stage-time";

const rows: StageTimeRow[] = [
  { stage: "nueva", label: "Entregada al líder", days: 2, current: false },
  { stage: "en-experto", label: "En Proceso", days: 5, current: false },
  { stage: "en-costeo", label: "Lista para Entregar", days: 0, current: true },
  { stage: "entregada", label: "Entregada", days: null, current: false },
];

describe("StageTimeSection (Tiempo por etapa)", () => {
  it("lists the accumulated days of each stage with the role labels", () => {
    render(<StageTimeSection rows={rows} />);
    expect(screen.getByText("Tiempo por etapa")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([
      "Entregada al líder2 días",
      "En Proceso5 días",
      "Lista para Entregarmenos de 1 día · actual",
      "Entregada—",
    ]);
  });

  it("marks the current stage", () => {
    render(<StageTimeSection rows={rows} />);
    expect(
      within(screen.getByText("Lista para Entregar").closest("li") as HTMLElement).getByText(/actual/),
    ).toBeInTheDocument();
  });

  it("shows nothing when there is no history", () => {
    const { container } = render(<StageTimeSection rows={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
