import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Company360View } from "./Company360View";
import * as companyHooks from "@/hooks/use-admin-company-360";
import type { CompanyListItem, Company360Response } from "@/lib/api/requests";

// Mock Radix Select components for predictable DOM testing
vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (val: string) => void;
  }) => (
    <div data-testid="mock-select" data-value={value} onClick={() => onValueChange?.("comp-2")}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, "aria-label": ariaLabel }: { children: React.ReactNode; "aria-label"?: string }) => (
    <button type="button" aria-label={ariaLabel}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder || "Select"}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value, onClick }: { children: React.ReactNode; value: string; onClick?: () => void }) => (
    <div role="option" data-value={value} onClick={onClick}>
      {children}
    </div>
  ),
}));

const mockCompanies: CompanyListItem[] = [
  {
    id: "comp-1",
    name: "Bancolombia S.A.",
    nit: "890.903.938-8",
    sector: "Financiero",
    totalProposals: 12,
    deliveredCount: 8,
    deliveredTotalCop: 320000000,
    pipelineTotalCop: 140000000,
  },
  {
    id: "comp-2",
    name: "Nutresa Grupo Empresarial",
    nit: "890.900.050-1",
    sector: "Alimentos",
    totalProposals: 5,
    deliveredCount: 2,
    deliveredTotalCop: 80000000,
    pipelineTotalCop: 60000000,
  },
];

const mockCompany360: Company360Response = {
  company: {
    id: "comp-1",
    name: "Bancolombia S.A.",
    nit: "890.903.938-8",
    sector: "Financiero",
    ciiuCode: "6412",
    type: "Gran Empresa",
    description: "Entidad financiera líder en banca universal y transformación digital.",
    website: "https://www.bancolombia.com",
    address: "Carrera 48 # 26-85, Medellín",
    phone: "+57 (604) 404 0000",
    email: "contacto@bancolombia.com.co",
    contacts: [
      {
        name: "Alejandra Gómez",
        role: "Directora de Talento y Desarrollo",
        email: "agomez@bancolombia.com.co",
        phone: "300 123 4567",
      },
    ],
  },
  metrics: {
    totalProposals: 12,
    deliveredCount: 8,
    pipelineCount: 4,
    deliveredTotalCop: 320000000,
    pipelineTotalCop: 140000000,
    totalPortfolioCop: 460000000,
    totalHours: 360,
    impactedParticipants: 420,
    activeNodesCount: 2,
    firstEngagementDate: "2026-02-15T10:00:00.000Z",
    lastEngagementDate: "2026-04-10T14:30:00.000Z",
    impact: {
      totalHours: 360,
      totalParticipants: 420,
      successMetrics: [
        "Reducción del 25% en tiempos de respuesta de servicio al cliente",
        "Certificación internacional de 45 líderes en agilidad",
      ],
      expectedResults: [
        "Adopción de nuevas metodologías de innovación abierta",
        "Escalamiento de modelos analíticos en toma de decisiones",
      ],
      competencies: ["Liderazgo Adaptativo", "Metodologías Ágiles", "Analítica de Datos", "Transformación Digital"],
    },
  },
  impact: {
    totalHours: 360,
    totalParticipants: 420,
    successMetrics: [
      "Reducción del 25% en tiempos de respuesta de servicio al cliente",
      "Certificación internacional de 45 líderes en agilidad",
    ],
    expectedResults: [
      "Adopción de nuevas metodologías de innovación abierta",
      "Escalamiento de modelos analíticos en toma de decisiones",
    ],
    competencies: ["Liderazgo Adaptativo", "Metodologías Ágiles", "Analítica de Datos", "Transformación Digital"],
  },
  timeline: [
    {
      proposalId: "prop-101",
      code: "PROP-2026-001",
      title: "Programa de Liderazgo Transformacional y Transformación Cultural",
      status: "DELIVERED",
      createdAt: "2026-02-15T10:00:00.000Z",
      updatedAt: "2026-03-20T10:00:00.000Z",
      quarter: "Q1",
      year: 2026,
      serviceType: "Capacitación",
      estimatedValueCop: 85000000,
      nodeName: "Competitividad Organizacional, Economías Creativas",
      kam: {
        id: "kam-1",
        name: "Carlos Mendoza",
        email: "cmendoza@icesi.edu.co",
      },
      academicLeaderName: "Claudia Maitee Bahamón",
      assignedDocenteName: "Dr. Roberto Casas",
    },
    {
      proposalId: "prop-102",
      code: "PROP-2026-045",
      title: "Consultoría de Arquitectura Cloud Nativa y Ciberseguridad",
      status: "IN_COSTING",
      createdAt: "2026-04-10T14:30:00.000Z",
      updatedAt: "2026-04-12T14:30:00.000Z",
      quarter: "Q2",
      year: 2026,
      serviceType: "Consultoría",
      estimatedValueCop: 60000000,
      nodeName: "Inteligencia Artificial y Tecnologías Digitales",
      kam: {
        id: "kam-2",
        name: "Diana Martínez",
        email: "dmartinez@icesi.edu.co",
      },
      academicLeaderName: "Juan Pablo Corrales",
      assignedDocenteName: null,
    },
  ],
  nodeBreakdown: [
    {
      nodeId: "node-1",
      nodeName: "Competitividad Organizacional, Economías Creativas",
      proposalsCount: 8,
      deliveredCount: 6,
      totalValueCop: 280000000,
    },
    {
      nodeId: "node-2",
      nodeName: "Inteligencia Artificial y Tecnologías Digitales",
      proposalsCount: 4,
      deliveredCount: 2,
      totalValueCop: 180000000,
    },
  ],
};

