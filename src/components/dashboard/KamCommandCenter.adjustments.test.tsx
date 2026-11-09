import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestsApi, type ProposalDashboardMetrics } from "@/lib/api/requests";
import type { RequestItem } from "@/lib/mock-data";
import { TestRouter } from "@/test/router";
import { KamCommandCenter } from "./KamCommandCenter";

vi.mock("@/lib/api/requests", () => ({ requestsApi: { list: vi.fn(), getDashboardMetrics: vi.fn() } }));

const metrics: ProposalDashboardMetrics = {
  total: 6,
  nuevas: 1,
  listas: 0,
  entregadas: 3,
  deliveredValueCop: "10000000.30",
  urgentes: 0,
  proximas: 0,
  sinDocente: 0,
  borradoresPendientes: 0,
  enviadasSemana: 0,
  inProgress: 0,
  rejected: 0,
};

const make = (id: string, title: string, over: Partial<RequestItem>): RequestItem => ({
  id,
  title,
  company: "Bancolombia",
  applicant: "Cliente",
  type: "Consultoría",
  status: "entregada",
  urgency: "media",
  productLeader: "Laura Díaz",
  kam: "Andrea Martínez",
  node: null,
  createdAt: "2026-11-01T12:00:00Z",
  ...over,
});

const pendingServer = make("p1", "Pendiente servidor", {
  status: "en-costeo",
  adjustmentCount: 1,
  hasPendingAdjustment: true,
});
const pendingText = make("p2", "Pendiente texto", {
  status: "en-costeo",
  company: "Sura",
  clientObservations: "Ajustar el alcance",
});
const resentOne = make("r1", "Reenviada una", {
  adjustmentCount: 1,
  hasPendingAdjustment: false,
  commercialStatus: "INVOICED",
  deliveredValueCop: "5000000.10",
});
const resentTwo = make("r2", "Reenviada dos", {
  company: "Sura",
  adjustmentCount: 2,
  hasPendingAdjustment: false,
  commercialStatus: "REJECTED",
  deliveredValueCop: "3000000.20",
});
const noneDelivered = make("n1", "Entregada sin ajustes", {
  adjustmentCount: 0,
  hasPendingAdjustment: false,
  commercialStatus: null,
  deliveredValueCop: "2000000.00",
});
const noneNew = make("n2", "Nueva sin ajustes", { status: "nueva", adjustmentCount: 0, hasPendingAdjustment: false });
const all = [pendingServer, pendingText, resentOne, resentTwo, noneDelivered, noneNew];

function renderBoard(requests = all) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TestRouter>
        <KamCommandCenter userName="Andrea Martínez" requests={requests} />
      </TestRouter>
    </QueryClientProvider>,
  );
}

const select = () => screen.getByLabelText("Filtrar por sustentación y ajustes");
const choose = (value: string) => fireEvent.change(select(), { target: { value } });
const counter = () => screen.getByRole("button", { name: /en sustentación y ajustes/ });
const titles = [
  "Pendiente servidor",
  "Pendiente texto",
  "Reenviada una",
  "Reenviada dos",
  "Entregada sin ajustes",
  "Nueva sin ajustes",
];
const expectOnly = (visible: string[]) => {
  for (const title of titles) {
    if (visible.includes(title)) expect(screen.getByText(title)).toBeInTheDocument();
    else expect(screen.queryByText(title)).not.toBeInTheDocument();
  }
};

describe.each(["tabla", "kanban"] as const)("KAM adjustments filter in the %s view", (view) => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("icesi_kam_dashboard_view_v1", JSON.stringify(view));
    vi.mocked(requestsApi.list).mockReturnValue(new Promise(() => {}));
    vi.mocked(requestsApi.getDashboardMetrics).mockResolvedValue(metrics);
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
    ["none", ["Entregada sin ajustes", "Nueva sin ajustes"]],
  ])("keeps only the %s proposals", (value, visible) => {
    renderBoard();
    choose(value);
    expectOnly(visible);
  });

  it("combines with the commercial tag, the other filters and the search", () => {
    renderBoard();
    choose("resent");
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "INVOICED" } });
    expectOnly(["Reenviada una"]);
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Filtrar por empresa"), { target: { value: "Sura" } });
    expectOnly(["Reenviada dos"]);
    fireEvent.change(screen.getByLabelText("Filtrar por empresa"), { target: { value: "" } });
    fireEvent.change(screen.getByPlaceholderText(/Buscar por propuesta, empresa o ID/i), { target: { value: "dos" } });
    expectOnly(["Reenviada dos"]);
  });

  it("shows the empty state with a button that also clears the adjustments filter", () => {
    renderBoard();
    choose("pending");
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "INVOICED" } });
    expect(screen.getByText("No se encontraron solicitudes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect((select() as HTMLSelectElement).value).toBe("");
    expect((screen.getByLabelText("Filtrar por etiqueta comercial") as HTMLSelectElement).value).toBe("");
    expectOnly(titles);
  });

  it("clears with its own link", () => {
    renderBoard();
    choose("resent");
    fireEvent.click(screen.getByRole("button", { name: "Quitar ajustes" }));
    expect((select() as HTMLSelectElement).value).toBe("");
    expectOnly(titles);
    expect(screen.queryByRole("button", { name: "Quitar ajustes" })).not.toBeInTheDocument();
  });

  it("paints the dot amber for pending and neutral for resent", () => {
    renderBoard();
    const dot = () => select().previousElementSibling as HTMLElement;
    choose("pending");
    expect(dot().className).toContain("bg-amber-600");
    choose("resent");
    expect(dot().className).toContain("bg-muted-foreground/50");
  });

  it("shows the neutral badge only on resent proposals: 1 ajuste, 2 ajustes", () => {
    renderBoard();
    const badge = (title: string) => screen.getByText(title).closest(view === "tabla" ? "tr" : "a") as HTMLElement;
    expect(within(badge("Reenviada una")).getByText("1 ajuste")).toBeInTheDocument();
    expect(within(badge("Reenviada una")).getByTitle("Pasó por 1 sustentación y ajuste")).toBeInTheDocument();
    expect(within(badge("Reenviada dos")).getByText("2 ajustes")).toBeInTheDocument();
    expect(within(badge("Reenviada dos")).getByTitle("Pasó por 2 sustentaciones y ajustes")).toBeInTheDocument();
    for (const title of ["Pendiente servidor", "Pendiente texto", "Entregada sin ajustes", "Nueva sin ajustes"]) {
      expect(within(badge(title)).queryByText(/\d ajustes?$/)).not.toBeInTheDocument();
    }
  });
});

