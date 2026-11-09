import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductLeadersTable } from "./ProductLeadersTable";
import type { ProductLeaderEntry } from "@/lib/api/requests";

describe("ProductLeadersTable Component", () => {
  const mockLeaders: ProductLeaderEntry[] = [
    {
      leaderId: "leader-1",
      name: "Andrés Naranjo",
      email: "anaranjo@icesi.edu.co",
      totalAssigned: 108,
      quotedTotalCop: 5221001886,
      wonTotalCop: 848018000,
      wonCount: 22,
      winRatePercentage: 16.2,
      shareOfTotalSalesPercentage: 35.0,
    },
    {
      leaderId: "leader-2",
      name: "Néstor Tobar",
      email: "ntobar@icesi.edu.co",
      totalAssigned: 27,
      quotedTotalCop: 1142051297,
      wonTotalCop: 698201297,
      wonCount: 18,
      winRatePercentage: 61.1,
      shareOfTotalSalesPercentage: 28.8,
    },
  ];

  it("renders the table title, description and active leaders count", () => {
    render(<ProductLeadersTable productLeaders={mockLeaders} totalCenterWonCop={2421233803} />);

    expect(screen.getByTestId("product-leaders-table")).toBeInTheDocument();
    expect(screen.getByText(/Líderes de Producto — Responsables de la Creación de Oferta/i)).toBeInTheDocument();
    expect(screen.getByText("2 líderes activos")).toBeInTheDocument();
  });

  it("displays leader rows with names, assigned proposals and monetary figures", () => {
    render(<ProductLeadersTable productLeaders={mockLeaders} totalCenterWonCop={2421233803} />);

    expect(screen.getByText("Andrés Naranjo")).toBeInTheDocument();
    expect(screen.getByText("anaranjo@icesi.edu.co")).toBeInTheDocument();
    expect(screen.getByText("108")).toBeInTheDocument();
    expect(screen.getByText("16.2%")).toBeInTheDocument();

    expect(screen.getByText("Néstor Tobar")).toBeInTheDocument();
    expect(screen.getByText("ntobar@icesi.edu.co")).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText("61.1%")).toBeInTheDocument();
  });

  it("renders aggregate totals footer", () => {
    render(<ProductLeadersTable productLeaders={mockLeaders} totalCenterWonCop={2421233803} />);

    expect(screen.getByText("Total Dirección de Oferta Académica")).toBeInTheDocument();
    // Total assigned: 108 + 27 = 135
    expect(screen.getByText("135")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("handles empty list gracefully", () => {
    render(<ProductLeadersTable productLeaders={[]} totalCenterWonCop={0} />);

    expect(screen.getByText(/No hay líderes de producto asignados/i)).toBeInTheDocument();
  });
});
