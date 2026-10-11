import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CenterFields } from "./CenterFields";

describe("CenterFields: the leader types the center and the cost center (C-07)", () => {
  it("shows two optional text inputs with the stored values", () => {
    render(<CenterFields center="Eduteka" costCenter="CC-1234" editable onSave={vi.fn()} />);
    expect(screen.getByLabelText("Centro")).toHaveValue("Eduteka");
    expect(screen.getByLabelText("CENCO (centro de costos)")).toHaveValue("CC-1234");
  });

  it("starts empty and with nothing to save", () => {
    render(<CenterFields editable onSave={vi.fn()} />);
    expect(screen.getByLabelText("Centro")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Guardar centro" })).toBeDisabled();
  });

  it("saves only what changed", () => {
    const onSave = vi.fn();
    render(<CenterFields center="OEM" editable onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("CENCO (centro de costos)"), { target: { value: "CC-77" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar centro" }));
    expect(onSave).toHaveBeenCalledWith({ costCenter: "CC-77" });
  });

  it("clears a field that was emptied", () => {
    const onSave = vi.fn();
    render(<CenterFields center="OEM" costCenter="CC-1" editable onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Centro"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar centro" }));
    expect(onSave).toHaveBeenCalledWith({ center: null });
  });

  it("shows the KAM the values as read-only text, with no inputs and no button", () => {
    render(<CenterFields center="Eduteka" costCenter="CC-1234" editable={false} onSave={vi.fn()} />);
    expect(screen.getByText("Eduteka")).toBeInTheDocument();
    expect(screen.getByText("CC-1234")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the KAM only the field that has a value", () => {
    render(<CenterFields center="OEM" editable={false} onSave={vi.fn()} />);
    expect(screen.getByText("Centro")).toBeInTheDocument();
    expect(screen.queryByText("CENCO (centro de costos)")).not.toBeInTheDocument();
  });

  it("shows the KAM nothing at all when there is no center", () => {
    const { container } = render(<CenterFields editable={false} onSave={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
