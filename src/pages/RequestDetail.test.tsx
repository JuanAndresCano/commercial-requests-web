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
  {
    id: "REQ-2026-0005",
    title: "Propuesta Nueva con Docente",
    company: "Postobón S.A.",
    companyNit: "890900241-4",
    applicant: "Sofía Ramírez",
    type: "Capacitación",
    createdAt: "2026-03-18T10:00:00.000Z",
    deadline: "2026-03-28T10:00:00.000Z",
    status: "nueva",
    urgency: "media",
    productLeader: "Juan Pablo Corrales",
    kam: "Andrea Martínez",
    node: "Inteligencia Artificial",
    professor: "Ana Torres",
  },
  {
    id: "REQ-2026-0006",
    title: "Propuesta Devuelta con Docente",
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
    professor: "Ana Torres",
    costing: {
      readyForKam: false,
      totalOfferedCop: 20000000,
      proCulturaTaxPercent: 1.5,
      proCulturaTaxAmount: 300000,
    },
    negotiationRounds: [
      {
        id: "REQ-2026-0006-r1",
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
          productLeader: { id: "u-2", firstName: "Juan Pablo", lastName: "Corrales", email: "jcorrales@icesi.edu.co" },
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
          assignments: found.professor
            ? [
                {
                  id: "assign-1",
                  role: "PROFESSOR",
                  professor: { id: "prof-1", fullName: found.professor, type: "INTERNAL" },
                },
              ]
            : [],
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

// A Product Leader's detail payload in a given status, owned by "Juan Pablo Corrales" (the test user).
const rejectedRound = {
  id: "r1",
  proposalId: "p-1",
  roundNumber: 1,
  offeredValue: "20000000",
  scopeSnapshot: null,
  leaderNote: null,
  sentToKamAt: "2026-09-21T00:00:00.000Z",
  sentToClientAt: "2026-09-22T00:00:00.000Z",
  clientResponse: "CHANGES_REQUESTED" as const,
  clientNote: "Ajustar alcance",
};
const proposalInStatus = (statusCode: string, overrides: Record<string, unknown> = {}) =>
  ({
    id: "p-1",
    code: "REQ-2026-0002",
    title: "Propuesta Devuelta para Ajustes",
    priority: "MEDIA",
    company: { id: "comp-1", name: "Argos S.A." },
    workflow: { currentStatus: { code: statusCode } },
    program: { requestType: "CAPACITACION" },
    creator: { id: "u-1", firstName: "Andrea", lastName: "Martínez", email: "andrea@icesi.edu.co" },
    productLeader: { id: "lp-1", firstName: "Juan Pablo", lastName: "Corrales", email: "lp@icesi.edu.co" },
    economics: [{ id: "e1", isCurrent: true, grossValue: "20000000", readyForKam: false, readyForKamAt: null }],
    assignments: [],
    attachments: [],
    negotiationRounds: [],
    ...overrides,
  }) as unknown as ProposalDetail;

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

  describe("KAM corrects the node or the leader (owner decision 2026-10-07)", () => {
    it("offers 'Cambiar' on the node and the leader while the request is new and has no professor", async () => {
      renderPage("REQ-2026-0001");
      expect(await screen.findByRole("button", { name: "Cambiar nodo temático" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cambiar líder de producto" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Cambiar líder de producto" }));
      expect(await screen.findByText("Cambiar nodo o líder")).toBeInTheDocument();
    });

    it("does not offer it once a professor is assigned (C-02) or after 'Nueva'", async () => {
      authMock.requests = mockRequests.map((r) => (r.id === "REQ-2026-0001" ? { ...r, professor: "Dr. Mejía" } : r));
      const getById = vi.mocked(requestsApi.getById);
      const original = getById.getMockImplementation()!;
      getById.mockImplementationOnce(
        async (id: string) =>
          ({
            ...(await original(id)),
            assignments: [
              { id: "a1", role: "PROFESSOR", professor: { id: "p1", fullName: "Dr. Mejía", type: "STAFF" } },
            ],
          }) as unknown as ProposalDetail,
      );
      const { unmount } = renderPage("REQ-2026-0001");
      await screen.findByText("Equipo Asignado");
      expect(screen.queryByRole("button", { name: "Cambiar líder de producto" })).not.toBeInTheDocument();
      unmount();

      renderPage("REQ-2026-0002");
      await screen.findByText("Equipo Asignado");
      expect(screen.queryByRole("button", { name: "Cambiar nodo temático" })).not.toBeInTheDocument();
    });

    it("never shows the KAM's button to the product leader", async () => {
      authMock.user = {
        role: "lider-producto",
        roleLabel: "Líder de Producto",
        name: "Juan Pablo Corrales",
        email: "jcorrales@icesi.edu.co",
      };
      renderPage("REQ-2026-0001");
      await screen.findByText("Equipo Asignado");
      expect(screen.queryByRole("button", { name: "Cambiar líder de producto" })).not.toBeInTheDocument();
    });

    it("shows who changed the node or the leader, with no reason for a KAM correction", async () => {
      const getById = vi.mocked(requestsApi.getById);
      const original = getById.getMockImplementation()!;
      getById.mockImplementationOnce(
        async (id: string) =>
          ({
            ...(await original(id)),
            teamChangeLogs: [
              {
                id: "t1",
                field: "PRODUCT_LEADER",
                previousName: "Laura Diaz",
                newName: "Juan Pablo Corrales",
                reason: null,
                changedAt: "2026-10-07T15:00:00.000Z",
                changedBy: { id: "u-1", firstName: "Andrea", lastName: "Martínez" },
              },
            ],
          }) as ProposalDetail,
      );
      renderPage("REQ-2026-0001");
      expect(await screen.findByText("Historial de nodo y líder")).toBeInTheDocument();
      const previous = screen.getByText("Laura Diaz");
      expect(previous).toHaveClass("line-through");
      expect(previous.closest("li")).toHaveTextContent(
        /^Líder: Laura Diaz → Juan Pablo Corrales · Andrea Martínez · 7 (de )?oct/,
      );
      expect(previous.closest("li")).not.toHaveTextContent("Motivo");
    });
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

    it("sends null, not nothing, for the fields left empty so the backend clears them", async () => {
      renderPage("REQ-2026-0001");

      fireEvent.click(await screen.findByRole("button", { name: /Editar información/i }));
      fireEvent.click(screen.getByRole("button", { name: /Guardar información/i }));

      await waitFor(() => expect(requestsApi.updateInfo).toHaveBeenCalledTimes(1));
      const payload = vi.mocked(requestsApi.updateInfo).mock.calls[0][1];
      expect(payload).toMatchObject({
        observations: null,
        contactArea: null,
        competencies: null,
        previousTrainingDate: null,
        requiresCatering: false,
        cateringNotes: null,
        companyAddress: null,
        companyPhone: null,
        companyEmail: null,
        ciiuCode: null,
        contactSecondaryPhone: null,
        contactAlternativeEmail: null,
      });
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

    // Prototype rule (RequestDetail.tsx canEditFullInfo): the KAM edits only while "nueva"; after a
    // client rejection only the owning Product Leader edits, and only in "en-costeo".
    it("does not let the KAM edit the information in 'en-costeo' after a client rejection", async () => {
      renderPage("REQ-2026-0004");

      await screen.findByText("Propuesta Devuelta para Ajustes");
      expect(screen.queryByRole("button", { name: /Editar información/i })).not.toBeInTheDocument();
    });

    describe("C-02: the KAM cannot edit once a professor is assigned", () => {
      const editButton = () => screen.queryByRole("button", { name: /Editar información/i });

      it("hides 'Editar información' from the KAM when a NEW proposal already has a professor", async () => {
        renderPage("REQ-2026-0005");

        await screen.findByText("Propuesta Nueva con Docente");
        expect(editButton()).not.toBeInTheDocument();
      });

      it("hides 'Editar información' from the KAM in 'en-costeo' after a rejection when a professor is assigned", async () => {
        renderPage("REQ-2026-0006");

        await screen.findByText("Propuesta Devuelta con Docente");
        expect(editButton()).not.toBeInTheDocument();
      });

      it("still shows 'Editar información' to the KAM on a NEW proposal without a professor", async () => {
        renderPage("REQ-2026-0001");

        expect(await screen.findByRole("button", { name: /Editar información/i })).toBeInTheDocument();
      });

      describe("as Product Leader (rules unchanged)", () => {
        beforeEach(() => {
          authMock.user = {
            role: "lider-producto",
            roleLabel: "Líder de Producto",
            name: "Juan Pablo Corrales",
            email: "jcorrales@icesi.edu.co",
          };
        });

        it("shows the button in 'en-costeo' after a rejection even with a professor assigned", async () => {
          renderPage("REQ-2026-0006");

          expect(await screen.findByRole("button", { name: /Editar información/i })).toBeInTheDocument();
        });

        it("keeps the section read-only on a NEW proposal", async () => {
          renderPage("REQ-2026-0005");

          await screen.findByText("Propuesta Nueva con Docente");
          expect(editButton()).not.toBeInTheDocument();
        });
      });
    });

    it("lets the owning Product Leader edit the information in 'en-costeo' after a client rejection", async () => {
      authMock.user = {
        role: "lider-producto",
        roleLabel: "Líder de Producto",
        name: "Juan Pablo Corrales",
        email: "jcorrales@icesi.edu.co",
      };
      vi.mocked(requestsApi.getById).mockResolvedValueOnce(
        proposalInStatus("IN_COSTING", { negotiationRounds: [rejectedRound] }),
      );
      renderPage("REQ-2026-0004");

      const editBtn = await screen.findByRole("button", { name: /Editar información/i });
      fireEvent.click(editBtn);
      expect(screen.getByText("Editar información de la solicitud")).toBeInTheDocument();
    });

    it("does not let the Product Leader edit the information before any client rejection", async () => {
      authMock.user = {
        role: "lider-producto",
        roleLabel: "Líder de Producto",
        name: "Juan Pablo Corrales",
        email: "jcorrales@icesi.edu.co",
      };
      vi.mocked(requestsApi.getById).mockResolvedValueOnce(proposalInStatus("IN_COSTING"));
      renderPage("REQ-2026-0004");

      await screen.findByText("Propuesta Devuelta para Ajustes");
      expect(screen.queryByRole("button", { name: /Editar información/i })).not.toBeInTheDocument();
    });

    it("offers only the title and the urgency in the General tab: node, leader and type are not editable here", async () => {
      renderPage("REQ-2026-0001");

      fireEvent.click(await screen.findByRole("button", { name: /Editar información/i }));

      expect(screen.getByLabelText(/Título de la propuesta/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Urgencia/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Nodo Asignado/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Tipo de requerimiento/i)).not.toBeInTheDocument();
      expect(screen.queryByText("Asignación Académica Institucional")).not.toBeInTheDocument();
    });

    it("never sends node, product leader or request type when the KAM saves the information", async () => {
      renderPage("REQ-2026-0001");

      fireEvent.click(await screen.findByRole("button", { name: /Editar información/i }));
      fireEvent.change(screen.getByLabelText(/Título de la propuesta/i), { target: { value: "Otro título" } });
      fireEvent.click(screen.getByRole("button", { name: /Guardar información/i }));

      await waitFor(() => expect(requestsApi.updateInfo).toHaveBeenCalledTimes(1));
      const payload = vi.mocked(requestsApi.updateInfo).mock.calls[0][1];
      expect(payload).not.toHaveProperty("nodeId");
      expect(payload).not.toHaveProperty("productLeaderId");
      expect(payload).not.toHaveProperty("requestType");
    });
  });

  describe("HU 4.4: Leader reassignment only while 'nueva' or 'en-experto'", () => {
    const asLeader = () => {
      authMock.user = {
        role: "lider-producto",
        roleLabel: "Líder de Producto",
        name: "Juan Pablo Corrales",
        email: "jcorrales@icesi.edu.co",
      };
    };

    it.each([
      ["NEW", true],
      ["IN_PROGRESS", true],
      ["IN_COSTING", false],
      ["DELIVERED", false],
    ])("with the proposal in %s, the 'Reasignar' button is shown: %s", async (statusCode, shown) => {
      asLeader();
      vi.mocked(requestsApi.getById).mockResolvedValueOnce(proposalInStatus(statusCode));
      renderPage("REQ-2026-0002");

      await screen.findByText("Equipo Asignado");
      expect(screen.queryByRole("button", { name: /Reasignar/i }) !== null).toBe(shown);
    });

    it("does not show 'Reasignar' to the KAM", async () => {
      vi.mocked(requestsApi.getById).mockResolvedValueOnce(proposalInStatus("NEW"));
      renderPage("REQ-2026-0002");

      await screen.findByText("Equipo Asignado");
      expect(screen.queryByRole("button", { name: /Reasignar/i })).not.toBeInTheDocument();
    });
  });

  describe("HU 3.4: Proposal cancellation in NEW status", () => {
    it("renders 'Cancelar solicitud' button when in NEW status and owned by KAM", async () => {
      renderPage("REQ-2026-0001");

      const cancelBtn = await screen.findByRole("button", { name: /Cancelar solicitud/i });
      expect(cancelBtn).toBeInTheDocument();
    });

    it("hides 'Cancelar solicitud' from the KAM once a professor is assigned (owner decision 2026-10-09)", async () => {
      renderPage("REQ-2026-0005");

      await screen.findByText("Propuesta Nueva con Docente");
      expect(screen.queryByRole("button", { name: /Cancelar solicitud/i })).not.toBeInTheDocument();
    });

    it("hides 'Cancelar solicitud' for a real proposal that has a PROFESSOR assignment", async () => {
      vi.mocked(requestsApi.getById).mockResolvedValueOnce(
        proposalInStatus("NEW", {
          assignments: [
            {
              id: "a-1",
              role: "PROFESSOR",
              professor: { id: "pr-1", fullName: "Ana Torres", type: "INTERNAL" },
            },
          ],
        }),
      );
      renderPage("REQ-2026-0002");

      await screen.findByText("Equipo Asignado");
      expect(screen.queryByRole("button", { name: /Cancelar solicitud/i })).not.toBeInTheDocument();
    });

    it("keeps 'Cancelar solicitud' for a real NEW proposal without a professor", async () => {
      vi.mocked(requestsApi.getById).mockResolvedValueOnce(proposalInStatus("NEW"));
      renderPage("REQ-2026-0002");

      expect(await screen.findByRole("button", { name: /Cancelar solicitud/i })).toBeInTheDocument();
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
      negotiationNotes: null,
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
      negotiationNotes: null,
    });
  });

  it("sends the scope note the backend row holds when only the total changes", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({ negotiationNotes: "Alcance acordado" }));
    renderPage("REQ-2026-0002");

    fireEvent.change(await screen.findByLabelText(/Valor Final de la Propuesta/i), { target: { value: "26000000" } });

    await waitFor(() => expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1));
    expect(requestsApi.upsertCosting).toHaveBeenCalledWith(
      PROPOSAL_UUID,
      expect.objectContaining({ totalCost: 26_000_000, negotiationNotes: "Alcance acordado" }),
    );
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
      negotiationNotes: null,
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

  it("saves the scope note to the backend after a pause in typing, once, with the values the row holds", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({}));
    renderPage("REQ-2026-0002");

    fireEvent.click(await screen.findByText(/Agregar nota de alcance/i));
    const note = screen.getByLabelText(/Nota de alcance comercial/i);
    fireEvent.change(note, { target: { value: "Ajuste" } });
    fireEvent.change(note, { target: { value: "Ajuste acordado " } });
    expect(requestsApi.upsertCosting).not.toHaveBeenCalled();

    await waitFor(() => expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1), { timeout: 2000 });
    expect(requestsApi.upsertCosting).toHaveBeenCalledWith(PROPOSAL_UUID, {
      totalCost: 25_000_000,
      marginPercentage: 32,
      marginAmount: 8_000_000,
      negotiationNotes: "Ajuste acordado",
    });
    expect(authMock.updateCosting).not.toHaveBeenCalled();
  });

  it("saves the scope note as soon as the field is left", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({}));
    renderPage("REQ-2026-0002");

    fireEvent.click(await screen.findByText(/Agregar nota de alcance/i));
    const note = screen.getByLabelText(/Nota de alcance comercial/i);
    fireEvent.change(note, { target: { value: "Ajuste acordado" } });
    fireEvent.blur(note);

    await waitFor(() => expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1));
    expect(requestsApi.upsertCosting).toHaveBeenCalledWith(
      PROPOSAL_UUID,
      expect.objectContaining({ negotiationNotes: "Ajuste acordado" }),
    );
  });

  it("clears the scope note on the backend (null) when the field is emptied", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({ negotiationNotes: "Vieja" }));
    renderPage("REQ-2026-0002");

    const note = await screen.findByLabelText(/Nota de alcance comercial/i);
    fireEvent.change(note, { target: { value: "" } });
    fireEvent.blur(note);

    await waitFor(() => expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1));
    expect(requestsApi.upsertCosting).toHaveBeenCalledWith(
      PROPOSAL_UUID,
      expect.objectContaining({ negotiationNotes: null }),
    );
  });

  it("does not call the backend when the note is edited back to what the row already holds", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({ negotiationNotes: "Igual" }));
    renderPage("REQ-2026-0002");

    const note = await screen.findByLabelText(/Nota de alcance comercial/i);
    fireEvent.change(note, { target: { value: "Igual " } });
    fireEvent.blur(note);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(requestsApi.upsertCosting).not.toHaveBeenCalled();
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

    // The same percent again, then a note edited back to the (empty) note the first save sent.
    await typeMarginPercent("35");
    fireEvent.click(screen.getByText(/Agregar nota de alcance/i));
    const note = screen.getByLabelText(/Nota de alcance comercial/i);
    fireEvent.change(note, { target: { value: "Ajuste" } });
    fireEvent.change(note, { target: { value: "" } });
    fireEvent.blur(note);

    // mutate() reaches the API on a later tick: give a duplicate the chance to show up.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1);
  });

  it("sends the note typed while another save is in flight, on top of the values that save sent", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(leaderProposal({}));
    vi.mocked(requestsApi.upsertCosting).mockReturnValueOnce(new Promise(() => {}));
    renderPage("REQ-2026-0002");

    await typeMarginPercent("35");
    await waitFor(() => expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText(/Agregar nota de alcance/i));
    const note = screen.getByLabelText(/Nota de alcance comercial/i);
    fireEvent.change(note, { target: { value: "Ajuste acordado" } });
    fireEvent.blur(note);

    await waitFor(() => expect(requestsApi.upsertCosting).toHaveBeenCalledTimes(2));
    expect(requestsApi.upsertCosting).toHaveBeenLastCalledWith(
      PROPOSAL_UUID,
      expect.objectContaining({ marginPercentage: 35, negotiationNotes: "Ajuste acordado" }),
    );
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
    scopeSnapshot: null as unknown,
    leaderNote: null,
    sentToKamAt: "2026-09-21T00:00:00.000Z",
    sentToClientAt: null as string | null,
    clientRespondedAt: null as string | null,
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

  // Prototype behaviour: pressing "Enviar a KAM" opens a new PENDING round but the client's note
  // stays visible until the KAM redelivers the proposal to the client.
  it("keeps the banner after the Product Leader sent a new PENDING round to the KAM", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(
      proposalWith([round(1, "CHANGES_REQUESTED", "Bajar el precio"), round(2, "PENDING", null)]),
    );
    renderPage("REQ-2026-0002");

    await screen.findByText("Historial de Negociación");
    expect(screen.getByText(BANNER)).toBeInTheDocument();
    expect(screen.getAllByText("Bajar el precio").length).toBeGreaterThan(0);
  });

  it("shows when each round was delivered to the client and when it came back, and the scope changes", async () => {
    const returned = {
      ...round(1, "CHANGES_REQUESTED", "Bajar el precio"),
      sentToClientAt: "2026-09-22T12:00:00.000Z",
      clientRespondedAt: "2026-09-25T12:00:00.000Z",
      scopeSnapshot: { totalHours: 40, minParticipants: 15, maxParticipants: 20, programModality: "VIRTUAL" },
    };
    const next = {
      ...round(2, "PENDING", null),
      scopeSnapshot: { totalHours: 24, minParticipants: 15, maxParticipants: 20, programModality: "VIRTUAL" },
    };
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(proposalWith([returned, next]));
    renderPage("REQ-2026-0002");

    await screen.findByText("Historial de Negociación");
    expect(within(roundCard(1)).getByText(/entregada al cliente el/)).toHaveTextContent("22 de septiembre, 2026");
    expect(within(roundCard(1)).getByText(/Devuelta el/)).toHaveTextContent("25 de septiembre, 2026");
    expect(within(roundCard(2)).getByText("Cambios frente a la ronda anterior")).toBeInTheDocument();
    expect(within(roundCard(2)).getByText("Horas: 40 → 24")).toBeInTheDocument();
    expect(within(roundCard(1)).queryByText("Cambios frente a la ronda anterior")).not.toBeInTheDocument();
  });

  it("lists the price change and a scope field that was empty in the previous round", async () => {
    const first = {
      ...round(1, "CHANGES_REQUESTED", "Bajar el precio"),
      offeredValue: "52000000",
      scopeSnapshot: { totalHours: 40 },
    };
    const second = {
      ...round(2, "PENDING", null),
      offeredValue: "520030000",
      scopeSnapshot: { totalHours: 44, minParticipants: 20, maxParticipants: 25 },
    };
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(proposalWith([first, second]));
    renderPage("REQ-2026-0002");

    await screen.findByText("Historial de Negociación");
    const card = within(roundCard(2));
    expect(card.getByText(/^Valor ofertado: .*52\.000\.000 → .*520\.030\.000$/)).toBeInTheDocument();
    expect(card.getByText("Horas: 40 → 44")).toBeInTheDocument();
    expect(card.getByText("Participantes: Sin definir → 20 - 25")).toBeInTheDocument();
  });

  it.each([
    ["the redelivery", [round(1, "CHANGES_REQUESTED", "Bajar el precio")], "DELIVERED"],
    ["a rejection", [round(1, "PENDING", null), round(2, "CHANGES_REQUESTED", "No")], "REJECTED"],
  ])("clears the banner after %s", async (_case, rounds, statusCode) => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(proposalWith(rounds, statusCode));
    renderPage("REQ-2026-0002");

    await screen.findByText("Historial de Negociación");
    expect(screen.queryByText(BANNER)).not.toBeInTheDocument();
  });
});

