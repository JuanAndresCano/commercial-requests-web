import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KamTargetVsWonChart } from "./KamTargetVsWonChart";
import type { KamRankingEntry } from "@/lib/api/requests";

const mockRanking: KamRankingEntry[] = [
  {
    kamId: "kam-1",
    name: "Ana Pérez",
    email: "ana.perez@icesi.edu.co",
    totalProposals: 10,
    deliveredCount: 4,
    deliveredTotalCop: 1100000000,
    pipelineCount: 6,
    pipelineTotalCop: 800000000,
    wonCount: 4,
    wonTotalCop: 1100000000,
    targetCop: 1000000000,
    targetCompliancePercentage: 110.0,
  },
  {
    kamId: "kam-2",
    name: "Diana Martínez",
    email: "diana.martinez@icesi.edu.co",
    totalProposals: 8,
    deliveredCount: 2,
    deliveredTotalCop: 600000000,
    pipelineCount: 6,
    pipelineTotalCop: 700000000,
    wonCount: 2,
    wonTotalCop: 600000000,
    targetCop: 800000000,
    targetCompliancePercentage: 75.0,
  },
];

describe("KamTargetVsWonChart", () => {
  it("renders chart title, legend and all KAM rows", () => {
    render(<KamTargetVsWonChart kamRanking={mockRanking} />);
    expect(screen.getByText("Cumplimiento Comercial: Vendido vs. Meta Individual")).toBeInTheDocument();
    expect(screen.getByText("Vendido Real")).toBeInTheDocument();
    expect(screen.getByText("Meta Presupuestal")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Diana Martínez")).toBeInTheDocument();
  });

  it("indicates when a KAM exceeds target quota or is in deficit", () => {
    render(<KamTargetVsWonChart kamRanking={mockRanking} />);
    expect(screen.getByText(/Meta Cumplida \(110%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Déficit \(75%\)/)).toBeInTheDocument();
  });

  it("handles a KAM without assigned quota gracefully", () => {
    const rankingWithNoQuota: KamRankingEntry[] = [
      ...mockRanking,
      {
        kamId: "kam-3",
        name: "Julián Duque",
        totalProposals: 1,
        deliveredCount: 1,
        deliveredTotalCop: 18000000,
        pipelineCount: 0,
        pipelineTotalCop: 0,
        wonCount: 1,
        wonTotalCop: 18000000,
        targetCop: 0,
      },
    ];
    render(<KamTargetVsWonChart kamRanking={rankingWithNoQuota} />);
    expect(screen.getByText("Sin meta asignada")).toBeInTheDocument();
    expect(screen.getByText("Sin meta")).toBeInTheDocument();
  });
});
