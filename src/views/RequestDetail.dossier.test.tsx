import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TestRouter } from "@/test/router";
import { ThemeProvider } from "@/context/ThemeContext";
import RequestDetail from "./RequestDetail";
import { requestsApi, type ProposalDetail } from "@/lib/api/requests";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const authMock = vi.hoisted(() => ({
  user: {
    role: "lider-producto",
    roleLabel: "Líder de Producto",
    name: "Laura Gómez",
    email: "lp@icesi.edu.co",
  },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: authMock.user,
    requests: [],
    updateRequest: vi.fn(),
    deleteRequest: vi.fn(),
    updateStatus: vi.fn(),
    assignProfessorDetailed: vi.fn(),
    updateCosting: vi.fn(),
    addDocument: vi.fn(),
    removeDocument: vi.fn(),
  }),
}));

vi.mock("@/lib/api/requests", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/requests")>();
  return {
    ...actual,
    requestsApi: {
      ...actual.requestsApi,
      getById: vi.fn(),
    },
  };
});

function makeProposal(statusCode: string, hasProfessor: boolean): ProposalDetail {
  return {
    id: "9c858901-8a57-4791-81fe-4c455b099bc9",
    code: "REQ-2026-0002",
    title: "Programa Analítica Avanzada",
    priority: "MEDIA",
    company: { id: "comp-1", name: "Demo Sura S.A." },
    workflow: { currentStatus: { code: statusCode } },
    program: { requestType: "CAPACITACION", totalHours: 40 },
    creator: { id: "u-1", firstName: "Juan", lastName: "Pérez", email: "juan@icesi.edu.co" },
    productLeader: { id: "lp-1", firstName: "Laura", lastName: "Gómez", email: "lp@icesi.edu.co" },
    economics: [{ id: "e1", isCurrent: true, grossValue: "0", readyForKam: false, readyForKamAt: null }],
    assignments: hasProfessor
      ? [
          {
            id: "a1",
            proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
            userId: null,
            professorId: "p1",
            role: "PROFESSOR",
            rawName: null,
            professor: {
              id: "p1",
              fullName: "Dra. Paula Henao",
              type: "STAFF" as const,
              faculty: "Ingeniería",
              company: null,
              email: "paula@icesi.edu.co",
              phone: "3000000000",
            },
          },
        ]
      : [],
    attachments: [],
    negotiationRounds: [],
  } as unknown as ProposalDetail;
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TestRouter route="/solicitudes/REQ-2026-0002" routes={{ "/solicitudes/:id": <RequestDetail /> }} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe("RequestDetail - Exportar Ficha para Docente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the 'Exportar Ficha para Docente' button enabled when professor is assigned", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValue(makeProposal("IN_PROGRESS", true));
    renderPage();

    const exportBtn = await screen.findByRole("button", { name: /Exportar Ficha para Docente/i });
    expect(exportBtn).toBeInTheDocument();
    expect(exportBtn).not.toBeDisabled();

    // Clicking it opens the dossier dialog
    fireEvent.click(exportBtn);
    expect(await screen.findByText("Ficha Técnica para Docente")).toBeInTheDocument();
  });

  it("disables the button when proposal is new and has no professor assigned", async () => {
    vi.mocked(requestsApi.getById).mockResolvedValue(makeProposal("NEW", false));
    renderPage();

    const exportBtn = await screen.findByRole("button", { name: /Exportar Ficha para Docente/i });
    expect(exportBtn).toBeInTheDocument();
    expect(exportBtn).toBeDisabled();
    expect(exportBtn).toHaveAttribute("title", "Asigna un docente antes de exportar la ficha técnica");
  });
});
