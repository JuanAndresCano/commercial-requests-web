import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceMixChart } from "./ServiceMixChart";
import type { ServiceMixEntry } from "@/lib/api/requests";

describe("ServiceMixChart Component", () => {
  const mockServiceMix: ServiceMixEntry[] = [
    {
      category: "CAPACITACION",
      label: "Capacitación",
      proposalsCount: 54,
      quotedCop: 1200000000,
      wonCop: 800000000,
      wonCount: 25,
      shareOfWonPercentage: 53.3,
    },
    {
      category: "CONSULTORIA",
      label: "Consultoría",
      proposalsCount: 30,
      quotedCop: 900000000,
      wonCop: 500000000,
      wonCount: 15,
      shareOfWonPercentage: 33.3,
    },
    {
      category: "MENTORIA",
      label: "Mentoría",
      proposalsCount: 12,
      quotedCop: 300000000,
      wonCop: 200000000,
      wonCount: 8,
      shareOfWonPercentage: 13.4,
    },
  ];

  it("renders the service mix header and category count", () => {
    render(<ServiceMixChart serviceMix={mockServiceMix} totalCenterWonCop={1500000000} />);

    expect(screen.getByTestId("service-mix-chart")).toBeInTheDocument();
    expect(screen.getByText(/Mix de Portafolio por Formato de Servicio/i)).toBeInTheDocument();
    expect(screen.getByText("3 categorías de servicio")).toBeInTheDocument();
  });

  it("displays service category cards with proposal counts and win rates", () => {
    render(<ServiceMixChart serviceMix={mockServiceMix} totalCenterWonCop={1500000000} />);

    expect(screen.getByText("Capacitación")).toBeInTheDocument();
    expect(screen.getByText("Consultoría")).toBeInTheDocument();
    expect(screen.getByText("Mentoría")).toBeInTheDocument();

    expect(screen.getByText("53.3%")).toBeInTheDocument();
    expect(screen.getByText("33.3%")).toBeInTheDocument();
    expect(screen.getByText("13.4%")).toBeInTheDocument();

    expect(screen.getByText("54")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders proportional bar label", () => {
    render(<ServiceMixChart serviceMix={mockServiceMix} totalCenterWonCop={1500000000} />);

    expect(screen.getByText(/Distribución Proporcional de la Facturación Real/i)).toBeInTheDocument();
    expect(screen.getByText("100% Portafolio")).toBeInTheDocument();
  });

  it("handles empty service mix gracefully", () => {
    render(<ServiceMixChart serviceMix={[]} totalCenterWonCop={0} />);

    expect(screen.getByText(/No hay datos de formatos de servicio/i)).toBeInTheDocument();
  });
});
