import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RequestDetail from "./RequestDetail";
import { ThemeProvider } from "@/context/ThemeContext";
import { ApiError } from "@/lib/api/client";
import { professorsApi, type Professor } from "@/lib/api/professors";
import { requestsApi, type ProposalDetail } from "@/lib/api/requests";

// Assignment of the professor/advisor on the request detail: what the leader types goes to the backend in one
// PATCH, and what each role sees afterwards (the KAM gets the contact fields, never the identity document).

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

const external = {
  id: "e1",
  fullName: "Ana Ruiz",
  type: "EXTERNAL" as const,
  faculty: null,
  company: "Consultores SAS",
  identityDocument: "CC 94.456.789",
  email: "ana.ruiz@consultores.com",
  phone: "+57 315 123 4567",
  profile: "Especialista en transformación digital.",
};
const staffProfessor = {
  id: "s1",
  fullName: "Nohra Villegas",
  type: "STAFF" as const,
  faculty: "Ingeniería",
  company: null,
  email: "nohra@icesi.edu.co",
  phone: "+57 300 000 0000",
  profile: "Optimización.",
};

function proposal(statusCode: string, professor?: Record<string, unknown>) {
  return {
    id: UUID,
    code: "REQ-2026-0002",
    title: "Taller de Inteligencia Artificial",
    priority: "MEDIA",
    company: { id: "comp-1", name: "Carvajal S.A." },
    workflow: { currentStatus: { code: statusCode } },
    program: { requestType: "CAPACITACION" },
    creator: { id: "u-1", firstName: "Andrea", lastName: "Martínez", email: "andrea@icesi.edu.co" },
    productLeader: LEADER,
    economics: [{ id: "e1", isCurrent: true, grossValue: "0", readyForKam: false, readyForKamAt: null }],
    assignments: professor
      ? [{ id: "a1", proposalId: UUID, userId: null, professorId: "x", role: "PROFESSOR", rawName: null, professor }]
      : [],
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

describe("RequestDetail: the leader assigns a professor/advisor", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authMock.user = LEADER_USER;
    vi.mocked(professorsApi.list).mockResolvedValue([external as unknown as Professor]);
    vi.mocked(requestsApi.assignProfessor).mockResolvedValue(proposal("NEW"));
  });

  it("sends the typed data in one PATCH as {professor}, without advancing the status", async () => {
    load(proposal("NEW"));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Asignar" }));
    fireEvent.click(screen.getByRole("radio", { name: /externo/i }));
    fireEvent.change(screen.getByRole("combobox", { name: /Nombre completo/ }), { target: { value: "Luis Mora" } });
    fireEvent.change(screen.getByLabelText(/Firma consultora/), { target: { value: "Mora SAS" } });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: "luis@mora.co" } });
    fireEvent.click(screen.getByRole("button", { name: "Solo guardar" }));

    await waitFor(() => expect(requestsApi.assignProfessor).toHaveBeenCalledTimes(1));
    expect(requestsApi.assignProfessor).toHaveBeenCalledWith(UUID, {
      professor: { fullName: "Luis Mora", type: "EXTERNAL", company: "Mora SAS", email: "luis@mora.co" },
    });
    expect(requestsApi.updateStatus).not.toHaveBeenCalled();
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled());
  });

  it("sends {professorId} when an existing directory entry was picked", async () => {
    load(proposal("NEW"));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Asignar" }));
    fireEvent.change(screen.getByRole("combobox", { name: /Nombre completo/ }), { target: { value: "ana" } });
    fireEvent.click(await screen.findByRole("option", { name: /Ana Ruiz/ }));
    fireEvent.click(screen.getByRole("button", { name: "Solo guardar" }));

    await waitFor(() => expect(requestsApi.assignProfessor).toHaveBeenCalledTimes(1));
    expect(requestsApi.assignProfessor).toHaveBeenCalledWith(UUID, { professorId: "e1" });
    expect(requestsApi.updateStatus).not.toHaveBeenCalled();
  });

  it("'Guardar y avanzar a experto' assigns and then moves the request to IN_PROGRESS in one click", async () => {
    load(proposal("NEW"));
    vi.mocked(requestsApi.updateStatus).mockResolvedValue(proposal("IN_PROGRESS"));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Asignar" }));
    fireEvent.change(screen.getByRole("combobox", { name: /Nombre completo/ }), { target: { value: "Luis Mora" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar y avanzar a experto/ }));

    await waitFor(() => expect(requestsApi.updateStatus).toHaveBeenCalledTimes(1));
    expect(requestsApi.assignProfessor).toHaveBeenCalledTimes(1);
    expect(requestsApi.updateStatus).toHaveBeenCalledWith(UUID, { status: "IN_PROGRESS" });
  });

  it("offers no 'avanzar' button in the form when the request is already with the expert", async () => {
    load(proposal("IN_PROGRESS", external));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Cambiar" }));

    expect(await screen.findByRole("button", { name: /Guardar asignación/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Guardar y avanzar/ })).not.toBeInTheDocument();
  });

  it("shows an error toast and keeps the form open when the backend refuses", async () => {
    load(proposal("NEW"));
    vi.mocked(requestsApi.assignProfessor).mockRejectedValue(new ApiError(409, "locked"));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Asignar" }));
    fireEvent.change(screen.getByRole("combobox", { name: /Nombre completo/ }), { target: { value: "Luis Mora" } });
    fireEvent.click(screen.getByRole("button", { name: "Solo guardar" }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(expect.stringContaining("ya no permite cambiar")));
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox", { name: /Nombre completo/ })).toHaveValue("Luis Mora");
  });

  it("the leader sees every typed field, including the identity document, in the contact dialog", async () => {
    load(proposal("NEW", external));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Contacto" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Consultores SAS")).toBeInTheDocument();
    expect(within(dialog).getByText("CC 94.456.789")).toBeInTheDocument();
    expect(within(dialog).getByText("ana.ruiz@consultores.com")).toBeInTheDocument();
    expect(within(dialog).getByText("+57 315 123 4567")).toBeInTheDocument();
    expect(within(dialog).getByText("Especialista en transformación digital.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Cambiar docente / asesor" })).toBeInTheDocument();
  });

  it.each(["IN_COSTING", "DELIVERED"])("locks the assignment once the request is %s", async (code) => {
    load(proposal(code, external));
    renderPage();

    expect((await screen.findAllByText("No editable")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Cambiar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Asignar" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Contacto" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Cambiar docente / asesor" })).not.toBeInTheDocument();
  });
});

