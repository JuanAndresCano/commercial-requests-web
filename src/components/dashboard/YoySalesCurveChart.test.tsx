import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { YoySalesCurveChart } from "./YoySalesCurveChart";
import type { MonthlyTrendsData } from "@/lib/api/requests";

const mockYoyTrendsData: MonthlyTrendsData = {
  year: 2026,
  previousYear: 2025,
  annualTargetCop: 2516000000,
  annualTargetProposals: 45,
  totalQuotedCop: 18800000000,
  totalWonCop: 2420000000,
  totalWonCount: 64,
  annualCompliancePercentage: 96.2,
  monthlyData: [],
  yoyComparison: [
    {
      month: 1,
      monthName: "Ene",
      currentYearWonCop: 150000000,
      previousYearWonCop: 120000000,
      varianceCop: 30000000,
      growthPercentage: 25.0,
    },
    {
      month: 2,
      monthName: "Feb",
      currentYearWonCop: 220000000,
      previousYearWonCop: 180000000,
      varianceCop: 40000000,
      growthPercentage: 22.2,
    },
    {
      month: 3,
      monthName: "Mar",
      currentYearWonCop: 310000000,
      previousYearWonCop: 250000000,
      varianceCop: 60000000,
      growthPercentage: 24.0,
    },
    {
      month: 4,
      monthName: "Abr",
      currentYearWonCop: 190000000,
      previousYearWonCop: 160000000,
      varianceCop: 30000000,
      growthPercentage: 18.8,
    },
    {
      month: 5,
      monthName: "May",
      currentYearWonCop: 210000000,
      previousYearWonCop: 190000000,
      varianceCop: 20000000,
      growthPercentage: 10.5,
    },
    {
      month: 6,
      monthName: "Jun",
      currentYearWonCop: 250000000,
      previousYearWonCop: 210000000,
      varianceCop: 40000000,
      growthPercentage: 19.0,
    },
    {
      month: 7,
      monthName: "Jul",
      currentYearWonCop: 180000000,
      previousYearWonCop: 150000000,
      varianceCop: 30000000,
      growthPercentage: 20.0,
    },
    {
      month: 8,
      monthName: "Ago",
      currentYearWonCop: 205000000,
      previousYearWonCop: 175000000,
      varianceCop: 30000000,
      growthPercentage: 17.1,
    },
    {
      month: 9,
      monthName: "Sep",
      currentYearWonCop: 280000000,
      previousYearWonCop: 220000000,
      varianceCop: 60000000,
      growthPercentage: 27.3,
    },
    {
      month: 10,
      monthName: "Oct",
      currentYearWonCop: 340000000,
      previousYearWonCop: 260000000,
      varianceCop: 80000000,
      growthPercentage: 30.8,
    },
    {
      month: 11,
      monthName: "Nov",
      currentYearWonCop: 215000000,
      previousYearWonCop: 170000000,
      varianceCop: 45000000,
      growthPercentage: 26.5,
    },
    {
      month: 12,
      monthName: "Dic",
      currentYearWonCop: 130000000,
      previousYearWonCop: 110000000,
      varianceCop: 20000000,
      growthPercentage: 18.2,
    },
  ],
  previousYearSummary: {
    year: 2025,
    totalQuotedCop: 16000000000,
    totalWonCop: 2195000000,
    totalWonCount: 58,
  },
};

describe("YoySalesCurveChart", () => {
  it("renders loading pulse when isLoading is true", () => {
    const { container } = render(<YoySalesCurveChart isLoading />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders title, YoY badge, SVG lines and legend", () => {
    render(<YoySalesCurveChart data={mockYoyTrendsData} />);
    expect(screen.getByText("Curva Comparativa Interanual de Ventas (YoY)")).toBeInTheDocument();
    expect(screen.getByText("+10.3% YoY")).toBeInTheDocument();
    expect(screen.getByText("2026 (Actual)")).toBeInTheDocument();
    expect(screen.getByText("2025 (Previo)")).toBeInTheDocument();
  });

  it("shows annual rhythm summary when no month is hovered", () => {
    render(<YoySalesCurveChart data={mockYoyTrendsData} />);
    expect(screen.getByText("Ritmo Anual de Facturación Interanual")).toBeInTheDocument();
    expect(screen.getByText("Diferencia Neta")).toBeInTheDocument();
    expect(screen.getByText("+10.3%")).toBeInTheDocument();
  });

  it("displays month comparison drilldown on month button click", () => {
    render(<YoySalesCurveChart data={mockYoyTrendsData} />);
    const octBtn = screen.getByRole("button", { name: "Oct" });
    fireEvent.click(octBtn);

    expect(screen.getByText("Comparativo de Oct")).toBeInTheDocument();
    expect(screen.getByText("+30.8% YoY")).toBeInTheDocument();
    expect(screen.getByText(/Variación neta en el mes/)).toBeInTheDocument();
    expect(screen.getByText("Ventas 2026")).toBeInTheDocument();
    expect(screen.getByText("Ventas 2025")).toBeInTheDocument();
  });
});
