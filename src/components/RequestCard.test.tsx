import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TestRouter } from "@/test/router";
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
  return render(<TestRouter>{ui}</TestRouter>);
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

describe("RequestCard total age and official number", () => {
  it("shows the total days since the request was created, next to the days in the stage", () => {
    renderCard(<RequestCard req={{ ...baseRequest, statusUpdatedAt: daysAgo(4) }} />);
    expect(screen.getByText("Lleva 4 días en esta etapa")).toBeInTheDocument();
    expect(screen.getByText("Total 9 días")).toBeInTheDocument();
  });

  it("shows the official number when the request has one", () => {
    renderCard(<RequestCard req={{ ...baseRequest, status: "entregada", officialNumber: "CP 2026-0169" }} />);
    expect(screen.getByText("CP 2026-0169")).toBeInTheDocument();
  });

  it("shows no official number when it is null", () => {
    renderCard(<RequestCard req={baseRequest} />);
    expect(screen.queryByTitle("Número oficial")).not.toBeInTheDocument();
  });
});

describe("RequestCard commercial follow-up chip", () => {
  const delivered: RequestItem = { ...baseRequest, status: "entregada", commercialStatus: "INVOICED" };

  it("shows the tag as a static chip in the badge row, next to type and priority, for a read-only viewer", () => {
    renderCard(<RequestCard req={delivered} />);
    const chip = screen.getByText("Facturada");
    expect(chip.closest("[data-commercial-status]")).toHaveAttribute("data-commercial-status", "INVOICED");
    expect(chip.closest("div")).toContainElement(screen.getByText("Capacitación"));
    expect(screen.queryByRole("button", { name: /seguimiento comercial/i })).not.toBeInTheDocument();
  });

  it("shows a neutral 'Presentación de propuesta' chip when a read-only viewer sees an untagged delivery", () => {
    renderCard(<RequestCard req={{ ...delivered, commercialStatus: null }} />);
    expect(screen.getByText("Presentación de propuesta")).toBeInTheDocument();
  });

  it("does not show any chip outside the delivered stage", () => {
    renderCard(<RequestCard req={{ ...baseRequest, commercialStatus: "INVOICED" }} />);
    expect(screen.queryByText("Facturada")).not.toBeInTheDocument();
    expect(screen.queryByText("Presentación de propuesta")).not.toBeInTheDocument();
  });

  it("gives the owner an interactive chip that does not open the proposal detail", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TestRouter route="/dashboard">
          <RequestCard req={{ ...delivered, commercialStatus: null }} canEditCommercialStatus />
        </TestRouter>
      </QueryClientProvider>,
    );
    const chip = screen.getByRole("button", { name: "Asignar seguimiento comercial" });
    expect(chip).toHaveTextContent("+ Asignar estado");
    expect(fireEvent.click(chip)).toBe(false);
  });
});
