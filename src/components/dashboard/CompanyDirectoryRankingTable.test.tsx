import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompanyDirectoryRankingTable } from "./CompanyDirectoryRankingTable";
import type { CompanyListItem } from "@/lib/api/requests";

describe("CompanyDirectoryRankingTable Component", () => {
  const mockCompanies: CompanyListItem[] = [
    {
      id: "comp-1",
      name: "Alianza",
      nit: "900123456-1",
      sector: "Financiero",
      type: "PRIVADA",
      totalProposals: 20,
      deliveredCount: 8,
      deliveredTotalCop: 626011297,
      pipelineTotalCop: 399555000,
      wonTotalCop: 626011297,
      winRatePercentage: 61.0,
    },
    {
      id: "comp-2",
      name: "Banco W",
      nit: "890300279-4",
      sector: "Financiero",
      type: "PRIVADA",
      totalProposals: 7,
      deliveredCount: 4,
      deliveredTotalCop: 375968000,
      pipelineTotalCop: 46176000,
      wonTotalCop: 375968000,
      winRatePercentage: 89.1,
    },
    {
      id: "comp-3",
      name: "Chiper",
      nit: "901234567-8",
      sector: "Tecnología",
      type: "PRIVADA",
      totalProposals: 1,
      deliveredCount: 1,
      deliveredTotalCop: 294000000,
      pipelineTotalCop: 0,
      wonTotalCop: 294000000,
      winRatePercentage: 100.0,
    },
  ];

  it("renders directory table with title, search input and company rows", () => {
    const onSelect = vi.fn();
    render(<CompanyDirectoryRankingTable companies={mockCompanies} onSelectCompany={onSelect} />);

    expect(screen.getByTestId("company-directory-ranking-table")).toBeInTheDocument();
    expect(screen.getByText(/Directorio y Ranking Maestro de Cuentas Corporativas/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por razón social o nit/i)).toBeInTheDocument();

    expect(screen.getByText("Alianza")).toBeInTheDocument();
    expect(screen.getByText("Banco W")).toBeInTheDocument();
    expect(screen.getByText("Chiper")).toBeInTheDocument();
  });

  it("filters companies by typing in the search box", () => {
    const onSelect = vi.fn();
    render(<CompanyDirectoryRankingTable companies={mockCompanies} onSelectCompany={onSelect} />);

    const searchInput = screen.getByPlaceholderText(/buscar por razón social o nit/i);
    fireEvent.change(searchInput, { target: { value: "Chiper" } });

    expect(screen.getByText("Chiper")).toBeInTheDocument();
    expect(screen.queryByText("Alianza")).not.toBeInTheDocument();
    expect(screen.queryByText("Banco W")).not.toBeInTheDocument();
  });

  it("filters companies by sector select dropdown", () => {
    const onSelect = vi.fn();
    render(<CompanyDirectoryRankingTable companies={mockCompanies} onSelectCompany={onSelect} />);

    const sectorSelect = screen.getByLabelText(/filtrar por sector/i);
    fireEvent.change(sectorSelect, { target: { value: "Tecnología" } });

    expect(screen.getByText("Chiper")).toBeInTheDocument();
    expect(screen.queryByText("Alianza")).not.toBeInTheDocument();
  });

  it("calls onSelectCompany when clicking a row or the 360 button", () => {
    const onSelect = vi.fn();
    render(<CompanyDirectoryRankingTable companies={mockCompanies} onSelectCompany={onSelect} />);

    const buttons = screen.getAllByRole("button", { name: /ficha 360°/i });
    fireEvent.click(buttons[0]);

    expect(onSelect).toHaveBeenCalledWith("comp-1");
  });

  it("renders aggregate totals footer", () => {
    const onSelect = vi.fn();
    render(<CompanyDirectoryRankingTable companies={mockCompanies} onSelectCompany={onSelect} />);

    expect(screen.getByText(/Total Cartera \(3 empresas\)/i)).toBeInTheDocument();
    // 20 + 7 + 1 = 28 proposals
    expect(screen.getByText("28")).toBeInTheDocument();
  });

  it("sorts companies by name when selected in the sort dropdown", () => {
    const onSelect = vi.fn();
    render(<CompanyDirectoryRankingTable companies={mockCompanies} onSelectCompany={onSelect} />);

    const sortSelect = screen.getByLabelText(/ordenar empresas/i);
    fireEvent.change(sortSelect, { target: { value: "name-desc" } });

    const rows = screen.getAllByRole("row");
    // Row 0 is header, Row 1 should be Chiper (Z-A)
    expect(rows[1]).toHaveTextContent("Chiper");
  });

  it("handles pagination and page size changes for large company lists", () => {
    const onSelect = vi.fn();
    const twelveCompanies: CompanyListItem[] = Array.from({ length: 12 }, (_, i) => ({
      id: `comp-${i + 1}`,
      name: `Empresa ${String(i + 1).padStart(2, "0")}`,
      nit: `90000000${i}-1`,
      sector: "Servicios",
      type: "PRIVADA",
      totalProposals: i + 1,
      deliveredCount: 1,
      deliveredTotalCop: 10000000 * (i + 1),
      pipelineTotalCop: 0,
      wonTotalCop: 10000000 * (i + 1),
      winRatePercentage: 50,
    }));

    render(<CompanyDirectoryRankingTable companies={twelveCompanies} onSelectCompany={onSelect} />);

    // Default pageSize is 10, so Empresa 01-10 are on page 1
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByTestId("company-next-page")).toBeInTheDocument();

    // Advance to page 2
    fireEvent.click(screen.getByTestId("company-next-page"));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    // Change page size to 20
    const pageSizeSelect = screen.getByLabelText(/empresas por página/i);
    fireEvent.change(pageSizeSelect, { target: { value: "20" } });

    // Now all 12 are visible on 1 page
    expect(screen.getByTestId("company-pagination-counter")).toHaveTextContent("Mostrando 1 – 12 de 12 empresas");
  });
});
