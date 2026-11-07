import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestsApi, type ProposalDashboardMetrics } from "@/lib/api/requests";
import type { RequestItem } from "@/lib/mock-data";
import { TestRouter } from "@/test/router";
import { KamCommandCenter } from "./KamCommandCenter";

vi.mock("@/lib/api/requests", () => ({
  requestsApi: { list: vi.fn(), getDashboardMetrics: vi.fn() },
}));

const metrics: ProposalDashboardMetrics = {
  total: 2,
  nuevas: 0,
  listas: 0,
  entregadas: 2,
  deliveredValueCop: "10000000.00",
  urgentes: 0,
  proximas: 0,
  sinDocente: 0,
  borradoresPendientes: 0,
  enviadasSemana: 0,
  inProgress: 0,
  rejected: 0,
};

function renderBoard(requests?: RequestItem[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TestRouter>
        <KamCommandCenter userName="Andrea Martínez" requests={requests} />
      </TestRouter>
    </QueryClientProvider>,
  );
}

describe("R7 — the KAM's delivered portfolio value", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(requestsApi.list).mockResolvedValue([]);
    vi.mocked(requestsApi.getDashboardMetrics).mockResolvedValue({
      ...metrics,
      ...{ deliveredValueCop: "10000000.00" },
    });
  });

  it("shows the full server aggregate even when the loaded list is empty or filtered", async () => {
    renderBoard();

    const total = await screen.findByText("$ 10.000.000 COP total entregado");
    await waitFor(() => expect(total.closest("button")).toHaveTextContent("2"));
    fireEvent.change(screen.getByPlaceholderText(/Buscar por propuesta, empresa o ID/i), {
      target: { value: "Bancolombia" },
    });
    expect(total).toBeInTheDocument();
  });

  it.each([
    ["0.00", "$ 0 COP total entregado"],
    ["0.30", "$ 0,30 COP total entregado"],
    ["9999999999999900.20", "$ 9.999.999.999.999.900,20 COP total entregado"],
  ])("displays the exact server value %s, including zero and cents", async (value, text) => {
    vi.mocked(requestsApi.getDashboardMetrics).mockResolvedValue({ ...metrics, deliveredValueCop: value });
    renderBoard();
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it("shows a visible failure rather than a zero or list fallback, and lets the KAM retry", async () => {
    vi.mocked(requestsApi.getDashboardMetrics).mockRejectedValueOnce(new Error("Server unavailable"));
    renderBoard();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo cargar el valor total de las propuestas presentadas.",
    );
    expect(screen.queryByText("$ 0 COP total entregado")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar total" }));
    expect(await screen.findByText("$ 10.000.000 COP total entregado")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each(["not-a-decimal", "-1.00", "1e9", "1.001"])(
    "reports a malformed total %s instead of rounding or silently showing zero",
    async (value) => {
      vi.mocked(requestsApi.getDashboardMetrics).mockResolvedValue({ ...metrics, deliveredValueCop: value });
      renderBoard();
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.queryByText(/COP total entregado/)).not.toBeInTheDocument();
    },
  );

  it("marks the total as loading until the server has answered", () => {
    vi.mocked(requestsApi.getDashboardMetrics).mockReturnValue(new Promise(() => {}));
    renderBoard();
    expect(screen.getByText("Calculando total...")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("labels active client adjustments in the KAM table without carrying an old note into a new presentation", () => {
    window.localStorage.setItem("icesi_kam_dashboard_view_v1", JSON.stringify("tabla"));
    vi.mocked(requestsApi.list).mockReturnValue(new Promise(() => {}));
    const base: RequestItem = {
      id: "adjusting",
      title: "Propuesta con ajustes activos",
      company: "Bancolombia",
      applicant: "Contacto",
      type: "Capacitación",
      status: "en-costeo",
      urgency: "media",
      createdAt: "2026-10-22T12:00:00Z",
      productLeader: "Diana",
      kam: "Andrea Martínez",
      node: null,
      clientObservations: "El cliente pidió precisar el alcance",
      costing: {
        readyForKam: true,
        totalOfferedCop: 5000000,
        proCulturaTaxPercent: 0,
        proCulturaTaxAmount: 0,
      },
    };
    renderBoard([base, { ...base, id: "presented", title: "Propuesta presentada", status: "entregada" }]);
    // The board also has a filter labelled the same way; the row-level notice is what counts here.
    expect(within(screen.getByRole("table")).getAllByText("Sustentación y ajustes")).toHaveLength(1);
    expect(screen.getByText("Propuesta con ajustes activos").closest("tr")).toHaveTextContent("Sustentación y ajustes");
    expect(screen.getByText("Propuesta presentada").closest("tr")).not.toHaveTextContent("Sustentación y ajustes");
  });
});
