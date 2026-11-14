import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestRouter } from "@/test/router";
import { ThemeProvider } from "@/context/ThemeContext";
import AdminDashboardView from "./AdminDashboardView";
import AdminKamsView from "./AdminKamsView";
import AdminNodosView from "./AdminNodosView";
import AdminEmpresasView from "./AdminEmpresasView";
import AdminSolicitudesView from "./AdminSolicitudesView";

const mockAuth = vi.hoisted(() => ({
  user: {
    name: "Admin Sistema",
    email: "admin@icesi.edu.co",
    role: "administrador",
    roleLabel: "Administrador Icesi",
  },
  status: "authenticated",
  logout: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuth.user,
    status: mockAuth.status,
    logout: mockAuth.logout,
  }),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as adminHook from "@/hooks/use-admin-dashboard";
import * as targetsHook from "@/hooks/use-sales-targets";

vi.mock("@/hooks/use-admin-dashboard");
vi.mock("@/hooks/use-sales-targets");
vi.mock("@/hooks/use-requests", () => ({
  useRequests: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-admin-company-360", () => ({
  useAdminCompanies: () => ({
    data: [
      {
        id: "comp-1",
        name: "Banco W",
        nit: "890300279-4",
        sector: "Banca y Finanzas",
        type: "PRIVADA",
        totalProposals: 7,
        deliveredCount: 3,
        deliveredTotalCop: 375968000,
        pipelineTotalCop: 46176000,
        wonTotalCop: 375968000,
        winRatePercentage: 89.1,
      },
    ],
    isLoading: false,
  }),
  useAdminCompany360: () => ({
    data: null,
    isLoading: false,
  }),
}));

vi.mock("@/components/dashboard/AdminDashboard", () => ({
  AdminDashboard: () => <div data-testid="mock-admin-dashboard">Tablero Ejecutivo Macro</div>,
}));

vi.mock("@/components/dashboard/Company360View", () => ({
  Company360View: () => <div data-testid="mock-company-360">Inteligencia 360 Empresas</div>,
}));

function renderWithShell(ui: React.ReactElement, route: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TestRouter route={route}>{ui}</TestRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("Admin Submodule Views (Phase 2 Routing & Shells)", () => {
  beforeEach(() => {
    mockAuth.logout.mockReset();
    vi.spyOn(adminHook, "useAdminDashboard").mockReturnValue({
      data: {
        timeframe: {
          selectedYear: 2026,
          selectedQuarter: null,
          availableYears: [2025, 2026],
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2026-12-31T23:59:59.999Z",
        },
        macroKpis: {
          deliveredTotalCop: 2000000000,
          pipelineTotalCop: 1500000000,
          deliveredCount: 8,
          pipelineCount: 12,
          totalProposals: 20,
          winRatePercentage: 40,
          averageCycleDays: 6,
          wonTotalCop: 2000000000,
          wonCount: 8,
          targetCop: 2516000000,
          targetCompliancePercentage: 79.5,
        },
        conversionFunnel: [],
        kamRanking: [
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
            winRatePercentage: 25,
            targetCop: 1000000000,
            targetCompliancePercentage: 110,
            shareOfTotalSalesPercentage: 55,
          },
          {
            kamId: "kam-2",
            name: "Carlos Gómez",
            email: "carlos.gomez@icesi.edu.co",
            totalProposals: 10,
            deliveredCount: 4,
            deliveredTotalCop: 900000000,
            pipelineCount: 6,
            pipelineTotalCop: 700000000,
            wonCount: 4,
            wonTotalCop: 900000000,
            winRatePercentage: 30,
            targetCop: 1000000000,
            targetCompliancePercentage: 90,
            shareOfTotalSalesPercentage: 45,
          },
        ],
        nodeDistribution: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof adminHook.useAdminDashboard>);

    vi.spyOn(targetsHook, "useSalesTargets").mockReturnValue({
      data: {
        year: 2026,
        centerTarget: {
          annualTargetCop: 2516000000,
          annualTargetProposals: 45,
          monthlyTargets: [],
        },
        kamTargets: [],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof targetsHook.useSalesTargets>);
  });

  it("renders AdminDashboardView (Submódulo 1) with AppShell and executive dashboard", () => {
    renderWithShell(<AdminDashboardView />, "/admin/dashboard");
    expect(screen.getByTestId("admin-resumen-view")).toBeInTheDocument();
    expect(screen.getByTestId("mock-admin-dashboard")).toBeInTheDocument();
  });

  it("renders AdminKamsView (Submódulo 2) with KPIs and targets placeholder", () => {
    renderWithShell(<AdminKamsView />, "/admin/kams");
    expect(screen.getByTestId("admin-kams-view")).toBeInTheDocument();
    expect(screen.getByText("Rendimiento Comercial & Metas de Venta")).toBeInTheDocument();
    expect(screen.getByText("KAM Líder en Ventas")).toBeInTheDocument();
    expect(screen.getByText("Mayor Efectividad (Win Rate)")).toBeInTheDocument();
    expect(screen.getByText("Meta Anual de la Universidad")).toBeInTheDocument();
  });

  it("renders AdminNodosView (Submódulo 3) with academic capacity overview", () => {
    renderWithShell(<AdminNodosView />, "/admin/nodos");
    expect(screen.getByTestId("admin-nodos-view")).toBeInTheDocument();
    expect(screen.getByText("Nodos Temáticos & Portafolio Académico")).toBeInTheDocument();
    expect(screen.getByText("Nodo con Mayor Recaudo")).toBeInTheDocument();
    expect(screen.getByText("Líder de Producto Destacado")).toBeInTheDocument();
    expect(screen.getByText("Tiempo Promedio en Fábrica")).toBeInTheDocument();
    expect(screen.getByText("Nodos Temáticos & Mix de Servicios")).toBeInTheDocument();
  });

  it("renders AdminEmpresasView (Submódulo 4) with directory ranking and 360 view tab", () => {
    renderWithShell(<AdminEmpresasView />, "/admin/empresas");
    expect(screen.getByTestId("admin-empresas-view")).toBeInTheDocument();
    expect(screen.getByText("Inteligencia 360° de Empresas Aliadas")).toBeInTheDocument();
    expect(screen.getByText("Top Cliente en Facturación")).toBeInTheDocument();
    expect(screen.getByTestId("company-directory-ranking-table")).toBeInTheDocument();

    // Switch to Ficha 360 tab
    fireEvent.click(screen.getByText("Ficha de Inteligencia 360°"));
    expect(screen.getByTestId("mock-company-360")).toBeInTheDocument();
  });

  it("renders AdminSolicitudesView (Submódulo 5) with search bar and audit shell", () => {
    renderWithShell(<AdminSolicitudesView />, "/admin/solicitudes");
    expect(screen.getByTestId("admin-solicitudes-view")).toBeInTheDocument();
    expect(screen.getByText("Gestión y Auditoría Global de Solicitudes")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por código/i)).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
    expect(screen.getByText(/exportar excel/i)).toBeInTheDocument();
  });
});
