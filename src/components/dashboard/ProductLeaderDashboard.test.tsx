import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductLeaderDashboard } from "./ProductLeaderDashboard";
import type { RequestItem } from "@/lib/mock-data";

const costing = (readyForKam: boolean): NonNullable<RequestItem["costing"]> => ({
  readyForKam,
  costingSentAt: readyForKam ? new Date().toISOString() : undefined,
  totalOfferedCop: 10_000_000,
  expectedMarginPercent: 30,
  marginAmountCop: 3_000_000,
  proCulturaTaxPercent: 0,
  proCulturaTaxAmount: 0,
});

const req = (n: number, over: Partial<RequestItem>): RequestItem => ({
  id: `REQ-2026-03${n}`,
  title: `Solicitud ${n}`,
  company: "Bancolombia",
  applicant: "Contacto",
  type: "Capacitación",
  createdAt: new Date().toISOString(),
  status: "nueva",
  urgency: "media",
  productLeader: "Carlos Gómez",
  kam: "Andrea Martínez",
  node: "IA",
  professor: "Dra. Paula Henao",
  ...over,
});

const dataset: RequestItem[] = [
  req(1, { status: "nueva" }),
  req(2, { status: "en-experto" }),
  req(3, { status: "en-costeo", costing: costing(false) }),
  req(4, { status: "en-costeo", costing: costing(true) }),
  req(5, { status: "entregada", costing: costing(true) }),
];

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProductLeaderDashboard
          requests={dataset}
          user={{ name: "Carlos Gómez", email: "c@icesi.edu.co", roleLabel: "Líder de Producto" }}
          updateRequest={vi.fn()}
          updateStatus={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const column = (name: string) => screen.getByRole("heading", { name }).closest("div.flex-col") as HTMLElement;

describe("ProductLeaderDashboard stages (C-03)", () => {
  beforeEach(() => window.localStorage.clear());

  it("shows five columns with 'Enviada al KAM' between costing and delivered", () => {
    renderDashboard();
    const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(["Nueva", "En proceso por experto", "En proceso de costeo", "Enviada al KAM", "Entregada"]);
  });

  it("splits costing from sent-to-KAM and keeps 'Entregada' for the client delivery", () => {
    renderDashboard();
    expect(within(column("En proceso de costeo")).getByText("Solicitud 3")).toBeInTheDocument();
    expect(within(column("En proceso de costeo")).queryByText("Solicitud 4")).not.toBeInTheDocument();
    expect(within(column("Enviada al KAM")).getByText("Solicitud 4")).toBeInTheDocument();
    expect(within(column("Entregada")).getByText("Solicitud 5")).toBeInTheDocument();
  });

  it("keeps the 'Enviado al KAM' badge on the sent card", () => {
    renderDashboard();
    expect(within(column("Enviada al KAM")).getByText("Enviado al KAM")).toBeInTheDocument();
    expect(within(column("En proceso de costeo")).queryByText("Enviado al KAM")).not.toBeInTheDocument();
  });

  it("counts each stage by its own column in the KPI cards", () => {
    renderDashboard();
    expect(screen.getByRole("button", { name: /^3\. En Costeo\s*1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^4\. Enviadas al KAM\s*1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^5\. Entregadas\s*1/ })).toBeInTheDocument();
  });

  it("isolates the stage when its header is clicked and names five stages in the way back", () => {
    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /^Enviada al KAM\s*1/ }));
    expect(screen.queryByRole("heading", { name: "Nueva" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Enviada al KAM" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Ver las 5 fases/ }).length).toBeGreaterThan(0);
  });

  it("shows the derived stage in the table view and filters by it", () => {
    window.localStorage.setItem("icesi_lp_dashboard_view_v1", JSON.stringify("tabla"));
    renderDashboard();
    const row = screen.getByText("Solicitud 4").closest("tr") as HTMLElement;
    expect(within(row).getByText("Enviada al KAM")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^4\. Enviadas al KAM/ }));
    expect(screen.getByText("Solicitud 4")).toBeInTheDocument();
    expect(screen.queryByText("Solicitud 3")).not.toBeInTheDocument();
  });

  it("'Esperando al KAM' leaves only the sent requests", () => {
    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /Esperando al KAM \(1\)/ }));
    expect(screen.getByText("Solicitud 4")).toBeInTheDocument();
    expect(screen.queryByText("Solicitud 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Solicitud 1")).not.toBeInTheDocument();
  });

  it("hides 'Esperando al KAM' when another stage is isolated", () => {
    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /^En proceso de costeo\s*1/ }));
    expect(screen.queryByRole("button", { name: /Esperando al KAM/ })).not.toBeInTheDocument();
  });
});

describe("ProductLeaderDashboard time counters and official number (C-13)", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const daysAgo = (d: number) => new Date(Date.now() - d * DAY - 60 * 60 * 1000).toISOString();
  const timed: RequestItem[] = [
    req(1, { status: "nueva", createdAt: daysAgo(10), statusUpdatedAt: daysAgo(3) }),
    req(2, {
      status: "entregada",
      createdAt: daysAgo(30),
      statusUpdatedAt: daysAgo(1),
      costing: costing(true),
      officialNumber: "CP 2026-0169",
    }),
  ];

  const renderTimed = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProductLeaderDashboard
            requests={timed}
            user={{ name: "Carlos Gómez", email: "c@icesi.edu.co", roleLabel: "Líder de Producto" }}
            updateRequest={vi.fn()}
            updateStatus={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => window.localStorage.clear());

  it("shows the days in the stage and the total days on each Kanban card", () => {
    renderTimed();
    const card = screen.getByText("Solicitud 1").closest("a") as HTMLElement;
    expect(within(card).getByText("Lleva 3 días en esta etapa")).toBeInTheDocument();
    expect(within(card).getByText("Total 10 días")).toBeInTheDocument();
  });

  it("shows the official number on the card that has one and nowhere else", () => {
    renderTimed();
    const delivered = screen.getByText("Solicitud 2").closest("a") as HTMLElement;
    expect(within(delivered).getByText("CP 2026-0169")).toBeInTheDocument();
    const fresh = screen.getByText("Solicitud 1").closest("a") as HTMLElement;
    expect(within(fresh).queryByTitle("Número oficial")).not.toBeInTheDocument();
  });

  it("shows the counters and the official number, next to the REQ code, in the table view", () => {
    window.localStorage.setItem("icesi_lp_dashboard_view_v1", JSON.stringify("tabla"));
    renderTimed();
    const fresh = screen.getByText("Solicitud 1").closest("tr") as HTMLElement;
    expect(within(fresh).getByText("Lleva 3 días en esta etapa")).toBeInTheDocument();
    expect(within(fresh).getByText("Total 10 días")).toBeInTheDocument();
    expect(within(fresh).queryByTitle("Número oficial")).not.toBeInTheDocument();
    const delivered = screen.getByText("Solicitud 2").closest("tr") as HTMLElement;
    expect(within(delivered).getByText("REQ-2026-032")).toBeInTheDocument();
    expect(within(delivered).getByText("CP 2026-0169")).toBeInTheDocument();
  });
});
