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
});