function renderComponent(initialCompanyId?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Company360View initialCompanyId={initialCompanyId} />
    </QueryClientProvider>,
  );
}

describe("Company360View Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when fetching company catalog", () => {
    vi.spyOn(companyHooks, "useAdminCompanies").mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompanies>);

    vi.spyOn(companyHooks, "useAdminCompany360").mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompany360>);

    renderComponent();
    expect(screen.getByTestId("company-360-skeleton")).toBeInTheDocument();
  });

  it("renders error state when company catalog fails to load", () => {
    const refetchMock = vi.fn();
    vi.spyOn(companyHooks, "useAdminCompanies").mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof companyHooks.useAdminCompanies>);

    vi.spyOn(companyHooks, "useAdminCompany360").mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompany360>);

    renderComponent();
    expect(screen.getByTestId("company-360-error")).toBeInTheDocument();
    expect(screen.getByText("No se pudo cargar el listado de empresas")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Reintentar/i });
    fireEvent.click(retryBtn);
    expect(refetchMock).toHaveBeenCalled();
  });

  it("renders empty state when no companies are available", () => {
    vi.spyOn(companyHooks, "useAdminCompanies").mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompanies>);

    vi.spyOn(companyHooks, "useAdminCompany360").mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompany360>);

    renderComponent();
    expect(screen.getByTestId("company-360-empty")).toBeInTheDocument();
    expect(screen.getByText("No hay empresas registradas")).toBeInTheDocument();
  });

  it("renders full company 360 intelligence: header, contacts, 4 KPIs, timeline, and achievements wall", () => {
    vi.spyOn(companyHooks, "useAdminCompanies").mockReturnValue({
      data: mockCompanies,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompanies>);

    vi.spyOn(companyHooks, "useAdminCompany360").mockReturnValue({
      data: mockCompany360,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompany360>);

    renderComponent();

    // 1. Title and header toolbar
    expect(screen.getByText("Inteligencia de Cuenta y Trayectoria (360°)")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Bancolombia S.A." })).toBeInTheDocument();
    expect(screen.getByText("NIT: 890.903.938-8")).toBeInTheDocument();
    expect(screen.getByText("Financiero")).toBeInTheDocument();
    expect(screen.getByText("Gran Empresa")).toBeInTheDocument();
    expect(screen.getByText("(CIIU 6412)")).toBeInTheDocument();
    expect(screen.getByText("Carrera 48 # 26-85, Medellín")).toBeInTheDocument();
    expect(screen.getByText("contacto@bancolombia.com.co")).toBeInTheDocument();
    expect(screen.getByText("www.bancolombia.com")).toBeInTheDocument();

    // 2. Counterparts / Contacts
    expect(screen.getByText("Interlocutores Registrados (1)")).toBeInTheDocument();
    expect(screen.getByText("Alejandra Gómez")).toBeInTheDocument();
    expect(screen.getByText("Directora de Talento y Desarrollo")).toBeInTheDocument();

    // 3. 4 Account KPIs
    expect(screen.getByText("Facturación Entregada")).toBeInTheDocument();
    expect(screen.getByText("$ 320.000.000")).toBeInTheDocument();
    expect(screen.getByText("propuestas finalizadas")).toBeInTheDocument();

    expect(screen.getByText("Tubería Activa")).toBeInTheDocument();
    expect(screen.getByText("$ 140.000.000")).toBeInTheDocument();
    expect(screen.getByText("solicitudes en proceso")).toBeInTheDocument();

    expect(screen.getByText("Horas de Intervención")).toBeInTheDocument();
    expect(screen.getByText("360")).toBeInTheDocument();

    expect(screen.getByText("Personas Impactadas")).toBeInTheDocument();
    expect(screen.getByText("420")).toBeInTheDocument();

    // 4. Vertical Timeline
    expect(screen.getByText("Línea de Tiempo de Intervenciones")).toBeInTheDocument();
    expect(screen.getByText("2 iniciativas")).toBeInTheDocument();

    // Event 1 (Delivered)
    expect(screen.getByText("PROP-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Programa de Liderazgo Transformacional y Transformación Cultural")).toBeInTheDocument();
    expect(screen.getByText("Entregada / Cerrada")).toBeInTheDocument();
    expect(screen.getByText("$ 85.000.000")).toBeInTheDocument();
    expect(screen.getByText("Carlos Mendoza")).toBeInTheDocument();
    expect(screen.getByText("Claudia Maitee Bahamón")).toBeInTheDocument();
    expect(screen.getByText("Dr. Roberto Casas")).toBeInTheDocument();

    // Event 2 (In Costing)
    expect(screen.getByText("PROP-2026-045")).toBeInTheDocument();
    expect(screen.getByText("Consultoría de Arquitectura Cloud Nativa y Ciberseguridad")).toBeInTheDocument();
    expect(screen.getByText("En costeo")).toBeInTheDocument();
    expect(screen.getByText("$ 60.000.000")).toBeInTheDocument();

    // 5. Impact & Achievements Wall
    expect(screen.getByText("Logros y Métricas de Éxito")).toBeInTheDocument();
    expect(screen.getByText("Reducción del 25% en tiempos de respuesta de servicio al cliente")).toBeInTheDocument();
    expect(screen.getByText("Certificación internacional de 45 líderes en agilidad")).toBeInTheDocument();

    expect(screen.getByText("Resultados Esperados")).toBeInTheDocument();
    expect(screen.getByText("Adopción de nuevas metodologías de innovación abierta")).toBeInTheDocument();

    expect(screen.getByText("Habilidades y Competencias Instaladas")).toBeInTheDocument();
    expect(screen.getByText("Liderazgo Adaptativo")).toBeInTheDocument();
    expect(screen.getByText("Metodologías Ágiles")).toBeInTheDocument();
    expect(screen.getByText("Analítica de Datos")).toBeInTheDocument();
    expect(screen.getByText("Transformación Digital")).toBeInTheDocument();

    // 6. Node Penetration Breakdown
    expect(screen.getByText("Penetración por Nodo Académico")).toBeInTheDocument();
    expect(screen.getByText("8 propuestas (67%)")).toBeInTheDocument();
    expect(screen.getByText("4 propuestas (33%)")).toBeInTheDocument();
  });

  it("handles refetching details when clicking refresh button", () => {
    const refetchDetailsMock = vi.fn();
    vi.spyOn(companyHooks, "useAdminCompanies").mockReturnValue({
      data: mockCompanies,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompanies>);

    vi.spyOn(companyHooks, "useAdminCompany360").mockReturnValue({
      data: mockCompany360,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: refetchDetailsMock,
    } as unknown as ReturnType<typeof companyHooks.useAdminCompany360>);

    renderComponent();

    const refreshBtn = screen.getByRole("button", { name: "Actualizar datos de la empresa" });
    fireEvent.click(refreshBtn);

    expect(refetchDetailsMock).toHaveBeenCalled();
  });

  it("handles company with empty proposals and missing metadata gracefully without crashing (edge case)", () => {
    const emptyCompany360: Company360Response = {
      company: {
        id: "comp-empty",
        name: "Empresa Sin Datos S.A.S.",
        nit: "900000000-0",
        sector: null,
        ciiuCode: null,
        type: null,
        description: null,
        website: null,
        address: null,
        phone: null,
        email: null,
        contacts: [],
      },
      metrics: {
        totalProposals: 0,
        deliveredCount: 0,
        pipelineCount: 0,
        deliveredTotalCop: 0,
        pipelineTotalCop: 0,
        totalPortfolioCop: 0,
        totalHours: 0,
        impactedParticipants: 0,
        activeNodesCount: 0,
        firstEngagementDate: null,
        lastEngagementDate: null,
        impact: {
          totalHours: 0,
          totalParticipants: 0,
          successMetrics: [],
          expectedResults: [],
          competencies: [],
        },
      },
      timeline: [],
      impact: {
        totalHours: 0,
        totalParticipants: 0,
        successMetrics: [],
        expectedResults: [],
        competencies: [],
      },
      nodeBreakdown: [],
    };

    vi.spyOn(companyHooks, "useAdminCompanies").mockReturnValue({
      data: [
        {
          id: "comp-empty",
          name: "Empresa Sin Datos S.A.S.",
          nit: "900000000-0",
          totalProposals: 0,
          deliveredCount: 0,
          deliveredTotalCop: 0,
          pipelineTotalCop: 0,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompanies>);

    vi.spyOn(companyHooks, "useAdminCompany360").mockReturnValue({
      data: emptyCompany360,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompany360>);

    renderComponent("comp-empty");

    expect(screen.getByRole("heading", { level: 3, name: "Empresa Sin Datos S.A.S." })).toBeInTheDocument();
    expect(screen.getByText("Sin contactos adicionales vinculados a la cuenta.")).toBeInTheDocument();
    expect(screen.getByText("No hay iniciativas registradas para esta empresa.")).toBeInTheDocument();
    expect(screen.getByText("No se han registrado métricas cuantitativas adicionales aún.")).toBeInTheDocument();
    expect(screen.getByText("No hay resultados cualitativos adicionales documentados.")).toBeInTheDocument();
    expect(screen.getByText("No se han registrado etiquetas de competencias para esta cuenta.")).toBeInTheDocument();
    expect(screen.getByText("Sin vinculación a nodos académicos aún.")).toBeInTheDocument();
  });

  it("allows switching selected company via dropdown", () => {
    const hookSpy = vi.spyOn(companyHooks, "useAdminCompany360").mockReturnValue({
      data: mockCompany360,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompany360>);

    vi.spyOn(companyHooks, "useAdminCompanies").mockReturnValue({
      data: mockCompanies,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof companyHooks.useAdminCompanies>);

    renderComponent("comp-1");

    expect(hookSpy).toHaveBeenCalledWith("comp-1");

    // Click select mock container to trigger change to comp-2
    const selectTrigger = screen.getByTestId("mock-select");
    fireEvent.click(selectTrigger);

    expect(hookSpy).toHaveBeenCalledWith("comp-2");
  });
});
