import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestsApi, type ProposalDashboardMetrics } from "@/lib/api/requests";
import type { RequestItem } from "@/lib/mock-data";
import { TestRouter } from "@/test/router";
import { KamCommandCenter } from "./KamCommandCenter";

vi.mock("@/lib/api/requests", () => ({ requestsApi: { list: vi.fn(), getDashboardMetrics: vi.fn() } }));

const metrics: ProposalDashboardMetrics = {
  total: 2,
  nuevas: 0,
  listas: 0,
  entregadas: 2,
  deliveredValueCop: "10000000.30",
  urgentes: 0,
  proximas: 0,
  sinDocente: 0,
  borradoresPendientes: 0,
  enviadasSemana: 0,
  inProgress: 0,
  rejected: 0,
};
const base: RequestItem = {
  id: "one",
  title: "Propuesta facturada",
  company: "Bancolombia",
  applicant: "Cliente",
  type: "Consultoría",
  status: "entregada",
  urgency: "media",
  productLeader: "Laura Díaz",
  kam: "Andrea Martínez",
  node: null,
  createdAt: "2026-11-01T12:00:00Z",
  commercialStatus: "INVOICED",
  deliveredValueCop: "5000000.10",
};
const proposals: RequestItem[] = [
  base,
  {
    ...base,
    id: "two",
    title: "Propuesta rechazada",
    company: "Sura",
    commercialStatus: "REJECTED",
    deliveredValueCop: "5000000.20",
  },
];

function renderBoard(requests = proposals) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TestRouter>
        <KamCommandCenter userName="Andrea Martínez" requests={requests} />
      </TestRouter>
    </QueryClientProvider>,
  );
}

