import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestItem } from "@/lib/mock-data";
import { TestRouter } from "@/test/router";
import { ProductLeaderDashboard } from "./ProductLeaderDashboard";

const costing = (readyForKam: boolean): NonNullable<RequestItem["costing"]> => ({
  readyForKam,
  costingSentAt: readyForKam ? new Date().toISOString() : undefined,
  totalOfferedCop: 10_000_000,
  expectedMarginPercent: 30,
  marginAmountCop: 3_000_000,
  proCulturaTaxPercent: 0,
  proCulturaTaxAmount: 0,
});

const make = (n: number, title: string, over: Partial<RequestItem>): RequestItem => ({
  id: `REQ-2026-04${n}`,
  title,
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

const pendingServer = make(1, "Pendiente servidor", {
  status: "en-costeo",
  costing: costing(false),
  adjustmentCount: 1,
  hasPendingAdjustment: true,
});
const pendingText = make(2, "Pendiente texto", {
  status: "en-costeo",
  company: "Sura",
  costing: costing(true),
  clientObservations: "Bajar el precio",
});
const resentOne = make(3, "Reenviada una", {
  status: "entregada",
  costing: costing(true),
  adjustmentCount: 1,
  hasPendingAdjustment: false,
});
const resentTwo = make(4, "Reenviada dos", {
  status: "entregada",
  company: "Sura",
  costing: costing(true),
  adjustmentCount: 2,
  hasPendingAdjustment: false,
});
const plain = make(5, "Solicitud sin devoluciones", {
  status: "nueva",
  adjustmentCount: 0,
  hasPendingAdjustment: false,
});
const all = [pendingServer, pendingText, resentOne, resentTwo, plain];
const titles = all.map((r) => r.title);

function renderBoard(requests = all) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <TestRouter>
        <ProductLeaderDashboard
          requests={requests}
          user={{ name: "Carlos Gómez", email: "c@icesi.edu.co", roleLabel: "Líder de Producto" }}
          updateRequest={vi.fn()}
          updateStatus={vi.fn()}
        />
      </TestRouter>
    </QueryClientProvider>,
  );
}

const select = () => screen.getByLabelText("Filtrar por sustentación y ajustes") as HTMLSelectElement;
const choose = (value: string) => fireEvent.change(select(), { target: { value } });
const counter = () => screen.getByRole("button", { name: /en sustentación y ajustes/ });
const expectOnly = (visible: string[]) => {
  for (const title of titles) {
    if (visible.includes(title)) expect(screen.getByText(title)).toBeInTheDocument();
    else expect(screen.queryByText(title)).not.toBeInTheDocument();
  }
};

describe.each(["tabla", "kanban"] as const)("Leader adjustments filter in the %s view", (view) => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("icesi_lp_dashboard_view_v1", JSON.stringify(view));
  });

  it("offers the four options and shows everything by default", () => {
    renderBoard();
    expect(
      within(select())
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Todas", "Pendientes", "Ya reenviadas", "Sin ajustes"]);
    expectOnly(titles);
  });

  it.each([
    ["pending", ["Pendiente servidor", "Pendiente texto"]],
    ["resent", ["Reenviada una", "Reenviada dos"]],
    ["none", ["Solicitud sin devoluciones"]],
  ])("keeps only the %s proposals", (value, visible) => {
    renderBoard();
    choose(value);
    expectOnly(visible);
  });

  it("combines with the search", () => {
    renderBoard();
    choose("pending");
    fireEvent.change(screen.getByPlaceholderText(/Buscar por empresa/), { target: { value: "Sura" } });
    expectOnly(["Pendiente texto"]);
  });

  it("explains the empty result and clears every filter from its button", () => {
    renderBoard();
    choose("resent");
    fireEvent.change(screen.getByPlaceholderText(/Buscar por empresa/), { target: { value: "inexistente" } });
    expectOnly([]);
    fireEvent.click(screen.getAllByRole("button", { name: "Quitar filtros" })[0]);
    expect(select().value).toBe("");
    expectOnly(titles);
  });

  it("clears with its own link", () => {
    renderBoard();
    choose("resent");
    fireEvent.click(screen.getByRole("button", { name: "Quitar ajustes" }));
    expect(select().value).toBe("");
    expectOnly(titles);
  });

  it("paints the dot amber for pending and neutral for resent", () => {
    renderBoard();
    choose("pending");
    expect((select().previousElementSibling as HTMLElement).className).toContain("bg-amber-600");
    choose("resent");
    expect((select().previousElementSibling as HTMLElement).className).toContain("bg-muted-foreground/50");
  });

  it("shows the neutral badge only on resent proposals", () => {
    renderBoard();
    const holder = (title: string) => screen.getByText(title).closest(view === "tabla" ? "tr" : "a") as HTMLElement;
    expect(within(holder("Reenviada una")).getByText("1 ajuste")).toBeInTheDocument();
    expect(within(holder("Reenviada dos")).getByText("2 ajustes")).toBeInTheDocument();
    expect(within(holder("Reenviada dos")).getByTitle("Pasó por 2 sustentaciones y ajustes")).toBeInTheDocument();
    for (const title of ["Pendiente servidor", "Pendiente texto", "Solicitud sin devoluciones"]) {
      expect(within(holder(title)).queryByText(/\d ajustes?$/)).not.toBeInTheDocument();
    }
  });
});

describe("Leader pending adjustments counter", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("icesi_lp_dashboard_view_v1", JSON.stringify("tabla"));
  });

  it("counts the pending ones of the whole set and toggles the Pending filter", () => {
    renderBoard();
    expect(counter()).toHaveTextContent("2 en sustentación y ajustes");
    expect(counter()).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(counter());
    expect(counter()).toHaveAttribute("aria-pressed", "true");
    expect(counter()).toHaveTextContent("2 en sustentación y ajustes");
    expect(select().value).toBe("pending");
    expectOnly(["Pendiente servidor", "Pendiente texto"]);
    fireEvent.click(counter());
    expect(counter()).toHaveAttribute("aria-pressed", "false");
    expectOnly(titles);
  });

  it("is dimmed and disabled with no pending proposals", () => {
    renderBoard([resentOne, plain]);
    expect(counter()).toHaveTextContent("0 en sustentación y ajustes");
    expect(counter()).toBeDisabled();
  });
});

describe("Leader amber notice is unchanged", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("icesi_lp_dashboard_view_v1", JSON.stringify("kanban"));
  });

  it("is amber only while pending, from the server fields or from the text", () => {
    renderBoard();
    const notice = (title: string) =>
      (screen.getByText(title).closest("div.group") as HTMLElement).querySelector("div.border-b") as HTMLElement;
    expect(notice("Pendiente servidor").className).toContain("bg-amber-100");
    expect(notice("Pendiente texto").className).toContain("bg-amber-100");
    expect(notice("Reenviada una").className).toContain("invisible");
    expect(notice("Solicitud sin devoluciones").className).toContain("invisible");
  });

  it("keeps the amber tag of the table status badge only while pending", () => {
    window.localStorage.setItem("icesi_lp_dashboard_view_v1", JSON.stringify("tabla"));
    renderBoard();
    const row = (title: string) => screen.getByText(title).closest("tr") as HTMLElement;
    expect(within(row("Pendiente servidor")).getByText("Sustentación y ajustes")).toBeInTheDocument();
    expect(within(row("Pendiente texto")).getByText("Sustentación y ajustes")).toBeInTheDocument();
    expect(within(row("Reenviada una")).queryByText("Sustentación y ajustes")).not.toBeInTheDocument();
  });
});
