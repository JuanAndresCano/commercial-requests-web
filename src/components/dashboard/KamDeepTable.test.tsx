import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KamDeepTable } from "./KamDeepTable";
import type { KamRankingEntry } from "@/lib/api/requests";

const mockKamRanking: KamRankingEntry[] = [
  {
    kamId: "kam-1",
    name: "Ana Pérez",
    email: "ana.perez@icesi.edu.co",
    totalProposals: 15,
    deliveredCount: 4,
    deliveredTotalCop: 1100000000,
    pipelineCount: 11,
    pipelineTotalCop: 1500000000,
    wonCount: 4,
    wonTotalCop: 1100000000,
    winRatePercentage: 26.7,
    averageTicketCop: 275000000,
    targetCop: 1000000000,
    targetCompliancePercentage: 110.0,
    shareOfTotalSalesPercentage: 55.0,
  },
  {
    kamId: "kam-2",
    name: "Carlos Gómez",
    email: "carlos.gomez@icesi.edu.co",
    totalProposals: 12,
    deliveredCount: 3,
    deliveredTotalCop: 900000000,
    pipelineCount: 9,
    pipelineTotalCop: 1200000000,
    wonCount: 3,
    wonTotalCop: 900000000,
    winRatePercentage: 25.0,
    averageTicketCop: 300000000,
    targetCop: 1000000000,
    targetCompliancePercentage: 90.0,
    shareOfTotalSalesPercentage: 45.0,
  },
];

describe("KamDeepTable", () => {
  it("renders table header and 8 indicator columns", () => {
    render(<KamDeepTable kamRanking={mockKamRanking} totalCenterWonCop={2000000000} />);
    expect(screen.getByText("Tabla Consolidada de Productividad Comercial por Asesor")).toBeInTheDocument();
    expect(screen.getByText("Ejecutivo Comercial")).toBeInTheDocument();
    expect(screen.getByText("Gestionadas")).toBeInTheDocument();
    expect(screen.getByText("Ofertado ($)")).toBeInTheDocument();
    expect(screen.getByText("Vendido ($)")).toBeInTheDocument();
    expect(screen.getByText("Win Rate")).toBeInTheDocument();
    expect(screen.getByText("Participación")).toBeInTheDocument();
    expect(screen.getByText("Ticket Promedio")).toBeInTheDocument();
    expect(screen.getByText("Cumplimiento Meta")).toBeInTheDocument();
  });

  it("renders row data for each KAM with formatted values and compliance", () => {
    render(<KamDeepTable kamRanking={mockKamRanking} totalCenterWonCop={2000000000} />);
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("ana.perez@icesi.edu.co")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Carlos Gómez")).toBeInTheDocument();
    expect(screen.getByText("carlos.gomez@icesi.edu.co")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders center consolidated totals in table footer", () => {
    render(<KamDeepTable kamRanking={mockKamRanking} totalCenterWonCop={2000000000} />);
    expect(screen.getByText("Consolidado del Centro")).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument(); // 15 + 12 total proposals
  });
});
