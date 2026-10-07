import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NewRequest from "./NewRequest";
import { AuthProvider } from "@/context/AuthContext";
import { requestsApi } from "@/lib/api/requests";
import { attachmentsApi } from "@/lib/api/attachments";

// Mock select component for headless jsdom environment
const SelectContext = React.createContext<(val: string) => void>(() => {});

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (val: string) => void }) => (
    <SelectContext.Provider value={onValueChange || (() => {})}>
      <div data-testid="mock-select">{children}</div>
    </SelectContext.Provider>
  ),
  SelectGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <div id={id} data-testid="mock-select-trigger">
      {children}
    </div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => {
    const onValueChange = React.useContext(SelectContext);
    return (
      <button type="button" role="option" data-value={value} onClick={() => onValueChange(value)}>
        {children}
      </button>
    );
  },
  SelectLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectSeparator: () => <hr />,
  SelectScrollUpButton: () => null,
  SelectScrollDownButton: () => null,
}));

vi.mock("@/lib/api/requests", () => ({
  requestsApi: {
    getNodes: vi.fn(),
    create: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    getDashboardMetrics: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
    updateSpecs: vi.fn(),
  },
}));

vi.mock("@/lib/api/attachments", () => ({
  attachmentsApi: {
    upload: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/lib/api/companies", () => ({
  companiesApi: {
    search: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/lib/api/users", () => ({
  usersApi: {
    findByRole: vi.fn().mockResolvedValue([
      {
        id: "leader-uuid-1",
        email: "jcorrales@icesi.edu.co",
        firstName: "Juan Pablo",
        lastName: "Corrales Arenas",
        isActive: true,
      },
    ]),
  },
}));

const mockedRequestsApi = vi.mocked(requestsApi);
const mockedAttachmentsApi = vi.mocked(attachmentsApi);

function renderNewRequest() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <NewRequest />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("NewRequest Wizard (HU 3.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockedRequestsApi.getNodes.mockResolvedValue([
      { id: "node-uuid-1", name: "Inteligencia Artificial y Tecnologías Digitales", description: null },
      { id: "node-uuid-2", name: "Gestión de Innovación", description: null },
    ]);
    mockedRequestsApi.create.mockResolvedValue({
      id: "prop-123",
      code: "PROP-2026-0001",
      title: "Capacitación en IA",
      companyId: "comp-1",
      contactId: null,
      nodeId: "node-uuid-1",
      generalDescription: null,
      creatorId: "u1",
      productLeaderId: null,
      priority: "ALTA",
      comments: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      company: {
        id: "comp-1",
        name: "Empresa Test S.A.S",
        nit: null,
        description: null,
        website: null,
        area: null,
        type: "PRIVADA",
        sector: null,
      },
      workflow: null,
      program: null,
      contact: null,
      node: {
        id: "node-uuid-1",
        name: "Inteligencia Artificial y Tecnologías Digitales",
        description: null,
      },
      creator: {
        id: "u1",
        email: "andrea@icesi.edu.co",
        firstName: "Andrea",
        lastName: "Martínez",
      },
      productLeader: null,
      logistics: null,
      economics: [],
      attachments: [],
      assignments: [],
      negotiationRounds: [],
    });
  });

  it("renders the wizard header and first step (Empresa)", () => {
    renderNewRequest();
    expect(screen.getByText("Registro de Solicitud Comercial")).toBeInTheDocument();
    expect(screen.getByText(/1\. Datos de la Empresa/i)).toBeInTheDocument();
  });

  it("validates required fields on step 1 before proceeding", () => {
    renderNewRequest();
    const continueBtn = screen.getByRole("button", { name: /Continuar/i });
    fireEvent.click(continueBtn);

    // Validation errors should appear
    expect(screen.getByText(/Ingresa o selecciona la Razón Social de la empresa para continuar/i)).toBeInTheDocument();
  });

  it("navigates through steps and submits successfully to the backend API", async () => {
    renderNewRequest();

    // Step 1: Fill company name and type
    const companyInput = screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i);
    fireEvent.change(companyInput, { target: { value: "Empresa Test S.A.S" } });

    // Select tipo empresa (Privada)
    const privadaOption = screen.getByRole("button", { name: "Privada" });
    fireEvent.click(privadaOption);

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText(/2\. Contacto del Cliente/i)).toBeInTheDocument();

    // Step 2 is optional, can proceed directly -> Step 3
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText(/3\. Requerimiento del Servicio/i)).toBeInTheDocument();

    // Step 3: Select nodo, fill title and select type
    const nodeOption = await screen.findByRole("option", { name: /Gestión de Innovación/i });
    fireEvent.click(nodeOption);

    const titleInput = screen.getByLabelText(/Título o nombre de la propuesta/i);
    fireEvent.change(titleInput, { target: { value: "Capacitación en IA para Directivos" } });

    // Select tipoReq from options
    const tipoCapacitacion = screen.getByRole("option", { name: "Capacitación" });
    fireEvent.click(tipoCapacitacion);

    // Step 3 -> Step 4
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText(/4\. Formación Previa/i)).toBeInTheDocument();

    // Step 4: Fill formacion previa (No) and urgency (Alta -> Alto)
    const prevNo = screen.getByRole("button", { name: "No" });
    fireEvent.click(prevNo);

    const urgencyAlta = screen.getByRole("button", { name: /Alto/i });
    fireEvent.click(urgencyAlta);

    // Step 4 -> Step 5
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText(/5\. Observaciones y Documentos de Apoyo/i)).toBeInTheDocument();

    // Step 5: Submit request
    const submitBtn = screen.getByRole("button", { name: /Enviar solicitud a Líder de Producto/i });
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockedRequestsApi.create).toHaveBeenCalledTimes(1);
    });

    const callPayload = mockedRequestsApi.create.mock.calls[0][0];
    expect(callPayload.companyName).toBe("Empresa Test S.A.S");
    expect(callPayload.companyType).toBe("PRIVADA");
    expect(callPayload.nodeId).toBe("node-uuid-2");
    expect(callPayload.programName).toBe("Capacitación en IA para Directivos");
    expect(callPayload.requestType).toBe("CAPACITACION");
    expect(callPayload.priority).toBe("ALTA");
    expect(callPayload.hasPreviousTraining).toBe(false);

    // Success screen should be rendered
    await waitFor(() => {
      expect(screen.getByText(/Solicitud registrada con éxito/i)).toBeInTheDocument();
    });
  }, 20000);

  it("resolves and attaches productLeaderId to payload when node with suggested leader is selected (UI-001)", async () => {
    renderNewRequest();

    // Step 1: Fill company name and type
    const companyInput = screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i);
    fireEvent.change(companyInput, { target: { value: "Empresa con Líder S.A.S" } });
    const privadaOption = screen.getByRole("button", { name: "Privada" });
    fireEvent.click(privadaOption);

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    // Step 3: Select node that maps to Juan Pablo Corrales Arenas -> leader-uuid-1
    const nodeOption = await screen.findByRole("option", { name: /Inteligencia Artificial y Tecnologías Digitales/i });
    fireEvent.click(nodeOption);

    const titleInput = screen.getByLabelText(/Título o nombre de la propuesta/i);
    fireEvent.change(titleInput, { target: { value: "Diplomado en IA Generativa" } });

    const tipoCapacitacion = screen.getByRole("option", { name: "Capacitación" });
    fireEvent.click(tipoCapacitacion);

    // Step 3 -> Step 4
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    // Step 4: Fill formacion previa (No) and urgency (Alta -> Alto)
    const prevNo = screen.getByRole("button", { name: "No" });
    fireEvent.click(prevNo);
    const urgencyAlta = screen.getByRole("button", { name: /Alto/i });
    fireEvent.click(urgencyAlta);

    // Step 4 -> Step 5
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    // Step 5: Submit request
    const submitBtn = screen.getByRole("button", { name: /Enviar solicitud a Líder de Producto/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockedRequestsApi.create).toHaveBeenCalledTimes(1);
    });

    const callPayload = mockedRequestsApi.create.mock.calls[0][0];
    expect(callPayload.nodeId).toBe("node-uuid-1");
    expect(callPayload.productLeaderId).toBe("leader-uuid-1");
  }, 20000);

  it("uploads the real File object, not its metadata, after the proposal is created (UI-006)", async () => {
    const { container } = renderNewRequest();

    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa con Adjunto S.A.S" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Privada" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    fireEvent.click(await screen.findByRole("option", { name: /Gestión de Innovación/i }));
    fireEvent.change(screen.getByLabelText(/Título o nombre de la propuesta/i), {
      target: { value: "Capacitación con adjunto" },
    });
    fireEvent.click(screen.getByRole("option", { name: "Capacitación" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: /Alto/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    const pdf = new File(["contenido"], "cotizacion.pdf", { type: "application/pdf" });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [pdf] } });

    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud a Líder de Producto/i }));

    await waitFor(() => {
      expect(mockedAttachmentsApi.upload).toHaveBeenCalledTimes(1);
    });

    const [proposalId, payload] = mockedAttachmentsApi.upload.mock.calls[0];
    expect(proposalId).toBe("prop-123");
    expect(payload.file).toBeInstanceOf(File);
    expect(payload.file.name).toBe("cotizacion.pdf");
    expect(payload.category).toBe("INTERNAL");
  }, 20000);
});
