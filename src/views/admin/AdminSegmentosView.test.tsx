import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestRouter } from "@/test/router";
import { ThemeProvider } from "@/context/ThemeContext";
import { useAdminSegments } from "@/hooks/use-admin-segments";
import type { CompanySegment, SegmentProfile, SegmentRun, SegmentsResponse } from "@/lib/api/segments";
import AdminSegmentosView from "./AdminSegmentosView";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Admin Prueba", email: "admin@example.test", role: "administrador", roleLabel: "Administrador" },
    status: "authenticated",
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-admin-segments", () => ({ useAdminSegments: vi.fn() }));

// Everything below is invented. The area rate is 30 % on purpose: the view must use the one the API sends.
const run: SegmentRun = {
  id: "run-1",
  source: "EDUCONTINUA_HISTORICO",
  dataCutoffDate: "2026-11-03",
  runDate: "2026-11-11",
  k: 4,
  silhouette: 0.25,
  ariMean: 0.8,
  ariStd: 0.2,
  universeSize: 13,
  areaApprovalRate: 0.3,
  notes: null,
};

const profile = (
  segment: number,
  strategy: string,
  label: string,
  companyCount: number,
  firmCount: number,
  approvalRateMedian: number,
): SegmentProfile => ({
  segment,
  label,
  strategy,
  companyCount,
  firmCount,
  recencyMonthsMedian: segment * 2,
  frequencyMedian: 6,
  typicalValueCop: 16_600_000,
  approvalRateMedian,
  dominantProgramType: null,
  dominantNode: null,
});

// Deliberately not in business order, to check the view sorts them (Cuidar, Crecer, Convertir, Reactivar).
const profiles: SegmentProfile[] = [
  profile(2, "Reactivar", "Dormidos", 2, 1, 0.135),
  profile(1, "Convertir", "Cotizan pero cierran poco", 3, 3, 0.181),
  profile(4, "Cuidar", "Cuentas clave activas", 6, 5, 0.363),
  profile(3, "Crecer", "Pocas propuestas, alto valor", 2, 2, 0.476),
];

const company = (
  id: string,
  companyName: string,
  segment: number,
  frequency: number,
  isFirm: boolean,
  extra: Partial<CompanySegment> = {},
): CompanySegment => ({
  id,
  companyName,
  companyNit: null,
  segment,
  segmentLabel: "",
  recencyDays: 60,
  frequency,
  valueLog10: 7.2,
  approvalRateSmoothed: 0.25,
  approvalRateRaw: 0.2,
  resolvedCount: 4,
  dominantCompanyType: "PRIVADA",
  dominantProgramType: "DIPLOMADO",
  dominantNode: null,
  consistency: isFirm ? 1 : 0.55,
  isFirm,
  ...extra,
});

const companies: CompanySegment[] = [
  // Cuidar: 5 firm, 1 edge. The edge one has the most proposals but must not be in the card.
  company("c1", "Empresa Alfa", 4, 30, true, {
    dominantProgramType: "FORMACION A LA MEDIDA PARA ORGANIZACIONES",
    dominantCompanyType: "PUBLICA",
  }),
  company("c2", "Cañería Ficticia", 4, 20, true),
  company("c3", "Textiles Inventados", 4, 12, true),
  company("c4", "Logística Imaginaria", 4, 9, true),
  company("c5", "Muebles de Prueba", 4, 8, true),
  company("c6", "Borde Con Muchas Propuestas", 4, 99, false),
  // Crecer
  company("c7", "Servicios Beta", 3, 6, true),
  company("c8", "Agro Ejemplo", 3, 5, true),
  // Convertir
  company("c9", "Comercial Gamma", 1, 9, true),
  company("c10", "Industrias Delta", 1, 7, true),
  company("c11", "Alimentos Épsilon", 1, 4, true),
  // Reactivar
  company("c12", "Transportes Zeta", 2, 12, true),
  company("c13", "Constructora Eta", 2, 6, false),
];

