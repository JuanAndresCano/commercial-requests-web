import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AcademicNodeRankingTable } from "./AcademicNodeRankingTable";
import type { NodeDistributionEntry } from "@/lib/api/requests";

describe("AcademicNodeRankingTable Component", () => {
  const mockNodes: NodeDistributionEntry[] = [
    {
      nodeId: "node-1",
      name: "Gestión de Innovación",
      totalProposals: 116,
      deliveredTotalCop: 889668000,
      pipelineTotalCop: 4505763886,
      wonTotalCop: 889668000,
      wonCount: 20,
      winRatePercentage: 16.5,
      shareOfTotalSalesPercentage: 36.7,
      avgTechnicalDesignDays: 7,
      avgCostingDays: 2,
    },
    {
      nodeId: "node-2",
      name: "UX/UI",
      totalProposals: 29,
      deliveredTotalCop: 727889263,
      pipelineTotalCop: 480950000,
      wonTotalCop: 727889263,
      wonCount: 15,
      winRatePercentage: 60.2,
      shareOfTotalSalesPercentage: 30.1,
      avgTechnicalDesignDays: 5,
      avgCostingDays: 4,
    },
    {
      nodeId: "node-3",
      name: "IA+ Tech Digital",
      totalProposals: 132,
      deliveredTotalCop: 657290540,
      pipelineTotalCop: 2829909600,
      wonTotalCop: 657290540,
      wonCount: 25,
      winRatePercentage: 18.9,
      shareOfTotalSalesPercentage: 27.2,
      avgTechnicalDesignDays: 9,
      avgCostingDays: 1,
    },
  ];

  it("renders the table title, description and count of evaluated nodes", () => {
    render(<AcademicNodeRankingTable nodeDistribution={mockNodes} totalCenterWonCop={2421233803} />);

    expect(screen.getByTestId("academic-node-ranking-table")).toBeInTheDocument();
    expect(screen.getByText(/Ranking Financiero de Nodos Temáticos & Fábrica Académica/i)).toBeInTheDocument();
    expect(screen.getByText("3 líneas evaluadas")).toBeInTheDocument();
  });

  it("displays node rows with their respective financial metrics and days", () => {
    render(<AcademicNodeRankingTable nodeDistribution={mockNodes} totalCenterWonCop={2421233803} />);

    // Node names
    expect(screen.getByText("Gestión de Innovación")).toBeInTheDocument();
    expect(screen.getByText("UX/UI")).toBeInTheDocument();
    expect(screen.getByText("IA+ Tech Digital")).toBeInTheDocument();

    // Proposal counts
    expect(screen.getByText("116")).toBeInTheDocument();
    expect(screen.getByText("29")).toBeInTheDocument();
    expect(screen.getByText("132")).toBeInTheDocument();

    // Win rates and shares
    expect(screen.getByText("16.5%")).toBeInTheDocument();
    expect(screen.getByText("60.2%")).toBeInTheDocument();
    expect(screen.getByText("36.7%")).toBeInTheDocument();
    expect(screen.getByText("30.1%")).toBeInTheDocument();

    // Days in technical design and costing
    expect(screen.getByText("7d")).toBeInTheDocument();
    expect(screen.getByText("2d")).toBeInTheDocument();
    expect(screen.getByText("5d")).toBeInTheDocument();
    expect(screen.getByText("4d")).toBeInTheDocument();
  });

  it("renders the institutional footer with aggregate totals", () => {
    render(<AcademicNodeRankingTable nodeDistribution={mockNodes} totalCenterWonCop={2421233803} />);

    expect(screen.getByText("Total Fábrica Académica Icesi")).toBeInTheDocument();
    // Total proposals: 116 + 29 + 132 = 277
    expect(screen.getByText("277")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText(/7d prom/i)).toBeInTheDocument();
    expect(screen.getByText(/2.3d prom/i)).toBeInTheDocument();
  });
});
