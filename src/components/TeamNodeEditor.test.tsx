import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamNodeEditor } from "./TeamNodeEditor";

const nodeOptions = [
  { id: "n-ia", label: "Inteligencia Artificial" },
  { id: "n-salud", label: "Salud Global" },
];

// The editor uses a native <select> on purpose: a Radix Select left open slows the whole jsdom worker.
describe("TeamNodeEditor (C-06)", () => {
  it("shows Sin nodo when the request has none", () => {
    render(
      <TeamNodeEditor nodeName={null} nodeId={null} nodeOptions={nodeOptions} editable={false} onSave={vi.fn()} />,
    );
    expect(screen.getByText("Nodo Temático")).toBeInTheDocument();
    expect(screen.getByText("Sin nodo")).toBeInTheDocument();
  });

  it("shows the node name and no way to edit it for a viewer who cannot", () => {
    render(
      <TeamNodeEditor
        nodeName="Inteligencia Artificial"
        nodeId="n-ia"
        nodeOptions={nodeOptions}
        editable={false}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText("Inteligencia Artificial")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("puts a node on a request that had none", () => {
    const onSave = vi.fn();
    render(<TeamNodeEditor nodeName={null} nodeId={null} nodeOptions={nodeOptions} editable onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Cambiar nodo temático" }));
    expect(screen.getByRole("button", { name: "Guardar nodo" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nodo temático"), { target: { value: "n-salud" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nodo" }));
    expect(onSave).toHaveBeenCalledWith({ nodeId: "n-salud" });
  });

  it("removes the node by choosing Sin nodo", () => {
    const onSave = vi.fn();
    render(
      <TeamNodeEditor nodeName="Salud Global" nodeId="n-salud" nodeOptions={nodeOptions} editable onSave={onSave} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cambiar nodo temático" }));
    const select = screen.getByLabelText("Nodo temático") as HTMLSelectElement;
    expect(select.value).toBe("n-salud");
    fireEvent.change(select, { target: { value: "__none__" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nodo" }));
    expect(onSave).toHaveBeenCalledWith({ nodeId: null });
  });

  it("closes the editor without saving when cancelled", () => {
    const onSave = vi.fn();
    render(
      <TeamNodeEditor nodeName="Salud Global" nodeId="n-salud" nodeOptions={nodeOptions} editable onSave={onSave} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cambiar nodo temático" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByLabelText("Nodo temático")).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("keeps the select disabled while the nodes load", () => {
    render(<TeamNodeEditor nodeName={null} nodeId={null} editable onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Cambiar nodo temático" }));
    expect(screen.getByLabelText("Nodo temático")).toBeDisabled();
  });
});
