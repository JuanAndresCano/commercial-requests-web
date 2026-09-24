import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RequestDetail from "./RequestDetail";
import type { RequestItem } from "@/lib/mock-data";
import { requestsApi } from "@/lib/api/requests";

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
          workflow: { currentStatus: { code: found.status === "nueva" ? "NEW" : "IN_COSTING" } },
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
          negotiationRounds: [],
        });
      }),
      updateInfo: vi.fn().mockResolvedValue({ id: "REQ-2026-0001", title: "Capacitación Modificada" }),
      delete: vi.fn().mockResolvedValue({ success: true, id: "REQ-2026-0001", message: "Deleted" }),
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

      expect(authMock.updateRequest).toHaveBeenCalledWith(
        "REQ-2026-0001",
        expect.objectContaining({
          title: "Capacitación Liderazgo Ejecutivo Actualizada",
        }),
      );
    });
  });

  describe("HU 3.4: Proposal cancellation in NEW status", () => {
    it("renders 'Cancelar solicitud' button when in NEW status and owned by KAM", async () => {
      renderPage("REQ-2026-0001");

      const cancelBtn = await screen.findByRole("button", { name: /Cancelar solicitud/i });
      expect(cancelBtn).toBeInTheDocument();
    });

    it("opens confirmation dialog and executes cancellation and redirect", async () => {
      renderPage("REQ-2026-0001");

      const cancelBtn = await screen.findByRole("button", { name: /Cancelar solicitud/i });
      fireEvent.click(cancelBtn);

      expect(screen.getByText(/¿Cancelar esta solicitud\?/i)).toBeInTheDocument();

      const confirmBtn = screen.getByRole("button", { name: /Sí, cancelar solicitud/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(requestsApi.delete).toHaveBeenCalledWith("REQ-2026-0001");
      });

      expect(authMock.deleteRequest).toHaveBeenCalledWith("REQ-2026-0001");
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
});
