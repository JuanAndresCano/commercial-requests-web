import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RequestCard } from "./RequestCard";
import type { RequestItem } from "@/lib/mock-data";

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS - 60 * 60 * 1000).toISOString();

const baseRequest: RequestItem = {
  id: "REQ-2026-0100",
  title: "Propuesta de prueba",
  company: "Bancolombia",
  applicant: "Juan Pérez",
  type: "Capacitación",
  createdAt: daysAgo(9),
  status: "en-experto",
  urgency: "media",
  productLeader: "Carlos Gómez",
  kam: "Andrea Martínez",
  node: "IA",
};

function renderCard(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("RequestCard stage age", () => {
  it("shows how many days the request has been in the stage since the last status change", () => {
    renderCard(<RequestCard req={{ ...baseRequest, statusUpdatedAt: daysAgo(4) }} />);
    expect(screen.getByText("Lleva 4 días en esta etapa")).toBeInTheDocument();
  });

  it("counts from creation when there is no status change date", () => {
    renderCard(<RequestCard req={baseRequest} />);
    expect(screen.getByText("Lleva 9 días en esta etapa")).toBeInTheDocument();
  });

  it("counts from costingSentAt in the ready-to-deliver stage", () => {
    const req: RequestItem = {
      ...baseRequest,
      status: "en-costeo",
      statusUpdatedAt: daysAgo(12),
      costing: {
        readyForKam: true,
        costingSentAt: daysAgo(2),
        totalOfferedCop: 1000000,
        expectedMarginPercent: 30,
        marginAmountCop: 300000,
        proCulturaTaxPercent: 0,
        proCulturaTaxAmount: 0,
      },
    };
    renderCard(<RequestCard req={req} stage="en-costeo" />);
    expect(screen.getByText("Lleva 2 días en esta etapa")).toBeInTheDocument();
  });

  it("does not use costingSentAt when the card is shown in another stage", () => {
    const req: RequestItem = {
      ...baseRequest,
      status: "en-costeo",
      statusUpdatedAt: daysAgo(12),
      costing: {
        readyForKam: false,
        costingSentAt: daysAgo(2),
        totalOfferedCop: 1000000,
        expectedMarginPercent: 30,
        marginAmountCop: 300000,
        proCulturaTaxPercent: 0,
        proCulturaTaxAmount: 0,
      },
    };
    renderCard(<RequestCard req={req} stage="en-experto" />);
    expect(screen.getByText("Lleva 12 días en esta etapa")).toBeInTheDocument();
  });
});
