import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { CompanySelectCombobox } from "./CompanySelectCombobox";

const MOCK_COMPANIES = [
  { id: "c1", name: "Hospital Regional del Pacífico", nit: "9011372487" },
  { id: "c2", name: "Bancolombia S.A.", nit: "890903938" },
  { id: "c3", name: "Manuelita S.A.", nit: "890300123" },
];

describe("CompanySelectCombobox", () => {
  it("renders with clean selected company name without NIT or COP in the trigger button", () => {
    render(<CompanySelectCombobox companies={MOCK_COMPANIES} selectedCompanyId="c1" onSelect={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: "Seleccionar empresa aliada" });
    expect(trigger).toHaveTextContent("Hospital Regional del Pacífico");
    expect(trigger).not.toHaveTextContent("9011372487");
    expect(trigger).not.toHaveTextContent("COP");
  });

  it("opens menu and filters companies by fuzzy name search", () => {
    const onSelect = vi.fn();
    render(<CompanySelectCombobox companies={MOCK_COMPANIES} selectedCompanyId="c1" onSelect={onSelect} />);

    const trigger = screen.getByRole("button", { name: "Seleccionar empresa aliada" });
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText("Buscar por nombre o NIT...");
    expect(searchInput).toBeInTheDocument();

    // Type "banco"
    fireEvent.change(searchInput, { target: { value: "banco" } });

    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByText("Bancolombia S.A.")).toBeInTheDocument();
    expect(within(listbox).queryByText("Hospital Regional del Pacífico")).not.toBeInTheDocument();

    // Click "Bancolombia S.A."
    fireEvent.click(within(listbox).getByText("Bancolombia S.A."));
    expect(onSelect).toHaveBeenCalledWith("c2");
  });

  it("filters companies by NIT query", () => {
    const onSelect = vi.fn();
    render(<CompanySelectCombobox companies={MOCK_COMPANIES} selectedCompanyId="c1" onSelect={onSelect} />);

    const trigger = screen.getByRole("button", { name: "Seleccionar empresa aliada" });
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText("Buscar por nombre o NIT...");
    fireEvent.change(searchInput, { target: { value: "890300" } });

    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByText("Manuelita S.A.")).toBeInTheDocument();
    expect(within(listbox).queryByText("Hospital Regional del Pacífico")).not.toBeInTheDocument();
  });
});