describe("commercial tags in the four-stage KAM board", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("icesi_kam_dashboard_view_v1", JSON.stringify("tabla"));
    vi.mocked(requestsApi.list).mockReturnValue(new Promise(() => {}));
    vi.mocked(requestsApi.getDashboardMetrics).mockResolvedValue(metrics);
  });

  it("shows the gross total without filters and only the filtered set, count and exact sum, with one tag", async () => {
    renderBoard();
    expect(await screen.findByText("$ 10.000.000,30 COP total entregado")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "INVOICED" } });
    expect(screen.getByText("Propuesta facturada")).toBeInTheDocument();
    expect(screen.queryByText("Propuesta rechazada")).not.toBeInTheDocument();
    expect(screen.getByText("Filtradas: 1 de 2 · $ 5.000.000,10 COP")).toBeInTheDocument();
    expect(screen.queryByText(/COP total entregado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Total visible/)).not.toBeInTheDocument();
    const header = screen.getByText("Filtradas: 1 de 2 · $ 5.000.000,10 COP").closest("button");
    await waitFor(() => expect(header).toHaveTextContent(/^Entregada1Filtradas/));
    fireEvent.click(screen.getByRole("button", { name: "Quitar etiqueta" }));
    expect(screen.getByText("$ 10.000.000,30 COP total entregado")).toBeInTheDocument();
    expect(screen.queryByText(/Filtradas:/)).not.toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Facturada")).toBeInTheDocument();
  });

  it("shows a rejected proposal in its original delivered stage and in the gross total", async () => {
    renderBoard();
    await screen.findByText("$ 10.000.000,30 COP total entregado");
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "REJECTED" } });
    const table = screen.getByRole("table");
    expect(within(table).getByText("Entregada")).toBeInTheDocument();
    expect(within(table).getByText("Rechazada")).toBeInTheDocument();
    expect(screen.getByText("Filtradas: 1 de 2 · $ 5.000.000,20 COP")).toBeInTheDocument();
    expect(screen.queryByText(/COP total entregado/)).not.toBeInTheDocument();
  });

  it("combines commercial tags with search and company filters and preserves four Kanban columns", async () => {
    renderBoard();
    await screen.findByText("$ 10.000.000,30 COP total entregado");
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "INVOICED" } });
    fireEvent.change(screen.getByLabelText("Filtrar por empresa"), { target: { value: "Sura" } });
    expect(screen.queryByText("Propuesta facturada")).not.toBeInTheDocument();
    expect(screen.getByText(/Total visible:.*\$ 0 COP/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filtrar por empresa"), { target: { value: "" } });
    fireEvent.click(screen.getByLabelText("Vista kanban"));
    for (const title of ["Entregada al líder", "En Proceso", "Lista para Entregar", "Entregada"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByText("Propuesta facturada")).toBeInTheDocument();
    expect(screen.queryByText("Propuesta rechazada")).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Buscar por propuesta, empresa o ID/i), { target: { value: "Sura" } });
    expect(screen.getByText(/Total visible:.*\$ 0 COP/)).toBeInTheDocument();
  });

  it("reports an unavailable visible subtotal rather than falling back to a current private quote", async () => {
    renderBoard([{ ...base, deliveredValueCop: undefined, totalCostCop: 9000000 }]);
    await screen.findByText("$ 10.000.000,30 COP total entregado");
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "INVOICED" } });
    expect(screen.getByText("Filtradas: 1 de 2 · No disponible")).toBeInTheDocument();
  });

  it("shows the delivered snapshot in the row instead of a newer costing", async () => {
    renderBoard([{ ...base, totalCostCop: 9000000 }]);
    await screen.findByText("$ 10.000.000,30 COP total entregado");
    const row = screen.getByText("Propuesta facturada").closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("$ 5.000.000,10 COP")).toBeInTheDocument();
    expect(within(row as HTMLElement).queryByText(/9\.000\.000/)).not.toBeInTheDocument();
  });

  it("offers the untagged filter for delivered proposals only", async () => {
    renderBoard([
      { ...base, commercialStatus: null },
      { ...base, id: "new", title: "Solicitud todavía nueva", status: "nueva", commercialStatus: null },
    ]);
    await screen.findByText("$ 10.000.000,30 COP total entregado");
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "none" } });
    expect(screen.getByText("Propuesta facturada")).toBeInTheDocument();
    expect(screen.queryByText("Solicitud todavía nueva")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quitar etiqueta" }));
    expect(screen.getByText("Solicitud todavía nueva")).toBeInTheDocument();
  });

  it("sums exactly the filtered deliveries (2 of 5) while the unfiltered header keeps the 5M + 5M rejected gross", async () => {
    const delivered = (id: string, commercialStatus: RequestItem["commercialStatus"], value: string): RequestItem => ({
      ...base,
      id,
      title: `Propuesta ${id}`,
      commercialStatus,
      deliveredValueCop: value,
    });
    vi.mocked(requestsApi.getDashboardMetrics).mockResolvedValue({
      ...metrics,
      entregadas: 5,
      deliveredValueCop: "40000000.00",
    });
    renderBoard([
      delivered("a", "INVOICED", "7500000.00"),
      delivered("b", "INVOICED", "7500000.00"),
      delivered("c", "REJECTED", "5000000.00"),
      delivered("d", "REJECTED", "5000000.00"),
      delivered("e", null, "15000000.00"),
    ]);
    await screen.findByText("$ 40.000.000 COP total entregado");
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "INVOICED" } });
    expect(screen.getByText("Filtradas: 2 de 5 · $ 15.000.000 COP")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "REJECTED" } });
    expect(screen.getByText("Filtradas: 2 de 5 · $ 10.000.000 COP")).toBeInTheDocument();
  });

  it("keeps an aside for the other filters but never repeats the gross-total note under a commercial filter", async () => {
    renderBoard();
    await screen.findByText("$ 10.000.000,30 COP total entregado");
    fireEvent.change(screen.getByLabelText("Filtrar por etiqueta comercial"), { target: { value: "INVOICED" } });
    expect(screen.queryByText(/volumen bruto/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filtrar por empresa"), { target: { value: "Bancolombia" } });
    expect(screen.getByText(/Total visible:.*5\.000\.000,10/)).toBeInTheDocument();
    expect(screen.queryByText(/volumen bruto/)).not.toBeInTheDocument();
  });

  it("shows a colour legend with the same names as the chips and the filter, and a dot for the chosen filter", async () => {
    renderBoard();
    await screen.findByText("$ 10.000.000,30 COP total entregado");
    const legend = screen.getByRole("list", { name: "Leyenda de colores del seguimiento comercial" });
    for (const name of [
      "Aprobación sin contrato",
      "Aprobada con contrato / Orden de servicio",
      "Facturada",
      "Rechazada",
      "Sin etiqueta",
    ]) {
      expect(within(legend).getByText(name)).toBeInTheDocument();
    }
    const select = screen.getByLabelText("Filtrar por etiqueta comercial");
    fireEvent.change(select, { target: { value: "INVOICED" } });
    expect(select.previousElementSibling?.className).toContain("bg-emerald-600");
  });

  it("renders the table chips read-only when the data comes from the local fallback", async () => {
    renderBoard();
    await screen.findByText("$ 10.000.000,30 COP total entregado");
    const table = screen.getByRole("table");
    expect(within(table).getByText("Facturada")).toBeInTheDocument();
    expect(within(table).queryByRole("button", { name: /seguimiento comercial/i })).not.toBeInTheDocument();
  });
});