describe("RequestDetail: what the KAM sees of the assigned professor/advisor", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authMock.user = KAM_USER;
    vi.mocked(professorsApi.list).mockResolvedValue([]);
  });

  it("shows the contact fields of an external advisor but never the identity document", async () => {
    // The backend does not send it to the KAM: the key is not there at all.
    const forKam: Record<string, unknown> = { ...external };
    delete forKam.identityDocument;
    load(proposal("IN_PROGRESS", forKam));
    renderPage();

    expect(await screen.findByText("Consultores SAS")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Contacto" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("ana.ruiz@consultores.com")).toBeInTheDocument();
    expect(within(dialog).getByText("+57 315 123 4567")).toBeInTheDocument();
    expect(within(dialog).getByText("Especialista en transformación digital.")).toBeInTheDocument();
    expect(within(dialog).queryByText(/Cédula/)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Cambiar/ })).not.toBeInTheDocument();
  });

  it("shows faculty and contact of a planta professor too", async () => {
    load(proposal("IN_PROGRESS", staffProfessor));
    renderPage();

    expect(await screen.findByText("Ingeniería")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Contacto" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("nohra@icesi.edu.co")).toBeInTheDocument();
    expect(within(dialog).getByText("+57 300 000 0000")).toBeInTheDocument();
  });

  it("does not render an identity document even if one ever reached the client", async () => {
    load(proposal("IN_PROGRESS", external));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Contacto" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("ana.ruiz@consultores.com")).toBeInTheDocument();
    expect(within(dialog).queryByText("CC 94.456.789")).not.toBeInTheDocument();
  });

  it("offers no assignment action to the KAM", async () => {
    load(proposal("NEW", external));
    renderPage();

    await screen.findByText("Ana Ruiz");
    expect(screen.queryByRole("button", { name: "Cambiar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Asignar" })).not.toBeInTheDocument();
  });
});
