import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RequestDetail from "./RequestDetail";
import type { RequestItem } from "@/lib/mock-data";
import { requestsApi, type ProposalDetail } from "@/lib/api/requests";
import { ApiError } from "@/lib/api/client";

const mockRequests: RequestItem[] = [
  {
    id: "REQ-2026-0001",
    title: "Capacitación Liderazgo Ejecutivo",
    company: "Bancolombia S.A.",
    companyNit: "890900608-9",
    applicant: "Carlos Martínez",
    type: "Capacitación",
    createdAt: "2026-03-20T10:00:00.000Z",
    deadline: "2026-03-30T10:00:00.000Z",
    status: "nueva",
    urgency: "alta",
    productLeader: "Juan Pablo Corrales",
    kam: "Andrea Martínez",
    node: "Inteligencia Artificial",
    necesidad: "Mejorar habilidades de comunicación y liderazgo",
    formacionPrevia: "No",
  },
  {
    id: "REQ-2026-0002",
    title: "Taller de Inteligencia Artificial",
    company: "Carvajal S.A.",
    companyNit: "890300279-4",
    applicant: "Laura Gómez",
    type: "Capacitación",
    createdAt: "2026-03-15T10:00:00.000Z",
    deadline: "2026-03-25T10:00:00.000Z",
    status: "en-costeo",
    urgency: "media",
    productLeader: "Juan Pablo Corrales",
    kam: "Andrea Martínez",
    node: "Inteligencia Artificial",
    costing: {
      readyForKam: true,
      costingSentAt: "2026-03-22T10:00:00.000Z",
      totalOfferedCop: 25000000,
      expectedMarginPercent: 32,
      marginAmountCop: 8000000,
      proCulturaTaxPercent: 1.5,
      proCulturaTaxAmount: 375000,
    },
  },
  {
    id: "REQ-2026-0003",
    title: "Programa de Innovación Digital",
    company: "Ingenio Manuelita",
    applicant: "Pedro Gómez",
    type: "Capacitación",
    createdAt: "2026-03-10T10:00:00.000Z",
    status: "entregada",
    urgency: "media",
    productLeader: "Juan Pablo Corrales",
    kam: "Andrea Martínez",
    node: "Inteligencia Artificial",
    costing: {
      readyForKam: true,
      costingSentAt: "2026-03-20T10:00:00.000Z",
      totalOfferedCop: 18000000,
      expectedMarginPercent: 30,
      marginAmountCop: 5400000,
      proCulturaTaxPercent: 1.5,
      proCulturaTaxAmount: 270000,
    },
    negotiationRounds: [
      {
        id: "REQ-2026-0003-r1",
        roundNumber: 1,
        totalOfferedCop: 18000000,
        marginAmountCop: 5400000,
        expectedMarginPercent: 30,
        sentToKamAt: "2026-03-20T10:00:00.000Z",
        sentToClientAt: "2026-03-21T10:00:00.000Z",
        clientResponse: "pendiente",
      },
    ],
  },
  {
    id: "REQ-2026-0004",
    title: "Propuesta Devuelta para Ajustes",
    company: "Argos S.A.",
    companyNit: "890100200-1",
    applicant: "Mateo Pérez",
    type: "Capacitación",
    createdAt: "2026-03-15T10:00:00.000Z",
    deadline: "2026-03-25T10:00:00.000Z",
    status: "en-costeo",
    urgency: "alta",
    productLeader: "Juan Pablo Corrales",
    kam: "Andrea Martínez",
    node: "Inteligencia Artificial",
    costing: {
      readyForKam: false,
      totalOfferedCop: 20000000,
      proCulturaTaxPercent: 1.5,
      proCulturaTaxAmount: 300000,
    },
    negotiationRounds: [
      {
        id: "REQ-2026-0004-r1",
        roundNumber: 1,
        totalOfferedCop: 20000000,
        marginAmountCop: 0,
        expectedMarginPercent: 0,
        sentToKamAt: "2026-03-20T10:00:00.000Z",
        clientResponse: "rechazada",
      },
    ],
  },
];