describe("RequestDetail - scope note shown to the KAM (negotiationNotes)", () => {
  const kamProposal = (readyForKam: boolean, negotiationNotes: string | null) =>
    ({
      id: "9c858901-8a57-4791-81fe-4c455b099bc9",
      code: "REQ-2026-0002",
      title: "Taller de Inteligencia Artificial",
      priority: "MEDIA",
      company: { id: "comp-1", name: "Carvajal S.A." },
      workflow: { currentStatus: { code: "IN_COSTING" } },
      program: { requestType: "CAPACITACION" },
      creator: { id: "u-1", firstName: "Andrea", lastName: "Martínez", email: "andrea@icesi.edu.co" },
      // The backend strips both margins for the KAM; the note is part of what the KAM sees.
      economics: [
        { id: "e1", isCurrent: true, grossValue: "25000000", negotiationNotes, readyForKam, readyForKamAt: null },
      ],
      assignments: [],
      attachments: [],
      negotiationRounds: [],
    }) as unknown as ProposalDetail;

  beforeEach(() => {
    authMock.requests = [...mockRequests];
    vi.clearAllMocks();
  });

  it("shows the Product Leader's scope note next to the offered value once the costing was sent to the KAM", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(kamProposal(true, "Incluye 2 módulos presenciales"));
    renderPage("REQ-2026-0002");

    expect(await screen.findByText("Nota de alcance comercial agregada por el Líder:")).toBeInTheDocument();
    expect(screen.getByText("Incluye 2 módulos presenciales")).toBeInTheDocument();
  });

  it("never shows the value to the KAM while the costing is pending the Leader's confirmation", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(kamProposal(false, null));
    renderPage("REQ-2026-0002");

    await screen.findByText(/Costeo definido — pendiente de confirmación del Líder/);
    expect(screen.queryByText(/25\.000\.000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/25000000/)).not.toBeInTheDocument();
  });

  it("shows the waiting card (no value) when the API hides the value because the Leader has not confirmed", async () => {
    const hidden = kamProposal(false, null);
    hidden.economics = [{ ...hidden.economics![0], grossValue: null }];
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(hidden);
    renderPage("REQ-2026-0002");

    await screen.findByText("Costeo en proceso");
    expect(screen.queryByText("Propuesta Económica para Cliente")).not.toBeInTheDocument();
  });

  it("does not show the note before the Product Leader confirms the send to the KAM", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(kamProposal(false, "Incluye 2 módulos presenciales"));
    renderPage("REQ-2026-0002");

    await screen.findByText(/Costeo definido — pendiente de confirmación del Líder/);
    expect(screen.queryByText("Incluye 2 módulos presenciales")).not.toBeInTheDocument();
  });

  it("shows no note block when the row has none", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValueOnce(kamProposal(true, null));
    renderPage("REQ-2026-0002");

    await screen.findByText("Propuesta Económica para Cliente");
    expect(screen.queryByText("Nota de alcance comercial agregada por el Líder:")).not.toBeInTheDocument();
  });
});