const response: SegmentsResponse = { run, profiles, companies };

function mockHook(value: Partial<ReturnType<typeof useAdminSegments>>) {
  vi.mocked(useAdminSegments).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...value,
  } as unknown as ReturnType<typeof useAdminSegments>);
}

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TestRouter route="/admin/segmentos">
          <AdminSegmentosView />
        </TestRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

const rows = () => screen.queryAllByTestId("segment-company-row");
const rowNames = () => rows().map((r) => within(r).getAllByRole("cell")[0].textContent);

describe("AdminSegmentosView", () => {
  beforeEach(() => {
    vi.mocked(useAdminSegments).mockReset();
    mockHook({ data: response });
  });

  it("shows the run date and the note about what the segments are", () => {
    renderView();

    expect(screen.getByRole("heading", { level: 1, name: "Segmentos de clientes" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Segmentos exploratorios calculados sobre el histórico de Educación Continua (empresas con 3 o más propuestas).",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("segment-run-date")).toHaveTextContent("Corrida del 11 de noviembre de 2026");
    expect(screen.getByTestId("segment-run-date")).toHaveTextContent("Datos hasta el 3 de noviembre de 2026");
  });

  it("shows one card per segment in business order with its figures and the area reference from the API", () => {
    renderView();

    const cards = screen.getAllByTestId(/^summary-card-/);
    expect(cards.map((c) => c.getAttribute("aria-label"))).toEqual([
      "Segmento Cuidar: Cuentas clave activas",
      "Segmento Crecer: Pocas propuestas, alto valor",
      "Segmento Convertir: Cotizan pero cierran poco",
      "Segmento Reactivar: Dormidos",
    ]);

    const cuidar = within(cards[0]);
    expect(cuidar.getByText("Cuentas clave activas")).toBeInTheDocument();
    expect(cuidar.getByText("5 firmes")).toBeInTheDocument();
    expect(cuidar.getByText("8 meses")).toBeInTheDocument();
    expect(cuidar.getByText("$ 16.6M COP")).toBeInTheDocument();
    expect(cuidar.getByText("36,3 %")).toBeInTheDocument();
    // 36.3 % against the 30 % that came in the run, not a fixed 27 %.
    expect(cuidar.getByText(/\+6,3 pts sobre el área/)).toBeInTheDocument();
    expect(cuidar.getByText("(30 %)")).toBeInTheDocument();

    expect(within(cards[2]).getByText(/−11,9 pts bajo el área/)).toBeInTheDocument();
  });

  it("lists the three firm companies with most proposals in each card, leaving the edge ones out", () => {
    renderView();

    const cuidar = screen.getByTestId("summary-card-4");
    const top = within(cuidar).getAllByTestId("summary-top-company");
    expect(top).toHaveLength(3);
    expect(top[0]).toHaveTextContent("Empresa Alfa");
    expect(top[0]).toHaveTextContent("30 prop.");
    expect(top[1]).toHaveTextContent("Cañería Ficticia");
    expect(top[2]).toHaveTextContent("Textiles Inventados");
    expect(within(cuidar).queryByText("Borde Con Muchas Propuestas")).not.toBeInTheDocument();
  });

  it("shows only firm companies by default and all of them when 'Solo firmes' is turned off", () => {
    renderView();

    expect(screen.getByTestId("firm-only-switch")).toHaveAttribute("aria-checked", "true");
    // First page of 10; the edge company has the most proposals, so it would be first if it were included.
    expect(rows()).toHaveLength(10);
    expect(rowNames()).not.toContain("Borde Con Muchas Propuestas");
    expect(screen.getByTestId("segment-pagination-counter")).toHaveTextContent("1 – 10 de 11 empresas");

    fireEvent.click(screen.getByTestId("firm-only-switch"));

    expect(screen.getByTestId("firm-only-switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByTestId("segment-pagination-counter")).toHaveTextContent("de 13 empresas");
    expect(screen.getAllByTestId("badge-edge").length).toBeGreaterThan(0);
  });

  it("paginates the table", () => {
    renderView();

    expect(rows()).toHaveLength(10);
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("segment-next-page"));

    expect(rows()).toHaveLength(1);
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByTestId("segment-next-page")).toBeDisabled();
  });

  it("filters the table with 'Ver las N empresas' and the segment chips, with counts that follow the other filters", () => {
    renderView();

    fireEvent.click(within(screen.getByTestId("summary-card-3")).getByRole("button", { name: /Ver las 2 empresas/ }));

    expect(rowNames()).toEqual(["Servicios Beta", "Agro Ejemplo"]);
    const group = screen.getByRole("group", { name: "Filtrar por segmento" });
    expect(within(group).getByRole("button", { name: /Crecer/ })).toHaveAttribute("aria-pressed", "true");
    expect(within(group).getByRole("button", { name: /Todos \(11\)/ })).toHaveAttribute("aria-pressed", "false");
    expect(within(group).getByRole("button", { name: /Cuidar \(5\)/ })).toBeInTheDocument();

    fireEvent.click(within(group).getByRole("button", { name: /Todos/ }));
    expect(screen.getByTestId("segment-pagination-counter")).toHaveTextContent("de 11 empresas");
  });

  it("filters by the bubble of the map and clears the filter on a second click", () => {
    renderView();

    fireEvent.click(screen.getByTestId("bubble-1"));
    expect(screen.getByTestId("bubble-1")).toHaveAttribute("aria-pressed", "true");
    expect(rowNames()).toEqual(["Comercial Gamma", "Industrias Delta", "Alimentos Épsilon"]);

    fireEvent.click(screen.getByTestId("bubble-1"));
    expect(screen.getByTestId("bubble-1")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("segment-pagination-counter")).toHaveTextContent("de 11 empresas");
  });

  it("searches company names ignoring case and accents", () => {
    renderView();

    fireEvent.change(screen.getByLabelText("Buscar empresa"), { target: { value: "CANERIA" } });
    expect(rowNames()).toEqual(["Cañería Ficticia"]);

    fireEvent.change(screen.getByLabelText("Buscar empresa"), { target: { value: "epsilon" } });
    expect(rowNames()).toEqual(["Alimentos Épsilon"]);

    fireEvent.change(screen.getByLabelText("Buscar empresa"), { target: { value: "no existe" } });
    expect(rows()).toHaveLength(0);
    expect(screen.getByText("Ninguna empresa coincide con los filtros.")).toBeInTheDocument();
  });

  it("writes program and company types in readable Spanish, without changing the data", () => {
    renderView();

    const alfa = screen.getAllByTestId("segment-company-row").find((r) => r.textContent?.includes("Empresa Alfa"))!;
    expect(within(alfa).getByText("Formación a la medida para organizaciones")).toBeInTheDocument();
    expect(within(alfa).getByText("Pública")).toBeInTheDocument();
    expect(screen.queryByText(/FORMACION A LA MEDIDA/)).not.toBeInTheDocument();
    expect(within(alfa).getByText("Firme")).toBeInTheDocument();
  });

  it("shows the loading skeleton while the run is loading", () => {
    mockHook({ data: undefined, isLoading: true });
    renderView();

    expect(screen.getByTestId("segmentos-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("segments-overview")).not.toBeInTheDocument();
  });

  it("shows the empty state when no run has been loaded", () => {
    mockHook({ data: { run: null, profiles: [], companies: [] } });
    renderView();

    expect(screen.getByText("Aún no se han cargado segmentos")).toBeInTheDocument();
    expect(screen.queryByTestId("segment-companies-table")).not.toBeInTheDocument();
  });

  it("shows the error state and retries", () => {
    const refetch = vi.fn();
    mockHook({ isError: true, refetch });
    renderView();

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar los segmentos");
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