const authMock = vi.hoisted(() => ({
  user: {
    role: "kam",
    roleLabel: "KAM",
    name: "Andrea Martínez",
    email: "andrea@icesi.edu.co",
  },
  requests: [] as RequestItem[],
  updateRequest: vi.fn(),
  deleteRequest: vi.fn(),
  updateStatus: vi.fn(),
  assignProfessorDetailed: vi.fn(),
  updateCosting: vi.fn(),
  addDocument: vi.fn(),
  removeDocument: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: authMock.user,
    requests: authMock.requests,
    updateRequest: authMock.updateRequest,
    deleteRequest: authMock.deleteRequest,
    updateStatus: authMock.updateStatus,
    assignProfessorDetailed: authMock.assignProfessorDetailed,
    updateCosting: authMock.updateCosting,
    addDocument: authMock.addDocument,
    removeDocument: authMock.removeDocument,
  }),
}));

const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

vi.mock("@/lib/api/requests", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/requests")>();
  return {
    ...actual,
    requestsApi: {
      ...actual.requestsApi,
      getById: vi.fn().mockImplementation((id: string) => {
        const found = mockRequests.find((r) => r.id === id);
        if (!found) return Promise.reject(new Error("Not found"));
        return Promise.resolve({
          id: found.id,
          code: found.id,
          title: found.title,
          priority: "ALTA",
          company: { id: "comp-1", name: found.company, nit: found.companyNit },
          workflow: {
            currentStatus: {
              code:
                found.status === "nueva"
                  ? "NEW"
                  : found.status === "en-costeo"
                    ? "IN_COSTING"
                    : found.status === "entregada"
                      ? "DELIVERED"
                      : "NEW",
            },
          },
          program: { requestType: "CAPACITACION" },
          creator: { id: "u-1", firstName: "Andrea", lastName: "Martínez", email: "andrea@icesi.edu.co" },
          economics: found.costing
            ? [
                {
                  grossValue: found.costing.totalOfferedCop,
                  readyForKam: found.costing.readyForKam,
                  readyForKamAt: found.costing.costingSentAt,
                },
              ]
            : [],
          assignments: [],
          attachments: [],
          negotiationRounds:
            found.negotiationRounds?.map((nr) => ({
              id: nr.id,
              roundNumber: nr.roundNumber,
              offeredValue: nr.totalOfferedCop,
              clientResponse: nr.clientResponse === "rechazada" ? "CHANGES_REQUESTED" : "PENDING",
              sentToKamAt: nr.sentToKamAt,
            })) ?? [],
        });
      }),
      updateInfo: vi.fn().mockResolvedValue({ id: "REQ-2026-0001", title: "Capacitación Modificada" }),
      delete: vi.fn().mockResolvedValue({ success: true, id: "REQ-2026-0001", message: "Deleted" }),
      updateStatus: vi.fn().mockResolvedValue({ id: "REQ-2026-0002" }),
      upsertCosting: vi.fn().mockResolvedValue({ id: "REQ-2026-0002" }),
    },
  };
});

import { ThemeProvider } from "@/context/ThemeContext";

