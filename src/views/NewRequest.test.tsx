import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TestRouter } from "@/test/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NewRequest from "./NewRequest";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { RequireAuth } from "@/components/RequireAuth";
import { requestsApi } from "@/lib/api/requests";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";
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

// The production wizard mounts only after a real session is restored. Keep that
// integration boundary here: an anonymous /auth/me response must not race the
// directory queries of an artificially mounted private screen.
vi.mock("@/lib/api/auth", () => ({
  authApi: {
    getMe: vi.fn().mockImplementation(() =>
      Promise.resolve({
        id: "u1",
        email: "andrea@icesi.edu.co",
        firstName: "Andrea",
        lastName: "Martínez",
        roles: ["KAM"],
        expiresAt: Date.now() + 60000,
      }),
    ),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

async function renderNewRequest({ withContact = true }: { withContact?: boolean } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <TestRouter>
        <ThemeProvider>
          <AuthProvider>
            <RequireAuth>
              <NewRequest />
            </RequireAuth>
          </AuthProvider>
        </ThemeProvider>
      </TestRouter>
    </QueryClientProvider>,
  );
  await screen.findByLabelText(/Razón Social \/ Nombre de la Empresa/i);
  // Valid contact is a prerequisite for tests focused on other wizard behaviors.
  if (withContact)
    fireEvent.change(screen.getByLabelText(/Correo corporativo/i), { target: { value: "info@empresa.co" } });
  return result;
}

// The product leader is mandatory in step 3 and the node is an optional, independent extra.
async function chooseLeader() {
  // Wait for the backend directory: until then the list is the offline fallback and gets replaced when it loads.
  await waitFor(() => expect(document.querySelector('[data-value="leader-uuid-1"]')).not.toBeNull());
  fireEvent.click(document.querySelector('[data-value="leader-uuid-1"]') as HTMLElement);
}

async function goToStep3() {
  await renderNewRequest();
  fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
    target: { value: "Empresa Test S.A.S" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Privada" }));
  fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
  fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
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

  it("can leave the company step without legal nature or NIT when the company name is present", async () => {
    await renderNewRequest();
    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa nueva" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText("2. Contacto del Cliente")).toBeInTheDocument();
  });

  it("requires a usable channel across company and contact before leaving step 2", async () => {
    await renderNewRequest({ withContact: false });
    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa nueva" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Privada" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    fireEvent.change(screen.getByLabelText(/Correo electrónico institucional/i), { target: { value: "Pendiente" } });
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText("2. Contacto del Cliente")).toBeInTheDocument();
    expect(screen.getByText(/Deja al menos un teléfono o correo válido/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Correo electrónico institucional/i), {
      target: { value: "interlocutor@empresa.co" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText(/3\. Requerimiento del Servicio/i)).toBeInTheDocument();
  });

  it("blocks step 1 when the NIT check digit does not match and says which one it should be", async () => {
    await renderNewRequest();
    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa Test S.A.S" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Privada" }));
    fireEvent.change(screen.getByLabelText(/NIT de la Empresa/i), { target: { value: "890903938-5" } });
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    expect(screen.getAllByText(/El dígito de verificación no coincide \(debería ser 8\)/).length).toBeGreaterThan(0);
    expect(screen.getByText(/1\. Datos de la Empresa/i)).toBeInTheDocument();
  });

  it("shows a valid NIT formatted when leaving the field and a 9-digit one gets its check digit", async () => {
    await renderNewRequest();
    const nit = screen.getByLabelText(/NIT de la Empresa/i) as HTMLInputElement;
    fireEvent.change(nit, { target: { value: "890903938" } });
    fireEvent.blur(nit);
    expect(nit.value).toBe("890.903.938-8");
  });

  it("does not validate the NIT when it is empty (it is optional)", async () => {
    await renderNewRequest();
    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa Test S.A.S" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Privada" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText(/2\. Contacto del Cliente/i)).toBeInTheDocument();
  });

  it("renders the wizard header and first step (Empresa)", async () => {
    await renderNewRequest();
    expect(screen.getByText("Registro de Solicitud Comercial")).toBeInTheDocument();
    expect(screen.getByText(/1\. Datos de la Empresa/i)).toBeInTheDocument();
  });

  it("validates required fields on step 1 before proceeding", async () => {
    await renderNewRequest();
    const continueBtn = screen.getByRole("button", { name: /Continuar/i });
    fireEvent.click(continueBtn);

    // Validation errors should appear
    expect(screen.getByText(/Ingresa o selecciona la Razón Social de la empresa para continuar/i)).toBeInTheDocument();
  });

  it("cannot skip unanswered required steps by clicking the final step", async () => {
    await renderNewRequest();
    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa con información pendiente" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Privada" }));
    fireEvent.click(screen.getByRole("button", { name: /Paso 5 Observaciones/i }));

    expect(screen.getByText(/3\. Requerimiento del Servicio/i)).toBeInTheDocument();
    expect(screen.getByText(/Selecciona el Líder de Producto que atenderá la solicitud/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enviar solicitud a Líder de Producto/i })).not.toBeInTheDocument();
    expect(mockedRequestsApi.create).not.toHaveBeenCalled();
  });

  it("navigates through steps and submits successfully to the backend API", async () => {
    await renderNewRequest();

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

    // Step 3: Select the leader (mandatory) and a node (optional), fill title and select type
    await chooseLeader();
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

    // The proposal history no longer appears mid-form (C-16): it lives in Step 5
    expect(screen.queryByText(/Buscador de Propuestas Entregadas y en Proceso/i)).not.toBeInTheDocument();

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

    // The proposal history is shown at the end of the form, right before the submit button
    const historyHeading = screen.getByText(/Buscador de Propuestas Entregadas y en Proceso/i);
    expect(historyHeading.compareDocumentPosition(submitBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockedRequestsApi.create).toHaveBeenCalledTimes(1);
    });

    const callPayload = mockedRequestsApi.create.mock.calls[0][0];
    expect(callPayload.companyName).toBe("Empresa Test S.A.S");
    expect(callPayload.companyType).toBe("PRIVADA");
    expect(callPayload.nodeId).toBe("node-uuid-2");
    expect(callPayload.productLeaderId).toBe("leader-uuid-1");
    expect(callPayload.programName).toBe("Capacitación en IA para Directivos");
    expect(callPayload.requestType).toBe("CAPACITACION");
    expect(callPayload.priority).toBe("ALTA");
    expect(callPayload.hasPreviousTraining).toBe(false);

    // Success screen should be rendered
    await waitFor(() => {
      expect(screen.getByText(/Solicitud registrada con éxito/i)).toBeInTheDocument();
    });
  }, 20000);

  it("sends the leader and the node the KAM picked, each on its own (UI-001)", async () => {
    await renderNewRequest();

    // Step 1: Fill company name and type
    const companyInput = screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i);
    fireEvent.change(companyInput, { target: { value: "Empresa con Líder S.A.S" } });
    const privadaOption = screen.getByRole("button", { name: "Privada" });
    fireEvent.click(privadaOption);

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    // Step 3: pick the leader and, separately, a node that used to drag a different leader along
    await chooseLeader();
    const nodeOption = await screen.findByRole("option", { name: /Gestión de Innovación/i });
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
    expect(callPayload.nodeId).toBe("node-uuid-2");
    expect(callPayload.productLeaderId).toBe("leader-uuid-1");
  }, 20000);

  it("accepts Pending as an unavailable NIT while a valid contact exists", async () => {
    await renderNewRequest();
    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa nueva" },
    });
    fireEvent.change(screen.getByLabelText(/NIT de la Empresa/i), { target: { value: "Pendiente" } });
    fireEvent.blur(screen.getByLabelText(/NIT de la Empresa/i));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText("2. Contacto del Cliente")).toBeInTheDocument();
    expect(screen.queryByText(/El NIT debe tener/)).not.toBeInTheDocument();
  });

  it("keeps titles shorter than five characters in the requirement step", async () => {
    await goToStep3();
    await chooseLeader();
    fireEvent.change(screen.getByLabelText(/Título o nombre de la propuesta/i), { target: { value: "IA" } });
    fireEvent.click(screen.getByRole("option", { name: "Capacitación" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText("Ingresa un título de al menos 5 caracteres para continuar.")).toBeInTheDocument();
    expect(screen.queryByText("4. Formación Previa")).not.toBeInTheDocument();
  });

  it("starts step 3 with no leader and no node chosen, and without any node suggestion", async () => {
    await goToStep3();
    expect(await screen.findByText("Seleccionar líder de producto")).toBeInTheDocument();
    expect(screen.getByText("Seleccionar nodo (opcional)")).toBeInTheDocument();
    expect(screen.queryByText(/sugerido/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Restablecer/i)).not.toBeInTheDocument();
  });

  it("requires the leader to leave step 3, even with a node chosen, and never drags one from the other", async () => {
    await goToStep3();
    fireEvent.click(await screen.findByRole("option", { name: /Inteligencia Artificial y Tecnologías Digitales/i }));
    fireEvent.change(screen.getByLabelText(/Título o nombre de la propuesta/i), { target: { value: "Taller" } });
    fireEvent.click(screen.getByRole("option", { name: "Capacitación" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    // The node that used to suggest Juan Pablo Corrales Arenas does not choose him any more
    expect(screen.getAllByText(/Selecciona el Líder de Producto que atenderá la solicitud/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/3\. Requerimiento del Servicio/i)).toBeInTheDocument();
    expect(mockedRequestsApi.create).not.toHaveBeenCalled();

    // Choosing the leader afterwards leaves the node as it was and lets the KAM continue
    await chooseLeader();
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText(/4\. Formación Previa/i)).toBeInTheDocument();
  });

  it("lets the KAM send the request with a leader and no node", async () => {
    await goToStep3();
    await chooseLeader();
    fireEvent.change(screen.getByLabelText(/Título o nombre de la propuesta/i), { target: { value: "Taller" } });
    fireEvent.click(screen.getByRole("option", { name: "Capacitación" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: /Alto/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    // The summary names the leader and says there is no node
    expect(screen.getByText("Líder de Producto:")).toBeInTheDocument();
    expect(screen.getAllByText("Juan Pablo Corrales Arenas").length).toBeGreaterThan(0);
    expect(screen.getByText("Sin nodo")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud a Líder de Producto/i }));
    await waitFor(() => expect(mockedRequestsApi.create).toHaveBeenCalledTimes(1));
    const payload = mockedRequestsApi.create.mock.calls[0][0];
    expect(payload.productLeaderId).toBe("leader-uuid-1");
    expect(payload.nodeId).toBeUndefined();
  }, 20000);

  // UX H1/H5/H6/H7 (docs/14-spec-mejoras-ux.md)
  describe("UX: final review and form affordances", () => {
    async function fillUpToSummary() {
      await goToStep3();
      await chooseLeader();
      fireEvent.change(screen.getByLabelText(/Título o nombre de la propuesta/i), {
        target: { value: "Taller de analítica" },
      });
      fireEvent.click(screen.getByRole("option", { name: "Capacitación" }));
      fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
      fireEvent.click(screen.getByRole("button", { name: "No" }));
      fireEvent.click(screen.getByRole("button", { name: /Alto/i }));
      fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    }

    it("shows title, urgency and contact channel in the final summary before sending", async () => {
      await fillUpToSummary();
      const summary = screen.getByRole("region", { name: /Resumen de la Solicitud/i });
      expect(summary).toHaveTextContent("Taller de analítica");
      expect(summary).toHaveTextContent("info@empresa.co");
      expect(summary).toHaveTextContent(/Urgencia:\s*Alta/i);
      expect(summary).toHaveTextContent(/Documentos adjuntos:\s*Ninguno/i);
    });

    it("lets the KAM go back to the matching step from the summary and keeps what was typed", async () => {
      await fillUpToSummary();
      fireEvent.click(screen.getByRole("button", { name: "Modificar requerimiento" }));
      expect(screen.getByText(/3\. Requerimiento del Servicio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Título o nombre de la propuesta/i)).toHaveValue("Taller de analítica");
    });

    it("never shows a Pendiente placeholder as the contact channel", async () => {
      await goToStep3();
      await chooseLeader();
      fireEvent.change(screen.getByLabelText(/Título o nombre de la propuesta/i), { target: { value: "Taller" } });
      fireEvent.click(screen.getByRole("option", { name: "Capacitación" }));
      fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
      fireEvent.click(screen.getByRole("button", { name: "No" }));
      fireEvent.click(screen.getByRole("button", { name: /Alto/i }));
      fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
      const summary = screen.getByRole("region", { name: /Resumen de la Solicitud/i });
      expect(summary).not.toHaveTextContent(/Pendiente/i);
    });

    it("names the remove button of each attached file", async () => {
      await fillUpToSummary();
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["contenido"], "rfp.pdf", { type: "application/pdf" });
      fireEvent.change(input, { target: { files: [file] } });
      expect(await screen.findByRole("button", { name: "Quitar rfp.pdf" })).toBeInTheDocument();
    });

    it("gives phone fields the telephone keyboard", async () => {
      await renderNewRequest();
      const phone = screen.getByLabelText(/Teléfono corporativo/i);
      expect(phone).toHaveAttribute("type", "tel");
      expect(phone).toHaveAttribute("inputmode", "tel");
    });

    it("names the exit control for screen readers", async () => {
      await renderNewRequest();
      expect(screen.getByRole("link", { name: "Salir del registro de solicitud" })).toBeInTheDocument();
    });

    it("only claims the draft is saved after it was really saved", async () => {
      await renderNewRequest();
      expect(screen.queryByText(/Borrador guardado a las/i)).not.toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
        target: { value: "Empresa Test S.A.S" },
      });
      expect(await screen.findByText(/Borrador guardado a las/i)).toBeInTheDocument();
    });
  });

  // Data-loss regressions found on 2026-10-08: "Más de 25" was dropped by the backend and "No" in the catering
  // field was saved as "Sí - No". What the wizard sends must carry both intact.
  it("sends 'Más de 25' as the participant range and 'No' catering as no catering", async () => {
    await renderNewRequest();

    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa Test S.A.S" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Privada" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    await chooseLeader();
    fireEvent.change(screen.getByLabelText(/Título o nombre de la propuesta/i), { target: { value: "Taller" } });
    fireEvent.click(screen.getByRole("option", { name: "Capacitación" }));
    fireEvent.click(screen.getByText(/Cupo, intensidad horaria, modalidad, logística y objetivos esperados/));
    fireEvent.click(screen.getByRole("option", { name: /Más de 25 participantes/ }));
    fireEvent.change(screen.getByLabelText(/Servicio de alimentación y logística/i), { target: { value: "No" } });

    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: /Alto/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud a Líder de Producto/i }));

    await waitFor(() => expect(mockedRequestsApi.create).toHaveBeenCalledTimes(1));
    const payload = mockedRequestsApi.create.mock.calls[0][0];
    expect(payload.participantRange).toBe("Más de 25");
    expect(payload.requiresCatering).toBe(false);
    expect(payload.cateringNotes).toBeUndefined();
  }, 20000);

  it("shows a server 400 about contactability in Spanish and takes the KAM back to the contact step", async () => {
    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "");
    mockedRequestsApi.create.mockRejectedValueOnce(
      new ApiError(400, "At least one valid customer phone or email is required"),
    );
    await renderNewRequest();
    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa Test S.A.S" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Privada" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    await chooseLeader();
    fireEvent.change(screen.getByLabelText(/Título o nombre de la propuesta/i), { target: { value: "Taller" } });
    fireEvent.click(screen.getByRole("option", { name: "Capacitación" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: /Alto/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud a Líder de Producto/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Deja al menos un teléfono o correo válido"));
    expect(toastError).not.toHaveBeenCalledWith(expect.stringMatching(/At least one/));
    expect(await screen.findByText("2. Contacto del Cliente")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Deja al menos un teléfono o correo válido");
    toastError.mockRestore();
  }, 20000);

  it("uploads the real File object, not its metadata, after the proposal is created (UI-006)", async () => {
    const { container } = await renderNewRequest();

    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa con Adjunto S.A.S" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Privada" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    await chooseLeader();
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
    expect(payload.category).toBe("CLIENT_FACING");

    // The create endpoint whitelists its fields and rejects unknown ones (400
    // "property attachments should not exist"): files only travel in the upload.
    const createPayload = mockedRequestsApi.create.mock.calls[0][0];
    expect(createPayload).not.toHaveProperty("attachments");
    expect(mockedRequestsApi.create.mock.invocationCallOrder[0]).toBeLessThan(
      mockedAttachmentsApi.upload.mock.invocationCallOrder[0],
    );
  }, 20000);
});

describe("NewRequest Wizard: CIIU (exactly four digits)", () => {
  const CIIU_MESSAGE = /El CIIU debe tener exactamente 4 dígitos/;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockedRequestsApi.getNodes.mockResolvedValue([]);
  });

  async function fillStep1() {
    await renderNewRequest();
    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa Test S.A.S" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Privada" }));
  }
  const principal = () => screen.getByLabelText(/Actividad Económica Principal/i) as HTMLInputElement;
  const addSecondary = () => fireEvent.click(screen.getByRole("button", { name: /Agregar otra actividad económica/i }));
  const secondary = (n: number) => screen.getByPlaceholderText(`CIIU #${n + 2} (4 dígitos)`) as HTMLInputElement;
  const next = () => fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
  const stillInStep1 = () => expect(screen.getByText(/1\. Datos de la Empresa/i)).toBeInTheDocument();

  it("blocks a principal CIIU of three digits and shows the error on the field", async () => {
    await fillStep1();
    fireEvent.change(principal(), { target: { value: "854" } });
    next();
    stillInStep1();
    expect(screen.getAllByText(CIIU_MESSAGE).length).toBeGreaterThan(0);
  });

  it("blocks a pasted value instead of cutting it to four digits", async () => {
    await fillStep1();
    fireEvent.change(principal(), { target: { value: "4845858858558" } });
    expect(principal().value).toBe("4845858858558");
    next();
    stillInStep1();
    expect(screen.getAllByText(CIIU_MESSAGE).length).toBeGreaterThan(0);
  });

  it("blocks five digits", async () => {
    await fillStep1();
    fireEvent.change(principal(), { target: { value: "85445" } });
    next();
    stillInStep1();
    expect(screen.getAllByText(CIIU_MESSAGE).length).toBeGreaterThan(0);
  });

  it("lets four digits through", async () => {
    await fillStep1();
    fireEvent.change(principal(), { target: { value: "8544" } });
    next();
    expect(screen.getByText("2. Contacto del Cliente")).toBeInTheDocument();
  });

  it("blocks a partial secondary row and passes once it has four digits", async () => {
    await fillStep1();
    addSecondary();
    fireEvent.change(secondary(0), { target: { value: "70" } });
    next();
    stillInStep1();
    expect(screen.getAllByText(CIIU_MESSAGE).length).toBeGreaterThan(0);
    fireEvent.change(secondary(0), { target: { value: "7020" } });
    next();
    expect(screen.getByText("2. Contacto del Cliente")).toBeInTheDocument();
  });

  it("treats an empty secondary row as absence", async () => {
    await fillStep1();
    addSecondary();
    next();
    expect(screen.getByText("2. Contacto del Cliente")).toBeInTheDocument();
  });

  function seedDraft(overrides: Record<string, unknown>) {
    window.localStorage.setItem(
      "icesi_kam_new_request_draft_v1",
      JSON.stringify({
        data: { empresaNombre: "Empresa Test S.A.S", tipoEmpresa: "Privada", ...overrides },
        timestamp: "10:00",
      }),
    );
  }

  it("blocks an invalid CIIU that comes back inside a restored draft", async () => {
    seedDraft({ ciiuPrincipal: "4845858858558", ciiusSecundarios: ["70"], correoEmpresa: "info@empresa.co" });
    await renderNewRequest({ withContact: false });
    fireEvent.click(await screen.findByRole("button", { name: /Recuperar datos/i }));
    expect(principal().value).toBe("4845858858558");
    next();
    stillInStep1();
    expect(screen.getAllByText(CIIU_MESSAGE).length).toBeGreaterThan(0);
  });

  it("treats Pendiente in a restored draft as absence", async () => {
    seedDraft({ ciiuPrincipal: "Pendiente", ciiusSecundarios: ["Pendiente", " "], correoEmpresa: "info@empresa.co" });
    await renderNewRequest({ withContact: false });
    fireEvent.click(await screen.findByRole("button", { name: /Recuperar datos/i }));
    next();
    expect(screen.getByText("2. Contacto del Cliente")).toBeInTheDocument();
  });
});

