import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminDashboard } from "./AdminDashboard";
import * as adminHook from "@/hooks/use-admin-dashboard";
import type { AdminDashboardData } from "@/lib/api/requests";

vi.mock("@/hooks/use-admin-dashboard");

const SelectContext = React.createContext<(val: string) => void>(() => {});

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (val: string) => void;
  }) => (
    <SelectContext.Provider value={onValueChange || (() => {})}>
      <div data-testid="mock-select">{children}</div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span>SelectValue</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => {
    const onValueChange = React.useContext(SelectContext);
    return (
      <button type="button" role="option" data-value={value} onClick={() => onValueChange(value)}>
        {children}
      </button>
    );
  },
}));

const mockAdminData: AdminDashboardData = {
  timeframe: {
    selectedYear: 2026,
    selectedQuarter: null,
    availableYears: [2025, 2026],
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.999Z",
  },
  macroKpis: {
    deliveredTotalCop: 203500000,
    pipelineTotalCop: 262000000,
    deliveredCount: 5,
    pipelineCount: 28,
    totalProposals: 33,
    winRatePercentage: 15.2,
    averageCycleDays: 7.6,
  },
  conversionFunnel: [
    {
      stage: "NEW",
      label: "Nueva / Entregada al Líder",
      count: 11,
      totalCop: 0,
      percentage: 33,
    },
    {
      stage: "IN_PROGRESS",
      label: "En Experto",
      count: 9,
      totalCop: 0,
      percentage: 27,
    },
    {
      stage: "IN_COSTING",
      label: "En Costeo",
      count: 5,
      totalCop: 154500000,
      percentage: 15,
    },
    {
      stage: "READY_FOR_DELIVERY",
      label: "Lista para Entregar",
      count: 3,
      totalCop: 107500000,
      percentage: 9,
    },
    {
      stage: "DELIVERED",
      label: "Entregada al Cliente",
      count: 5,
      totalCop: 203500000,
      percentage: 15,
    },
  ],
  kamRanking: [
    {
      kamId: "kam-1",
      name: "Diana Martínez",
      email: "diana.martinez@icesi.edu.co",
      totalProposals: 29,
      deliveredCount: 4,
      deliveredTotalCop: 175500000,
      pipelineCount: 25,
      pipelineTotalCop: 262000000,
    },
    {
      kamId: "kam-2",
      name: "Carlos Ramírez",
      email: "carlos.ramirez@icesi.edu.co",
      totalProposals: 4,
      deliveredCount: 1,
      deliveredTotalCop: 28000000,
      pipelineCount: 3,
      pipelineTotalCop: 0,
    },
  ],
  nodeDistribution: [
    {
      nodeId: "node-1",
      name: "Gestión de Innovación",
      totalProposals: 12,
      deliveredTotalCop: 94000000,
      pipelineTotalCop: 48000000,
    },
    {
      nodeId: "node-2",
      name: "IA+ Tech Digital",
      totalProposals: 6,
      deliveredTotalCop: 0,
      pipelineTotalCop: 0,
    },
  ],
};

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminDashboard
        user={{
          name: "Lina Ayala",
          email: "admin@icesi.edu.co",
          roleLabel: "Administrador",
        }}
      />
    </QueryClientProvider>,
  );
}

describe("AdminDashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when fetching data", () => {
    vi.spyOn(adminHook, "useAdminDashboard").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof adminHook.useAdminDashboard>);

    renderComponent();
    expect(screen.getByTestId("admin-dashboard-skeleton")).toBeInTheDocument();
  });

  it("renders error state with retry button on failure", () => {
    const refetchMock = vi.fn();
    vi.spyOn(adminHook, "useAdminDashboard").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof adminHook.useAdminDashboard>);

    renderComponent();
    expect(screen.getByText("No se pudo cargar el panel administrativo")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /Reintentar/i });
    fireEvent.click(retryBtn);
    expect(refetchMock).toHaveBeenCalled();
  });

  it("renders executive dashboard KPIs, conversion funnel, KAMs and Nodes", () => {
    vi.spyOn(adminHook, "useAdminDashboard").mockReturnValue({
      data: mockAdminData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof adminHook.useAdminDashboard>);

    renderComponent();

    // 1. Header
    expect(screen.getByText("Hola, Lina")).toBeInTheDocument();
    expect(screen.getByText("Administrador Icesi")).toBeInTheDocument();

    // 2. Macro KPIs
    expect(screen.getByText("Total entregado")).toBeInTheDocument();
    expect(screen.getAllByText("$ 203.5M COP").length).toBe(2);
    expect(screen.getByText("5 propuestas radicadas")).toBeInTheDocument();

    expect(screen.getByText("Tubería activa")).toBeInTheDocument();
    expect(screen.getAllByText("$ 262M COP").length).toBe(2);
    expect(screen.getByText("28 en proceso")).toBeInTheDocument();

    expect(screen.getAllByText("33").length).toBeGreaterThan(0);
    expect(screen.getByText(/15.2% tasa de entrega/)).toBeInTheDocument();

    expect(screen.getByText("7.6 días")).toBeInTheDocument();

    // 3. Conversion Funnel
    expect(screen.getByText("Embudo de Conversión Comercial")).toBeInTheDocument();
    expect(screen.getByText("Nueva / Entregada al Líder")).toBeInTheDocument();
    expect(screen.getByText("En Experto")).toBeInTheDocument();
    expect(screen.getByText("En Costeo")).toBeInTheDocument();
    expect(screen.getByText("Lista para Entregar")).toBeInTheDocument();
    expect(screen.getByText("Entregada al Cliente")).toBeInTheDocument();

    // 4. KAMs Table
    expect(screen.getByText("Rendimiento por Ejecutivo Comercial (KAM)")).toBeInTheDocument();
    expect(screen.getByText("Diana Martínez")).toBeInTheDocument();
    expect(screen.getByText("diana.martinez@icesi.edu.co")).toBeInTheDocument();
    expect(screen.getByText("Carlos Ramírez")).toBeInTheDocument();
    expect(screen.getByText("carlos.ramirez@icesi.edu.co")).toBeInTheDocument();

    // 5. Node Distribution
    expect(screen.getByText("Demanda por Nodo")).toBeInTheDocument();
    expect(screen.getByText("Gestión de Innovación")).toBeInTheDocument();
    expect(screen.getByText("IA+ Tech Digital")).toBeInTheDocument();
  });

  it("allows selecting quarters to filter the dashboard", () => {
    const hookSpy = vi.spyOn(adminHook, "useAdminDashboard").mockReturnValue({
      data: mockAdminData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof adminHook.useAdminDashboard>);

    renderComponent();

    // Click on Q2
    const q2Button = screen.getByRole("button", { name: "Q2 (Abr - Jun)" });
    fireEvent.click(q2Button);

    expect(hookSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        quarter: 2,
      }),
    );

    // Click on Todo el año
    const allYearButton = screen.getByRole("button", { name: "Todo el año" });
    fireEvent.click(allYearButton);

    expect(hookSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        quarter: undefined,
      }),
    );
  });

  it("allows changing year from the dropdown", () => {
    const hookSpy = vi.spyOn(adminHook, "useAdminDashboard").mockReturnValue({
      data: mockAdminData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof adminHook.useAdminDashboard>);

    renderComponent();

    const option2025 = screen.getByRole("option", { name: "2025" });
    fireEvent.click(option2025);

    expect(hookSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        year: 2025,
      }),
    );
  });
});
