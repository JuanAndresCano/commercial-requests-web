import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RequestDetail from "./RequestDetail";
import { ThemeProvider } from "@/context/ThemeContext";
import { requestsApi, type ProposalDetail } from "@/lib/api/requests";

// "Equipo Asignado" of the detail: optional node (C-06), center and cost center (C-07), official number
// (C-13) and "Tiempo por etapa". The calls are mocked with the shape of the backend contract.

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

vi.mock("@/lib/api/requests", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/requests")>();
  return {
    ...actual,
    requestsApi: {
      ...actual.requestsApi,
      getById: vi.fn(),
      getNodes: vi.fn(),
      setNode: vi.fn(),
      setCenter: vi.fn(),
    },
  };
});
vi.mock("@/lib/api/users", () => ({ usersApi: { findByRole: vi.fn().mockResolvedValue([]) } }));

const UUID = "9c858901-8a57-4791-81fe-4c455b099bc9";
const LEADER = { id: "lp-1", firstName: "Juan Pablo", lastName: "Corrales", email: "lp@icesi.edu.co" };
const NODES = [
  { id: "n-ia", name: "Inteligencia Artificial", description: null },
  { id: "n-salud", name: "Salud Global", description: null },
];

function proposal(overrides: Record<string, unknown> = {}) {
  return {
    id: UUID,
    code: "REQ-2026-0002",
    title: "Taller de Inteligencia Artificial",
    priority: "MEDIA",
    nodeId: null,
    node: null,
    center: null,
    costCenter: null,
    officialNumber: null,
    company: { id: "comp-1", name: "Carvajal S.A." },
    workflow: { currentStatus: { code: "NEW" } },
    program: { requestType: "CAPACITACION" },
    creator: { id: "u-1", firstName: "Andrea", lastName: "Martínez", email: "andrea@icesi.edu.co" },
    productLeader: LEADER,
    economics: [{ id: "e1", isCurrent: true, grossValue: "0", readyForKam: false, readyForKamAt: null }],
    assignments: [],
    attachments: [],
    negotiationRounds: [],
    ...overrides,
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

describe("RequestDetail: optional node (C-06) and center (C-07), Product Leader", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authMock.user = LEADER_USER;
    vi.mocked(requestsApi.getNodes).mockResolvedValue(NODES);
    vi.mocked(requestsApi.setNode).mockResolvedValue(proposal());
    vi.mocked(requestsApi.setCenter).mockResolvedValue(proposal());
  });

  it("shows Sin nodo when the request has none, without breaking the page", async () => {
    load(proposal());
    renderPage();
    expect(await screen.findByText("Sin nodo")).toBeInTheDocument();
    expect(screen.getByText("Equipo Asignado")).toBeInTheDocument();
  });

  it("puts a node with PATCH node and the id", async () => {
    load(proposal());
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Cambiar nodo temático" }));
    await screen.findByRole("option", { name: "Salud Global" });
    fireEvent.change(screen.getByLabelText("Nodo temático"), { target: { value: "n-salud" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nodo" }));

    await waitFor(() => expect(requestsApi.setNode).toHaveBeenCalledTimes(1));
    expect(requestsApi.setNode).toHaveBeenCalledWith(UUID, { nodeId: "n-salud" });
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled());
  });

  it("removes the node by sending nodeId null", async () => {
    load(proposal({ nodeId: "n-ia", node: NODES[0] }));
    renderPage();

    expect(await screen.findByText("Inteligencia Artificial")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cambiar nodo temático" }));
    await screen.findByRole("option", { name: "Salud Global" });
    fireEvent.change(screen.getByLabelText("Nodo temático"), { target: { value: "__none__" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nodo" }));

    await waitFor(() => expect(requestsApi.setNode).toHaveBeenCalledWith(UUID, { nodeId: null }));
  });

  it("shows an error toast and nothing else when the node cannot be saved", async () => {
    load(proposal());
    vi.mocked(requestsApi.setNode).mockRejectedValue(new Error("Sin permiso"));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Cambiar nodo temático" }));
    await screen.findByRole("option", { name: "Salud Global" });
    fireEvent.change(screen.getByLabelText("Nodo temático"), { target: { value: "n-ia" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nodo" }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Sin permiso"));
  });

  it("saves the center and the cost center with PATCH center", async () => {
    load(proposal({ center: "OEM" }));
    renderPage();

    fireEvent.change(await screen.findByLabelText("CENCO (centro de costos)"), { target: { value: "CC-1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar centro" }));

    await waitFor(() => expect(requestsApi.setCenter).toHaveBeenCalledTimes(1));
    expect(requestsApi.setCenter).toHaveBeenCalledWith(UUID, { costCenter: "CC-1234" });
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled());
  });
});

describe("RequestDetail: what the KAM sees (C-06, C-07, C-13)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authMock.user = KAM_USER;
    vi.mocked(requestsApi.getNodes).mockResolvedValue(NODES);
  });

  it("sees Sin nodo and no editor for the node, the center or the cost center", async () => {
    load(proposal());
    renderPage();
    expect(await screen.findByText("Sin nodo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar nodo" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Centro")).not.toBeInTheDocument();
    expect(screen.queryByText("CENCO (centro de costos)")).not.toBeInTheDocument();
  });

  it("sees the center and the cost center read-only when they have a value", async () => {
    load(proposal({ center: "Eduteka", costCenter: "CC-1234" }));
    renderPage();
    expect(await screen.findByText("Eduteka")).toBeInTheDocument();
    expect(screen.getByText("CC-1234")).toBeInTheDocument();
    expect(screen.queryByLabelText("Centro")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar centro" })).not.toBeInTheDocument();
  });

  it("sees the official number prominently in the header, next to the REQ code", async () => {
    load(proposal({ officialNumber: "CP 2026-0169", workflow: { currentStatus: { code: "DELIVERED" } } }));
    renderPage();
    expect(await screen.findByText("CP 2026-0169")).toBeInTheDocument();
    expect(screen.getByText("#REQ-2026-0002")).toBeInTheDocument();
  });

  it("sees no official number while it is null", async () => {
    load(proposal());
    renderPage();
    await screen.findByText("#REQ-2026-0002");
    expect(screen.queryByTitle("Número oficial")).not.toBeInTheDocument();
  });
});

describe("RequestDetail: Tiempo por etapa", () => {
  const history = [
    { statusCode: "NEW", changedAt: "2026-09-01T10:00:00.000Z" },
    { statusCode: "IN_PROGRESS", changedAt: "2026-09-04T10:00:00.000Z" },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requestsApi.getNodes).mockResolvedValue(NODES);
  });

  it("lists the stages with the KAM labels", async () => {
    authMock.user = KAM_USER;
    load(proposal({ workflow: { currentStatus: { code: "IN_PROGRESS" } }, statusHistory: history }));
    renderPage();
    expect(await screen.findByText("Tiempo por etapa")).toBeInTheDocument();
    for (const label of ["Entregada al líder", "En Proceso", "Lista para Entregar", "Entregada"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/actual/)).toBeInTheDocument();
  });

  it("lists the stages with the Leader labels", async () => {
    authMock.user = LEADER_USER;
    load(proposal({ workflow: { currentStatus: { code: "IN_PROGRESS" } }, statusHistory: history }));
    renderPage();
    expect(await screen.findByText("Tiempo por etapa")).toBeInTheDocument();
    expect(screen.getAllByText("Enviada al KAM").length).toBeGreaterThan(0);
    expect(screen.getAllByText("En proceso de costeo").length).toBeGreaterThan(0);
  });

  it("shows no section when the backend sends no history", async () => {
    authMock.user = KAM_USER;
    load(proposal());
    renderPage();
    await screen.findByText("#REQ-2026-0002");
    expect(screen.queryByText("Tiempo por etapa")).not.toBeInTheDocument();
  });
});