describe("KAM pending adjustments counter", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("icesi_kam_dashboard_view_v1", JSON.stringify("tabla"));
    vi.mocked(requestsApi.list).mockReturnValue(new Promise(() => {}));
    vi.mocked(requestsApi.getDashboardMetrics).mockResolvedValue(metrics);
  });

  it("counts the pending ones of the whole set, whatever the select says", () => {
    renderBoard();
    expect(counter()).toHaveTextContent("2 en sustentación y ajustes");
    choose("resent");
    expect(counter()).toHaveTextContent("2 en sustentación y ajustes");
    fireEvent.change(screen.getByLabelText("Filtrar por empresa"), { target: { value: "Sura" } });
    expect(counter()).toHaveTextContent("2 en sustentación y ajustes");
  });

  it("applies and removes the Pending filter on click, reflecting it in aria-pressed", () => {
    renderBoard();
    expect(counter()).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(counter());
    expect(counter()).toHaveAttribute("aria-pressed", "true");
    expect((select() as HTMLSelectElement).value).toBe("pending");
    expectOnly(["Pendiente servidor", "Pendiente texto"]);
    fireEvent.click(counter());
    expect(counter()).toHaveAttribute("aria-pressed", "false");
    expect((select() as HTMLSelectElement).value).toBe("");
    expectOnly(titles);
  });

  it("is dimmed and disabled with no pending proposals", () => {
    renderBoard([resentOne, noneDelivered]);
    expect(counter()).toHaveTextContent("0 en sustentación y ajustes");
    expect(counter()).toBeDisabled();
  });
});

describe("KAM Entregada header with the adjustments filter", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("icesi_kam_dashboard_view_v1", JSON.stringify("tabla"));
    vi.mocked(requestsApi.list).mockReturnValue(new Promise(() => {}));
    vi.mocked(requestsApi.getDashboardMetrics).mockResolvedValue(metrics);
  });

  it("keeps the gross total without filters", async () => {
    renderBoard();
    expect(await screen.findByText("$ 10.000.000,30 COP total entregado")).toBeInTheDocument();
    expect(screen.queryByText(/Filtradas:/)).not.toBeInTheDocument();
  });

  it("sums exactly the delivered proposals of the filtered set", async () => {
    renderBoard();
    await screen.findByText("$ 10.000.000,30 COP total entregado");
    choose("resent");
    expect(screen.getByText("Filtradas: 2 de 3 · $ 8.000.000,30 COP")).toBeInTheDocument();
    expect(screen.queryByText(/COP total entregado/)).not.toBeInTheDocument();
    choose("none");
    expect(screen.getByText("Filtradas: 1 de 3 · $ 2.000.000 COP")).toBeInTheDocument();
    choose("pending");
    expect(screen.getByText("Filtradas: 0 de 3 · $ 0 COP")).toBeInTheDocument();
  });

  it("reacts to both filters together", async () => {
    renderBoard();
    await screen.findByText("$ 10.000.000,30 COP total entregado");
    choose("resent");
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "REJECTED" } });
    expect(screen.getByText("Filtradas: 1 de 3 · $ 3.000.000,20 COP")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quitar etiqueta" }));
    expect(screen.getByText("Filtradas: 2 de 3 · $ 8.000.000,30 COP")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quitar ajustes" }));
    expect(screen.getByText("$ 10.000.000,30 COP total entregado")).toBeInTheDocument();
  });
});

describe("KAM amber notice is unchanged", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("icesi_kam_dashboard_view_v1", JSON.stringify("kanban"));
    vi.mocked(requestsApi.list).mockReturnValue(new Promise(() => {}));
    vi.mocked(requestsApi.getDashboardMetrics).mockResolvedValue(metrics);
  });

  it("is amber while pending, from the server fields or from the text, and invisible otherwise", () => {
    renderBoard();
    const notice = (title: string) =>
      within(screen.getByText(title).closest("a") as HTMLElement).getByText("Sustentación y ajustes").parentElement;
    expect(notice("Pendiente servidor")?.className).toContain("bg-amber-100");
    expect(notice("Pendiente servidor")?.className).not.toContain("invisible");
    expect(notice("Pendiente texto")?.className).toContain("bg-amber-100");
    expect(notice("Reenviada una")?.className).toContain("invisible");
    expect(notice("Entregada sin ajustes")?.className).toContain("invisible");
  });
});