describe("NewRequest step 2: Colombian phone rule (10 digits, optional +57) and minimum channel", () => {
  const PHONE_MESSAGE = "El teléfono debe tener 10 dígitos (puede iniciar con +57)";
  const CHANNEL_MESSAGE = "Deja al menos un teléfono o correo válido";

  // The company phone lives in step 1; the wizard validates it when leaving step 2.
  async function goToStep2(companyPhone = "") {
    await renderNewRequest({ withContact: false });
    fireEvent.change(screen.getByLabelText(/Razón Social \/ Nombre de la Empresa/i), {
      target: { value: "Empresa nueva" },
    });
    if (companyPhone)
      fireEvent.change(screen.getByLabelText(/Teléfono corporativo/i), { target: { value: companyPhone } });
    fireEvent.click(screen.getByRole("button", { name: "Privada" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(screen.getByText("2. Contacto del Cliente")).toBeInTheDocument();
  }
  const next = () => fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
  const onStep2 = () => screen.queryByText("2. Contacto del Cliente") !== null;

  it.each([
    ["contact phone", /Teléfono de contacto principal/i],
    ["secondary phone", /Teléfono de contacto secundario/i],
  ])("blocks a 7-digit %s with the Spanish message and lets a 10-digit one pass", async (_name, label) => {
    await goToStep2();
    fireEvent.change(screen.getByLabelText(/Correo electrónico institucional/i), {
      target: { value: "interlocutor@empresa.co" },
    });
    fireEvent.change(screen.getByLabelText(label), { target: { value: "5551234" } });
    next();
    expect(onStep2()).toBe(true);
    expect((await screen.findAllByText(PHONE_MESSAGE)).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(label), { target: { value: "+57 300 123 4567" } });
    next();
    expect(screen.getByText(/3\. Requerimiento del Servicio/i)).toBeInTheDocument();
  });

  it("a valid company phone alone is a valid channel and the contact may stay empty", async () => {
    await goToStep2("(602) 555 1234");
    next();
    expect(screen.getByText(/3\. Requerimiento del Servicio/i)).toBeInTheDocument();
  });

  it("a 7-digit company phone is blocked and is not a channel: both messages in Spanish", async () => {
    await goToStep2("5551234");
    next();
    expect(onStep2()).toBe(true);
    expect(screen.getByText(CHANNEL_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(PHONE_MESSAGE)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Anterior/i }));
    fireEvent.change(screen.getByLabelText(/Teléfono corporativo/i), { target: { value: "3001234567" } });
    next();
    next();
    expect(screen.getByText(/3\. Requerimiento del Servicio/i)).toBeInTheDocument();
  });

  it("blocks an additional contact's phone that does not have 10 digits", async () => {
    await goToStep2();
    fireEvent.change(screen.getByLabelText(/Correo electrónico institucional/i), {
      target: { value: "interlocutor@empresa.co" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Agregar otro contacto/i }));
    const phone = screen.getByPlaceholderText("Ej. +57 310 555 1234");
    fireEvent.change(phone, { target: { value: "5551234" } });
    next();
    expect(onStep2()).toBe(true);
    expect((await screen.findAllByText(PHONE_MESSAGE)).length).toBeGreaterThan(0);
    fireEvent.change(phone, { target: { value: "3101234567" } });
    next();
    expect(screen.getByText(/3\. Requerimiento del Servicio/i)).toBeInTheDocument();
  });
});