function renderPage(requestId = "REQ-2026-0001") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/solicitudes/${requestId}`]}>
          <Routes>
            <Route path="/solicitudes/:id" element={<RequestDetail />} />
            <Route path="/dashboard" element={<div>Tablero Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe("RequestDetail - KAM Management and Security (HUs 3.3, 3.4, 3.5)", () => {
  beforeEach(() => {
    authMock.user = {
      role: "kam",
      roleLabel: "KAM",
      name: "Andrea Martínez",
      email: "andrea@icesi.edu.co",
    };
    authMock.requests = [...mockRequests];
    authMock.updateRequest.mockReset();
    authMock.deleteRequest.mockReset();
    vi.clearAllMocks();
  });

  describe("HU 3.3: Early proposal editing in NEW status", () => {
    it("renders 'Editar información' button when proposal is in NEW status and owned by KAM", async () => {
      renderPage("REQ-2026-0001");

      const editBtn = await screen.findByRole("button", { name: /Editar información/i });
      expect(editBtn).toBeInTheDocument();
    });

    it("opens edit modal and allows updating proposal information", async () => {
      renderPage("REQ-2026-0001");

      const editBtn = await screen.findByRole("button", { name: /Editar información/i });
      fireEvent.click(editBtn);

      expect(screen.getByText("Editar información de la solicitud")).toBeInTheDocument();

      const titleInput = screen.getByLabelText(/Título de la propuesta/i);
      expect(titleInput).toHaveValue("Capacitación Liderazgo Ejecutivo");

      fireEvent.change(titleInput, { target: { value: "Capacitación Liderazgo Ejecutivo Actualizada" } });

      const saveBtn = screen.getByRole("button", { name: /Guardar información/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(requestsApi.updateInfo).toHaveBeenCalledWith(
          "REQ-2026-0001",
          expect.objectContaining({
            programName: "Capacitación Liderazgo Ejecutivo Actualizada",
          }),
        );
      });

      // No dual-write: real API should not write to mock AuthContext
      expect(authMock.updateRequest).not.toHaveBeenCalled();
    });

    it("falls back to local updateRequest when apiProposal is null (pure mock)", async () => {
      // Return null from API so it behaves as local mock
      vi.mocked(requestsApi.getById).mockResolvedValueOnce(null as unknown as ProposalDetail);
      renderPage("REQ-2026-0001");

      const editBtn = await screen.findByRole("button", { name: /Editar información/i });
      fireEvent.click(editBtn);

      const titleInput = screen.getByLabelText(/Título de la propuesta/i);
      fireEvent.change(titleInput, { target: { value: "Edición Local Mock" } });

      const saveBtn = screen.getByRole("button", { name: /Guardar información/i });
      fireEvent.click(saveBtn);

      expect(authMock.updateRequest).toHaveBeenCalledWith(
        "REQ-2026-0001",
        expect.objectContaining({
          title: "Edición Local Mock",
        }),
      );
      expect(requestsApi.updateInfo).not.toHaveBeenCalled();
    });

    it("renders 'Editar información' button when proposal is in 'en-costeo' status post-rejection (UI-004)", async () => {
      renderPage("REQ-2026-0004");

      const editBtn = await screen.findByRole("button", { name: /Editar información/i });
      expect(editBtn).toBeInTheDocument();

      fireEvent.click(editBtn);
      expect(screen.getByText("Editar información de la solicitud")).toBeInTheDocument();
    });
  });

  describe("HU 4.4: Leader reassignment in costeo (UI-002)", () => {
    it("renders 'Reasignar' button when proposal is in 'en-costeo' status for Product Leader", async () => {
      authMock.user = {
        role: "lider-producto",
        roleLabel: "Líder de Producto",
        name: "Juan Pablo Corrales",
        email: "jcorrales@icesi.edu.co",
      };

      renderPage("REQ-2026-0002");

      const reassignBtn = await screen.findByRole("button", { name: /Reasignar/i });
      expect(reassignBtn).toBeInTheDocument();
    });
  });

  describe("HU 3.4: Proposal cancellation in NEW status", () => {
    it("renders 'Cancelar solicitud' button when in NEW status and owned by KAM", async () => {
      renderPage("REQ-2026-0001");

      const cancelBtn = await screen.findByRole("button", { name: /Cancelar solicitud/i });
      expect(cancelBtn).toBeInTheDocument();
    });

    it("opens confirmation dialog and executes cancellation and redirect without dual delete", async () => {
      renderPage("REQ-2026-0001");

      const cancelBtn = await screen.findByRole("button", { name: /Cancelar solicitud/i });
      fireEvent.click(cancelBtn);

      expect(screen.getByText(/¿Cancelar esta solicitud\?/i)).toBeInTheDocument();

      // Click quick chip preset to fill reason
      const chipPreset = screen.getByRole("button", { name: /Creada por error \/ prueba/i });
      fireEvent.click(chipPreset);

      const confirmBtn = screen.getByRole("button", { name: /Sí, cancelar solicitud/i });
      expect(confirmBtn).not.toBeDisabled();
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(requestsApi.delete).toHaveBeenCalledWith("REQ-2026-0001", {
          reason: "Creada por error / prueba",
        });
      });

      // No dual delete: real API should not call mock deleteRequest
      expect(authMock.deleteRequest).not.toHaveBeenCalled();
      expect(await screen.findByText("Tablero Dashboard")).toBeInTheDocument();
    });

    it("falls back to local deleteRequest when apiProposal is null (pure mock)", async () => {
      vi.mocked(requestsApi.getById).mockResolvedValueOnce(null as unknown as ProposalDetail);
      renderPage("REQ-2026-0001");

      const cancelBtn = await screen.findByRole("button", { name: /Cancelar solicitud/i });
      fireEvent.click(cancelBtn);

      // Select preset
      const chipPreset = screen.getByRole("button", { name: /Cliente desistió de la propuesta/i });
      fireEvent.click(chipPreset);

      const confirmBtn = screen.getByRole("button", { name: /Sí, cancelar solicitud/i });
      fireEvent.click(confirmBtn);

      expect(authMock.deleteRequest).toHaveBeenCalledWith("REQ-2026-0001");
      expect(requestsApi.delete).not.toHaveBeenCalled();
      expect(await screen.findByText("Tablero Dashboard")).toBeInTheDocument();
    });
  });

  describe("HU 3.5: Security - Hide margins and cost breakdown from KAM", () => {
    it("displays approved gross value but hides margin percentage and internal costing breakdown", async () => {
      renderPage("REQ-2026-0002");

      // Verify commercial gross value is displayed
      expect(await screen.findByText("Propuesta Económica para Cliente")).toBeInTheDocument();
      expect(screen.getByText("$ 25.000.000")).toBeInTheDocument();
      expect(screen.getByText("Aprobado por Líder")).toBeInTheDocument();

      // Verify margin percentages and internal cost breakdown are NOT visible to the KAM
      expect(screen.queryByText(/Margen de contribución/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/32%/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Honorarios docente/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Costo base/i)).not.toBeInTheDocument();
    });
  });

  describe("HU 3.6: Proposal delivery to client (Enviar a cliente)", () => {
    it("delivers proposal via updateStatus mutation when apiProposal is present", async () => {
      renderPage("REQ-2026-0002");

      const sendBtn = await screen.findByRole("button", { name: /Enviar a cliente/i });
      expect(sendBtn).toBeInTheDocument();
      fireEvent.click(sendBtn);

      const confirmBtn = screen.getByRole("button", { name: /Sí, marcar entregada/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(requestsApi.updateStatus).toHaveBeenCalledWith("REQ-2026-0002", {
          status: "DELIVERED",
        });
      });

      expect(authMock.updateRequest).not.toHaveBeenCalled();
    });

    it("falls back to local updateRequest when apiProposal is null", async () => {
      vi.mocked(requestsApi.getById).mockResolvedValueOnce(null as unknown as ProposalDetail);
      renderPage("REQ-2026-0002");

      const sendBtn = await screen.findByRole("button", { name: /Enviar a cliente/i });
      fireEvent.click(sendBtn);

      const confirmBtn = screen.getByRole("button", { name: /Sí, marcar entregada/i });
      fireEvent.click(confirmBtn);

      expect(authMock.updateRequest).toHaveBeenCalledWith(
        "REQ-2026-0002",
        expect.objectContaining({
          status: "entregada",
        }),
      );
      expect(requestsApi.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("HU 3.7: Proposal return with observations (Devolver con observaciones)", () => {
    it("returns proposal to costing via updateStatus mutation when apiProposal is present", async () => {
      renderPage("REQ-2026-0003");

      const returnBtn = await screen.findByRole("button", { name: /Devolver con observaciones/i });
      expect(returnBtn).toBeInTheDocument();
      fireEvent.click(returnBtn);

      const textarea = screen.getByLabelText(/Observaciones del cliente/i);
      fireEvent.change(textarea, { target: { value: "El cliente solicita ajustar número de horas a 40" } });

      const confirmBtn = screen.getByRole("button", { name: /Devolver a costeo/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(requestsApi.updateStatus).toHaveBeenCalledWith("REQ-2026-0003", {
          status: "IN_COSTING",
          rejectionReason: "El cliente solicita ajustar número de horas a 40",
        });
      });

      expect(authMock.updateRequest).not.toHaveBeenCalled();
    });

    it("falls back to local updateRequest when apiProposal is null", async () => {
      vi.mocked(requestsApi.getById).mockResolvedValueOnce(null as unknown as ProposalDetail);
      renderPage("REQ-2026-0003");

      const returnBtn = await screen.findByRole("button", { name: /Devolver con observaciones/i });
      fireEvent.click(returnBtn);

      const textarea = screen.getByLabelText(/Observaciones del cliente/i);
      fireEvent.change(textarea, { target: { value: "Ajuste local mock" } });

      const confirmBtn = screen.getByRole("button", { name: /Devolver a costeo/i });
      fireEvent.click(confirmBtn);

      expect(authMock.updateRequest).toHaveBeenCalledWith(
        "REQ-2026-0003",
        expect.objectContaining({
          status: "en-costeo",
          clientObservations: "Ajuste local mock",
        }),
      );
      expect(requestsApi.updateStatus).not.toHaveBeenCalled();
    });
  });
});

describe("RequestDetail - loading and not-found states", () => {
  // Any button that acts on a request; none may exist without a resolved request.
  const ACTION_BUTTONS =
    /Editar información|Cancelar solicitud|Devolver con observaciones|Enviar a cliente|Marcar Entregada|Avanzar|Reasignar/i;

  const expectNoMutations = () => {
    expect(requestsApi.delete).not.toHaveBeenCalled();
    expect(requestsApi.updateInfo).not.toHaveBeenCalled();
    expect(requestsApi.updateStatus).not.toHaveBeenCalled();
    expect(authMock.deleteRequest).not.toHaveBeenCalled();
    expect(authMock.updateRequest).not.toHaveBeenCalled();
    expect(authMock.updateStatus).not.toHaveBeenCalled();
    expect(authMock.assignProfessorDetailed).not.toHaveBeenCalled();
    expect(authMock.updateCosting).not.toHaveBeenCalled();
    expect(authMock.addDocument).not.toHaveBeenCalled();
    expect(authMock.removeDocument).not.toHaveBeenCalled();
  };

  beforeEach(() => {
    authMock.requests = [...mockRequests];
    vi.clearAllMocks();
  });

  it("shows the loading state with no action buttons while the backend has not answered", async () => {
    vi.mocked(requestsApi.getById).mockReturnValueOnce(new Promise(() => {}));
    renderPage("REQ-2026-0001");

    expect(await screen.findByText(/Cargando solicitud/i)).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: ACTION_BUTTONS })).toHaveLength(0);
    expectNoMutations();
  });

  it("shows 'not found' with no action buttons for a real id the backend answers with 404", async () => {
    vi.mocked(requestsApi.getById).mockRejectedValueOnce(new ApiError(404, "Not Found"));
    renderPage("REQ-2026-9999");

    expect(await screen.findByText("Solicitud no encontrada")).toBeInTheDocument();
    expect(screen.queryByText(/No se pudo cargar/i)).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: ACTION_BUTTONS })).toHaveLength(0);
    expectNoMutations();
  });

  it("does not fall back to the mock context when the backend 404s on an id that exists in the mock", async () => {
    vi.mocked(requestsApi.getById).mockRejectedValueOnce(new ApiError(404, "Not Found"));
    renderPage("REQ-2026-0001");

    expect(await screen.findByText("Solicitud no encontrada")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: ACTION_BUTTONS })).toHaveLength(0);
    expectNoMutations();
  });

  it.each([
    ["a server error (500)", new ApiError(500, "Internal Server Error")],
    ["a network failure", new TypeError("Failed to fetch")],
  ])("shows a retry message, not 'not found', on %s", async (_label, error) => {
    vi.mocked(requestsApi.getById).mockRejectedValueOnce(error);
    renderPage("REQ-2026-0001");

    expect(await screen.findByText("No se pudo cargar la solicitud")).toBeInTheDocument();
    expect(screen.queryByText("Solicitud no encontrada")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: ACTION_BUTTONS })).toHaveLength(0);
    expectNoMutations();
  });

  it("renders the undefined-request states without throwing or firing any non-cancel handler", async () => {
    // With req undefined, the render returns early so no handler is reachable
    // from the UI; the `if (!req) return;` guards are the second line of
    // defense. This asserts the observable contract: no throw, no side effects.
    vi.mocked(requestsApi.getById).mockRejectedValueOnce(new ApiError(404, "Not Found"));
    expect(() => renderPage("REQ-2026-9999")).not.toThrow();
    await screen.findByText("Solicitud no encontrada");
    expectNoMutations();
  });
});

// The margin percentage is typed by hand; leaving the field saves it right away.
async function typeMarginPercent(value: string) {
  await screen.findByLabelText(/Valor Final de la Propuesta/i);
  const input = document.getElementById("margin-percent-input") as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}

describe("RequestDetail - costing wiring (HU 5.1)", () => {
  const PROPOSAL_UUID = "9c858901-8a57-4791-81fe-4c455b099bc9";

  // A Product Leader's payload: the current economics row carries both margins as Decimal strings.
  const leaderProposal = (economics: Record<string, unknown>) =>
    ({
      id: PROPOSAL_UUID,
      code: "REQ-2026-0002",
      title: "Taller de Inteligencia Artificial",
      priority: "MEDIA",
      company: { id: "comp-1", name: "Carvajal S.A." },
      workflow: { currentStatus: { code: "IN_COSTING" } },
      program: { requestType: "CAPACITACION" },
      creator: { id: "u-1", firstName: "Andrea", lastName: "Martínez", email: "andrea@icesi.edu.co" },
      economics: [
        {
          id: "e1",
          isCurrent: true,
          grossValue: "25000000",
          marginPercentage: "32",
          estimatedMargin: "8000000",
          readyForKam: false,
          readyForKamAt: null,
          ...economics,
        },
      ],
      assignments: [],
      attachments: [],
      negotiationRounds: [],
    }) as unknown as ProposalDetail;

  beforeEach(() => {
    authMock.requests = [...mockRequests];
    vi.clearAllMocks();
    authMock.user = {
      role: "lider-producto",
      roleLabel: "Líder de Producto",
      name: "Juan Pablo Corrales",
      email: "lp@icesi.edu.co",
    };
  });

  afterEach(() => {
    authMock.user = { role: "kam", roleLabel: "KAM", name: "Andrea Martínez", email: "andrea@icesi.edu.co" };
  });

  it("sends a margin-only change to the backend with the proposal uuid, not the code", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({}));
    renderPage("REQ-2026-0002");

    await typeMarginPercent("35");

    await waitFor(() => expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1));
    expect(requestsApi.upsertCosting).toHaveBeenCalledWith(PROPOSAL_UUID, {
      totalCost: 25_000_000,
      marginPercentage: 35,
      marginAmount: 8_000_000,
    });
    expect(authMock.updateCosting).not.toHaveBeenCalled();
  });

  it("sends the margins the backend row holds when only the total changes", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({}));
    renderPage("REQ-2026-0002");

    fireEvent.change(await screen.findByLabelText(/Valor Final de la Propuesta/i), { target: { value: "26000000" } });

    await waitFor(() => expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1));
    expect(requestsApi.upsertCosting).toHaveBeenCalledWith(PROPOSAL_UUID, {
      totalCost: 26_000_000,
      marginPercentage: 32,
      marginAmount: 8_000_000,
    });
  });

  it("sends a margin the backend row does not have as null, never as 0", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(
      leaderProposal({ marginPercentage: null, estimatedMargin: null }),
    );
    renderPage("REQ-2026-0002");

    fireEvent.change(await screen.findByLabelText(/Valor Final de la Propuesta/i), { target: { value: "26000000" } });

    await waitFor(() => expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1));
    expect(requestsApi.upsertCosting).toHaveBeenCalledWith(PROPOSAL_UUID, {
      totalCost: 26_000_000,
      marginPercentage: null,
      marginAmount: null,
    });
  });

  it("does not call the backend when a field is focused and left without changing it (readyForKam stays)", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({ readyForKam: true }));
    renderPage("REQ-2026-0002");

    const total = await screen.findByLabelText(/Valor Final de la Propuesta/i);
    for (const field of [
      total,
      document.getElementById("margin-percent-input")!,
      document.getElementById("margin-amount-input")!,
    ]) {
      fireEvent.focus(field);
      fireEvent.blur(field);
    }

    // mutate() reaches the API on a later tick: give a spurious call the chance to show up.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(requestsApi.upsertCosting).not.toHaveBeenCalled();
    expect(authMock.updateCosting).not.toHaveBeenCalled();
  });

  it("does not call the backend when only the scope note changes", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({}));
    renderPage("REQ-2026-0002");

    fireEvent.click(await screen.findByText(/Agregar nota de alcance/i));
    fireEvent.change(screen.getByLabelText(/Nota de alcance comercial/i), { target: { value: "Ajuste acordado" } });

    expect(requestsApi.upsertCosting).not.toHaveBeenCalled();
    expect(authMock.updateCosting).not.toHaveBeenCalled();
  });

  it("refetches the detail after saving so readyForKam and the current row refresh", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({ readyForKam: true }));
    renderPage("REQ-2026-0002");

    await typeMarginPercent("35");

    await waitFor(() => expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(requestsApi.getById).toHaveBeenCalledTimes(2));
  });

  it("shows a generic Spanish message for a 400 and refetches to show what the backend holds", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({}));
    vi.mocked(requestsApi.upsertCosting).mockRejectedValueOnce(
      new ApiError(400, "marginPercentage must not be greater than 100"),
    );
    renderPage("REQ-2026-0002");

    await typeMarginPercent("35");

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith(
        "Revisa el valor y los márgenes: no pueden ser negativos y el % debe estar entre 0 y 100",
      ),
    );
    expect(toastMock.error).not.toHaveBeenCalledWith(expect.stringContaining("must not be"));
    await waitFor(() => expect(requestsApi.getById).toHaveBeenCalledTimes(2));
  });

  it("keeps the server message for errors that are not a 400", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({}));
    vi.mocked(requestsApi.upsertCosting).mockRejectedValueOnce(new ApiError(403, "Forbidden resource"));
    renderPage("REQ-2026-0002");

    await typeMarginPercent("35");

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Forbidden resource"));
  });

  it("does not send a second PUT for the same values while the first one is still in flight", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({}));
    vi.mocked(requestsApi.upsertCosting).mockReturnValueOnce(new Promise(() => {}));
    renderPage("REQ-2026-0002");

    await typeMarginPercent("35");
    await waitFor(() => expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText(/Agregar nota de alcance/i));
    fireEvent.change(screen.getByLabelText(/Nota de alcance comercial/i), { target: { value: "Ajuste" } });
    fireEvent.change(screen.getByLabelText(/Nota de alcance comercial/i), { target: { value: "Ajuste acordado" } });

    // mutate() reaches the API on a later tick: give a duplicate the chance to show up.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1);
  });

  it("keeps a mock proposal on the local path: no request to the backend", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(null as unknown as ProposalDetail);
    renderPage("REQ-2026-0002");

    await typeMarginPercent("35");

    expect(authMock.updateCosting).toHaveBeenCalledWith(
      "REQ-2026-0002",
      expect.objectContaining({ expectedMarginPercent: 35 }),
    );
    expect(requestsApi.upsertCosting).not.toHaveBeenCalled();
  });
});

describe("RequestDetail - negotiation history and returned notice (HU 5.4)", () => {
  const PROPOSAL_UUID = "9c858901-8a57-4791-81fe-4c455b099bc9";
  const BANNER = "El cliente pidió ajustes — propuesta devuelta a costeo";

  const round = (roundNumber: number, clientResponse: "PENDING" | "CHANGES_REQUESTED", clientNote: string | null) => ({
    id: `r${roundNumber}`,
    proposalId: PROPOSAL_UUID,
    roundNumber,
    offeredValue: "25000000",
    marginAmount: "8000000",
    marginPercentage: "32",
    scopeSnapshot: null,
    leaderNote: null,
    sentToKamAt: "2026-09-21T00:00:00.000Z",
    sentToClientAt: null,
    clientResponse,
    clientNote,
  });

  const proposalWith = (rounds: ReturnType<typeof round>[], statusCode = "IN_COSTING") =>
    ({
      id: PROPOSAL_UUID,
      code: "REQ-2026-0002",
      title: "Taller de Inteligencia Artificial",
      priority: "MEDIA",
      company: { id: "comp-1", name: "Carvajal S.A." },
      workflow: { currentStatus: { code: statusCode } },
      program: { requestType: "CAPACITACION" },
      creator: { id: "u-1", firstName: "Andrea", lastName: "Martínez", email: "andrea@icesi.edu.co" },
      economics: [{ id: "e1", isCurrent: true, grossValue: "25000000", readyForKam: true, readyForKamAt: null }],
      assignments: [],
      attachments: [],
      negotiationRounds: rounds,
    }) as unknown as ProposalDetail;

  const roundCard = (n: number) => screen.getByText(`Ronda ${n}`).closest("div.rounded-lg") as HTMLElement;

  beforeEach(() => {
    authMock.requests = [...mockRequests];
    vi.clearAllMocks();
    authMock.user = {
      role: "lider-producto",
      roleLabel: "Líder de Producto",
      name: "Juan Pablo Corrales",
      email: "lp@icesi.edu.co",
    };
  });

  afterEach(() => {
    authMock.user = { role: "kam", roleLabel: "KAM", name: "Andrea Martínez", email: "andrea@icesi.edu.co" };
  });

  const threeRounds = [
    round(1, "CHANGES_REQUESTED", "Bajar el precio"),
    round(2, "PENDING", null),
    round(3, "PENDING", null),
  ];

  it.each([
    ["ascending", threeRounds],
    ["descending", [...threeRounds].reverse()],
  ])("marks 'Ronda vigente' on round 3 and 'Reemplazada' on round 2 with 3 rounds sent %s", async (_order, rounds) => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(proposalWith(rounds));
    renderPage("REQ-2026-0002");

    await screen.findByText("Historial de Negociación");
    expect(screen.getAllByText("Ronda vigente")).toHaveLength(1);
    expect(within(roundCard(3)).getByText("Ronda vigente")).toBeInTheDocument();
    expect(screen.getAllByText(/Reemplazada por una ronda posterior/)).toHaveLength(1);
    expect(within(roundCard(2)).getByText(/Reemplazada por una ronda posterior/)).toBeInTheDocument();
    expect(within(roundCard(1)).getByText("Devuelta por el cliente")).toBeInTheDocument();
    expect(within(roundCard(1)).queryByText("Ronda vigente")).not.toBeInTheDocument();
  });

  it.each([
    ["ascending", [round(1, "CHANGES_REQUESTED", "Bajar el precio"), round(2, "PENDING", null)]],
    ["descending", [round(2, "PENDING", null), round(1, "CHANGES_REQUESTED", "Bajar el precio")]],
  ])("marks 'Ronda vigente' on round 2 and nothing is 'Reemplazada' with 2 rounds sent %s", async (_order, rounds) => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(proposalWith(rounds));
    renderPage("REQ-2026-0002");

    await screen.findByText("Historial de Negociación");
    expect(within(roundCard(2)).getByText("Ronda vigente")).toBeInTheDocument();
    expect(screen.queryByText(/Reemplazada por una ronda posterior/)).not.toBeInTheDocument();
  });

  it("shows the banner while the latest round came back with changes", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(
      proposalWith([round(2, "CHANGES_REQUESTED", "Bajar el precio"), round(1, "PENDING", null)]),
    );
    renderPage("REQ-2026-0002");

    expect(await screen.findByText(BANNER)).toBeInTheDocument();
  });

  it.each([
    [
      "a new PENDING round",
      [round(1, "CHANGES_REQUESTED", "Bajar el precio"), round(2, "PENDING", null)],
      "IN_COSTING",
    ],
    ["the redelivery", [round(1, "CHANGES_REQUESTED", "Bajar el precio")], "DELIVERED"],
    ["a rejection", [round(1, "PENDING", null), round(2, "CHANGES_REQUESTED", "No")], "REJECTED"],
  ])("clears the banner after %s", async (_case, rounds, statusCode) => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(proposalWith(rounds, statusCode));
    renderPage("REQ-2026-0002");

    await screen.findByText("Historial de Negociación");
    expect(screen.queryByText(BANNER)).not.toBeInTheDocument();
  });
});
