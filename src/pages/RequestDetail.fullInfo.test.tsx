import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RequestDetail from "./RequestDetail";
import { ThemeProvider } from "@/context/ThemeContext";
import { professorsApi } from "@/lib/api/professors";
import { requestsApi, type ProposalDetail } from "@/lib/api/requests";

// C-22: "Información completa de la solicitud" sits at the top of the main column while the request is still
// being triaged, with a summary visible even when collapsed (the product lead could not find it at the bottom).

const LEADER_USER = {
  role: "lider-producto",
  roleLabel: "Líder de Producto",
  name: "Juan Pablo Corrales",
  email: "lp@icesi.edu.co",
};
const KAM_USER = { role: "kam", roleLabel: "KAM", name: "Andrea Martínez", email: "andrea@icesi.edu.co" };

const authMock = vi.hoisted(() => ({ user: {} as { role: string; roleLabel: string; name: string; email: string } }));
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

const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

vi.mock("@/lib/api/professors", () => ({ professorsApi: { list: vi.fn(), create: vi.fn() } }));
vi.mock("@/lib/api/requests", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/requests")>();
  return {
    ...actual,
    requestsApi: {
      ...actual.requestsApi,
      getById: vi.fn(),
      assignProfessor: vi.fn(),
      updateStatus: vi.fn(),
    },
  };
});

const UUID = "9c858901-8a57-4791-81fe-4c455b099bc9";
const LEADER = { id: "lp-1", firstName: "Juan Pablo", lastName: "Corrales", email: "lp@icesi.edu.co" };

const NEED = "Fortalecer el liderazgo de los jefes de planta en la operación de turnos";

function proposal(statusCode: string) {
  return {
    id: UUID,
    code: "REQ-2026-0002",
    title: "Taller de Inteligencia Artificial",
    priority: "MEDIA",
    generalDescription: NEED,
    company: { id: "comp-1", name: "Carvajal S.A.", nit: "890.300.279" },
    workflow: { currentStatus: { code: statusCode } },
    program: { requestType: "CAPACITACION" },
    creator: { id: "u-1", firstName: "Andrea", lastName: "Martínez", email: "andrea@icesi.edu.co" },
    productLeader: LEADER,
    economics: [{ id: "e1", isCurrent: true, grossValue: "0", readyForKam: false, readyForKamAt: null }],
    assignments: [],
    attachments: [],
    negotiationRounds: [],
  } as unknown as ProposalDetail;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/solicitudes/REQ-2026-0002"]}>
          <Routes>
            <Route path="/solicitudes/:id" element={<RequestDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

const load = (detail: ProposalDetail) => vi.mocked(requestsApi.getById).mockResolvedValue(detail);
const infoTitle = () => screen.findByText("Información completa de la solicitud");
const before = (a: HTMLElement, b: HTMLElement) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("RequestDetail: where the full request information sits (C-22)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(professorsApi.list).mockResolvedValue([]);
  });

  it("the leader sees it before the costing placeholder and the documents while the request is new", async () => {
    authMock.user = LEADER_USER;
    load(proposal("NEW"));
    renderPage();

    const info = await infoTitle();

    expect(before(info, screen.getByText("Costeo aún no disponible"))).toBe(true);
    expect(before(info, screen.getByText("Gestión de Documentos"))).toBe(true);
    expect(before(info, screen.getByText("Especificaciones del Servicio"))).toBe(true);
  });

  it("the KAM sees it at the top of the main column too", async () => {
    authMock.user = KAM_USER;
    load(proposal("NEW"));
    renderPage();

    const info = await infoTitle();

    expect(before(info, screen.getByText("Especificaciones del Servicio"))).toBe(true);
  });

  it("shows a summary (company and the need) while collapsed, without opening the section", async () => {
    authMock.user = LEADER_USER;
    load(proposal("NEW"));
    renderPage();

    await infoTitle();
    const summary = screen.getByTestId("full-info-summary");

    expect(within(summary).getByText(/Carvajal S\.A\./)).toBeInTheDocument();
    expect(within(summary).getByText(new RegExp(NEED))).toBeInTheDocument();
    expect(screen.queryByText("Diagnóstico del requerimiento")).not.toBeInTheDocument();
  });

  it("opens the full detail from the title", async () => {
    authMock.user = LEADER_USER;
    load(proposal("NEW"));
    renderPage();

    fireEvent.click(await infoTitle());

    expect(await screen.findByText("Diagnóstico del requerimiento")).toBeInTheDocument();
  });

  it("keeps the costing first once the request reaches costing", async () => {
    authMock.user = LEADER_USER;
    load(proposal("IN_COSTING"));
    renderPage();

    const info = await infoTitle();

    expect(before(await screen.findByText("Costeo Financiero"), info)).toBe(true);
  });
});
