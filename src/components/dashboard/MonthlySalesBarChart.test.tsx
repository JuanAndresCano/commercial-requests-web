import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonthlySalesBarChart } from "./MonthlySalesBarChart";
import type { MonthlyTrendsData } from "@/lib/api/requests";

const mockTrendsData: MonthlyTrendsData = {
  year: 2026,
  previousYear: 2025,
  annualTargetCop: 2516000000,
  annualTargetProposals: 45,
  totalQuotedCop: 18800000000,
  totalWonCop: 2420000000,
  totalWonCount: 64,
  annualCompliancePercentage: 96.2,
  monthlyData: [
    {
      month: 1,
      monthName: "Ene",
      quotedCop: 1200000000,
      wonCop: 150000000,
      pipelineCop: 1050000000,
      proposalsQuotedCount: 15,
      proposalsWonCount: 3,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 71.6,
    },
    {
      month: 2,
      monthName: "Feb",
      quotedCop: 1400000000,
      wonCop: 220000000,
      pipelineCop: 1180000000,
      proposalsQuotedCount: 18,
      proposalsWonCount: 5,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 105.0,
    },
    {
      month: 3,
      monthName: "Mar",
      quotedCop: 1800000000,
      wonCop: 310000000,
      pipelineCop: 1490000000,
      proposalsQuotedCount: 22,
      proposalsWonCount: 7,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 147.9,
    },
    {
      month: 4,
      monthName: "Abr",
      quotedCop: 1600000000,
      wonCop: 190000000,
      pipelineCop: 1410000000,
      proposalsQuotedCount: 20,
      proposalsWonCount: 4,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 90.6,
    },
    {
      month: 5,
      monthName: "May",
      quotedCop: 1500000000,
      wonCop: 210000000,
      pipelineCop: 1290000000,
      proposalsQuotedCount: 19,
      proposalsWonCount: 5,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 100.2,
    },
    {
      month: 6,
      monthName: "Jun",
      quotedCop: 1700000000,
      wonCop: 250000000,
      pipelineCop: 1450000000,
      proposalsQuotedCount: 21,
      proposalsWonCount: 6,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 119.3,
    },
    {
      month: 7,
      monthName: "Jul",
      quotedCop: 1300000000,
      wonCop: 180000000,
      pipelineCop: 1120000000,
      proposalsQuotedCount: 16,
      proposalsWonCount: 4,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 85.9,
    },
    {
      month: 8,
      monthName: "Ago",
      quotedCop: 1450000000,
      wonCop: 205000000,
      pipelineCop: 1245000000,
      proposalsQuotedCount: 17,
      proposalsWonCount: 5,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 97.8,
    },
    {
      month: 9,
      monthName: "Sep",
      quotedCop: 1900000000,
      wonCop: 280000000,
      pipelineCop: 1620000000,
      proposalsQuotedCount: 24,
      proposalsWonCount: 7,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 133.6,
    },
    {
      month: 10,
      monthName: "Oct",
      quotedCop: 2100000000,
      wonCop: 340000000,
      pipelineCop: 1760000000,
      proposalsQuotedCount: 26,
      proposalsWonCount: 9,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 162.2,
    },
    {
      month: 11,
      monthName: "Nov",
      quotedCop: 1650000000,
      wonCop: 215000000,
      pipelineCop: 1435000000,
      proposalsQuotedCount: 20,
      proposalsWonCount: 5,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 102.6,
    },
    {
      month: 12,
      monthName: "Dic",
      quotedCop: 1200000000,
      wonCop: 130000000,
      pipelineCop: 1070000000,
      proposalsQuotedCount: 14,
      proposalsWonCount: 4,
      targetCop: 209600000,
      targetProposals: 4,
      compliancePercentage: 62.0,
    },
  ],
  yoyComparison: [],
  previousYearSummary: {
    year: 2025,
    totalQuotedCop: 16000000000,
    totalWonCop: 2100000000,
    totalWonCount: 55,
  },
};

describe("MonthlySalesBarChart", () => {
  it("renders loading pulse when isLoading is true", () => {
    const { container } = render(<MonthlySalesBarChart isLoading />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders title, year badge, legend and all 12 month labels", () => {
    render(<MonthlySalesBarChart data={mockTrendsData} />);
    expect(screen.getByText("Cotizado vs. Vendido por Mes")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("Cotizado ($)")).toBeInTheDocument();
    expect(screen.getByText("Vendido ($)")).toBeInTheDocument();
    expect(screen.getByText(/Meta Mensual:/)).toBeInTheDocument();

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    for (const m of months) {
      expect(screen.getByText(m)).toBeInTheDocument();
    }
  });

  it("shows annual totals strip when no month is hovered", () => {
    render(<MonthlySalesBarChart data={mockTrendsData} />);
    expect(screen.getByText(/Total Cotizado 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Total Vendido 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Efectividad Global/)).toBeInTheDocument();
    expect(screen.getByText(/Avance sobre Meta Anual/)).toBeInTheDocument();
  });

  it("reveals monthly drilldown when hovering or clicking a month bar", () => {
    render(<MonthlySalesBarChart data={mockTrendsData} />);
    const febBtn = screen.getByRole("button", { name: /Mes Feb/i });
    fireEvent.mouseEnter(febBtn);

    expect(screen.getByText("Mes de Feb (2026)")).toBeInTheDocument();
    expect(screen.getByText("105% meta del mes")).toBeInTheDocument();
    expect(screen.getByText("5 de 18 propuestas cerradas exitosamente")).toBeInTheDocument();

    // Leave hover
    fireEvent.mouseLeave(febBtn);
    expect(screen.queryByText("Mes de Feb (2026)")).not.toBeInTheDocument();
    expect(screen.getByText(/Total Cotizado 2026/)).toBeInTheDocument();
  });
});
