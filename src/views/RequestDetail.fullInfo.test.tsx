import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { TestRouter } from "@/test/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RequestDetail from "./RequestDetail";
import { ThemeProvider } from "@/context/ThemeContext";
import { professorsApi } from "@/lib/api/professors";
import { requestsApi, type ProposalDetail } from "@/lib/api/requests";
import { ApiError } from "@/lib/api/client";

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
      updateInfo: vi.fn(),
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
        <TestRouter route="/solicitudes/REQ-2026-0002" routes={{ "/solicitudes/:id": <RequestDetail /> }} />
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

  it("keeps it above the costing once the request reaches costing: same place in every stage", async () => {
    authMock.user = LEADER_USER;
    load(proposal("IN_COSTING"));
    renderPage();

    const info = await infoTitle();

    expect(before(info, await screen.findByText("Costeo Financiero"))).toBe(true);
  });
});

describe("KAM customer editing window", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(professorsApi.list).mockResolvedValue([]);
    authMock.user = KAM_USER;
  });

  it.each(["NEW", "IN_PROGRESS", "IN_COSTING"])(
    "lets the owner edit customer data in %s even with an assigned professor",
    async (code) => {
      const detail = proposal(code);
      detail.assignments = [
        { role: "PROFESSOR", professor: { id: "p1", fullName: "Docente asignado", type: "STAFF" } },
      ] as unknown as ProposalDetail["assignments"];
      load(detail);
      renderPage();
      expect(await screen.findByRole("button", { name: "Editar empresa y contacto" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Editar información" })).not.toBeInTheDocument();
    },
  );

  it("offers a single edit button while the full editor is open: no duplicated customer editor in a new request", async () => {
    load(proposal("NEW"));
    renderPage();
    expect(await screen.findByRole("button", { name: "Editar información" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar empresa y contacto" })).not.toBeInTheDocument();
  });

  it.each(["DELIVERED", "REJECTED", "CANCELLED"])(
    "does not offer customer mutation in closed operational status %s",
    async (code) => {
      load(proposal(code));
      renderPage();
      await infoTitle();
      expect(screen.queryByRole("button", { name: "Editar empresa y contacto" })).not.toBeInTheDocument();
    },
  );

  it("does not offer customer edits to another KAM", async () => {
    authMock.user = { ...KAM_USER, email: "otra@icesi.edu.co" };
    load(proposal("IN_PROGRESS"));
    renderPage();
    await infoTitle();
    expect(screen.queryByRole("button", { name: "Editar empresa y contacto" })).not.toBeInTheDocument();
  });
});

describe("Edit request information: CIIU and phone rules match the wizard and the backend", () => {
  const CIIU_MESSAGE = "El CIIU debe tener exactamente 4 dígitos";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(professorsApi.list).mockResolvedValue([]);
    vi.mocked(requestsApi.updateInfo).mockResolvedValue(proposal("NEW"));
    authMock.user = KAM_USER;
    toastMock.error.mockClear();
  });

  async function openCompanyTab(company: Record<string, unknown> = {}) {
    const detail = proposal("NEW");
    detail.company = { ...detail.company, ...company } as ProposalDetail["company"];
    load(detail);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Editar información" }));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Empresa" }), { button: 0 });
    return await screen.findByLabelText("CIIU principal");
  }
  const save = () => fireEvent.click(screen.getByRole("button", { name: /Guardar información/i }));

  it("blocks the saved 13-digit CIIU with an error on the field and never calls the API", async () => {
    const ciiu = await openCompanyTab({ ciiuCode: "4845858858558" });
    expect(ciiu).toHaveValue("4845858858558");
    expect(screen.getByText(CIIU_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guardar información/i })).toBeDisabled();
    save();
    expect(requestsApi.updateInfo).not.toHaveBeenCalled();
  });

  // UX H4: the discard confirmation uses the system dialog, not the browser's window.confirm.
  it("asks with the system dialog before discarding unsaved changes", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    const ciiu = await openCompanyTab();
    fireEvent.change(ciiu, { target: { value: "8544" } });

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByText("¿Descartar los cambios?")).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();

    // "Seguir editando" keeps the edit open and what was typed
    fireEvent.click(screen.getByRole("button", { name: "Seguir editando" }));
    await waitFor(() => expect(screen.queryByText("¿Descartar los cambios?")).not.toBeInTheDocument());
    expect(screen.getByLabelText("CIIU principal")).toHaveValue("8544");

    // "Descartar cambios" closes the edit without saving
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Descartar cambios" }));
    await waitFor(() => expect(screen.queryByLabelText("CIIU principal")).not.toBeInTheDocument());
    expect(requestsApi.updateInfo).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it.each(["854", "85445", "85a4"])("blocks the typed CIIU «%s»", async (value) => {
    const ciiu = await openCompanyTab();
    fireEvent.change(ciiu, { target: { value } });
    expect(screen.getByText(CIIU_MESSAGE)).toBeInTheDocument();
    save();
    expect(requestsApi.updateInfo).not.toHaveBeenCalled();
  });

  it("saves a four-digit CIIU", async () => {
    const ciiu = await openCompanyTab({ ciiuCode: "4845858858558" });
    fireEvent.change(ciiu, { target: { value: " 4845 " } });
    expect(screen.queryByText(CIIU_MESSAGE)).not.toBeInTheDocument();
    save();
    await waitFor(() => expect(requestsApi.updateInfo).toHaveBeenCalledTimes(1));
    expect(vi.mocked(requestsApi.updateInfo).mock.calls[0][1]).toMatchObject({ ciiuCode: "4845" });
  });

  it("treats Pendiente as no CIIU and clears it (null)", async () => {
    const ciiu = await openCompanyTab({ ciiuCode: "8544" });
    fireEvent.change(ciiu, { target: { value: "Pendiente" } });
    expect(screen.queryByText(CIIU_MESSAGE)).not.toBeInTheDocument();
    save();
    await waitFor(() => expect(requestsApi.updateInfo).toHaveBeenCalledTimes(1));
    expect(vi.mocked(requestsApi.updateInfo).mock.calls[0][1]).toMatchObject({ ciiuCode: null });
  });

  const PHONE_MESSAGE = "El teléfono debe tener 10 dígitos (puede iniciar con +57)";

  it.each([
    ["19 digits", "1234567890123456789"],
    ["only parentheses", "((((((("],
    ["a plus sign in the middle", "300+1234567"],
    ["seven digits", "5551234"],
    ["nine digits", "300123456"],
    ["eleven digits", "30012345678"],
  ])("flags a company phone with %s on the field instead of a raw 400", async (_name, phone) => {
    await openCompanyTab();
    fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: phone } });
    expect(screen.getByText(PHONE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guardar información/i })).toBeDisabled();
    save();
    expect(requestsApi.updateInfo).not.toHaveBeenCalled();
  });

  it.each(["+57 3001234567", "573001234567", "300 123 4567", "(300) 123-4567", "3001234567"])(
    "accepts the phone «%s»",
    async (phone) => {
      await openCompanyTab();
      fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: phone } });
      expect(screen.queryByText(PHONE_MESSAGE)).not.toBeInTheDocument();
    },
  );

  it.each([
    ["contact phone", "Teléfono"],
    ["secondary contact phone", "Teléfono secundario"],
  ])("flags a 7-digit %s on the Contacto tab and never calls the API", async (_name, label) => {
    const detail = proposal("NEW");
    detail.company = { ...detail.company, email: "empresa@cliente.co" } as ProposalDetail["company"];
    load(detail);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Editar información" }));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Contacto" }), { button: 0 });
    fireEvent.change(await screen.findByLabelText(label, { selector: "input" }), { target: { value: "5551234" } });
    expect(screen.getByText(PHONE_MESSAGE)).toBeInTheDocument();
    save();
    expect(requestsApi.updateInfo).not.toHaveBeenCalled();
  });
});

describe("Edit request information: minimum contact channel (checked on the client, in Spanish)", () => {
  const CHANNEL_MESSAGE = "Deja al menos un teléfono o correo válido";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(professorsApi.list).mockResolvedValue([]);
    vi.mocked(requestsApi.updateInfo).mockResolvedValue(proposal("NEW"));
    authMock.user = KAM_USER;
    toastMock.error.mockClear();
  });

  async function open(company: Record<string, unknown>, contact?: Record<string, unknown>) {
    const detail = proposal("NEW");
    detail.company = { ...detail.company, ...company } as ProposalDetail["company"];
    if (contact) detail.contact = contact as unknown as ProposalDetail["contact"];
    load(detail);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Editar información" }));
  }
  const tab = (name: string) => screen.getByRole("tab", { name });
  const goTo = (name: string) => fireEvent.mouseDown(tab(name), { button: 0 });
  const save = () => fireEvent.click(screen.getByRole("button", { name: /Guardar información/i }));

  it("removing the last channel shows the Spanish message next to the form, marks the tabs and never calls the API", async () => {
    await open({ phone: "3001234567" });
    goTo("Empresa");
    fireEvent.change(await screen.findByLabelText("Teléfono"), { target: { value: "" } });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(CHANNEL_MESSAGE);
    expect(tab("Empresa")).toHaveAttribute("data-invalid", "true");
    expect(tab("Contacto")).toHaveAttribute("data-invalid", "true");
    expect(tab("General")).not.toHaveAttribute("data-invalid");
    expect(screen.getByLabelText("Teléfono")).toHaveAttribute("aria-invalid", "true");
    save();
    expect(requestsApi.updateInfo).not.toHaveBeenCalled();
    expect(toastMock.error).not.toHaveBeenCalledWith(expect.stringMatching(/At least one/));
  });

  it("shows the message even when the user is on another tab, and the marker tells which tab has the problem", async () => {
    await open({ email: "empresa@cliente.co" });
    goTo("Empresa");
    fireEvent.change(await screen.findByLabelText("Correo"), { target: { value: "" } });
    goTo("General");
    expect(await screen.findByRole("alert")).toHaveTextContent(CHANNEL_MESSAGE);
    expect(tab("Empresa")).toHaveAttribute("data-invalid", "true");
  });

  it("an invalid phone does not count as a channel", async () => {
    await open({ phone: "3001234567" });
    goTo("Empresa");
    fireEvent.change(await screen.findByLabelText("Teléfono"), { target: { value: "5551234" } });
    expect(screen.getAllByRole("alert").map((n) => n.textContent)).toContain(CHANNEL_MESSAGE);
  });

  it("removing one channel while another remains saves", async () => {
    await open({ phone: "3001234567", email: "empresa@cliente.co" });
    goTo("Empresa");
    fireEvent.change(await screen.findByLabelText("Teléfono"), { target: { value: "" } });
    expect(screen.queryByText(CHANNEL_MESSAGE)).not.toBeInTheDocument();
    expect(tab("Empresa")).not.toHaveAttribute("data-invalid");
    save();
    await waitFor(() => expect(requestsApi.updateInfo).toHaveBeenCalledTimes(1));
    expect(vi.mocked(requestsApi.updateInfo).mock.calls[0][1]).toMatchObject({ companyPhone: null });
  });

  it("the contact channel alone is enough: the company may stay empty", async () => {
    await open({}, { name: "Ana", email: "ana@cliente.co" });
    goTo("Empresa");
    fireEvent.change(await screen.findByLabelText("Dirección"), { target: { value: "Calle 1" } });
    expect(screen.queryByText(CHANNEL_MESSAGE)).not.toBeInTheDocument();
    save();
    await waitFor(() => expect(requestsApi.updateInfo).toHaveBeenCalledTimes(1));
  });

  it("an inherited request with no channel can still save other fields", async () => {
    await open({});
    goTo("General");
    fireEvent.change(await screen.findByLabelText("Título de la propuesta"), { target: { value: "Nuevo título" } });
    expect(screen.queryByText(CHANNEL_MESSAGE)).not.toBeInTheDocument();
    save();
    await waitFor(() => expect(requestsApi.updateInfo).toHaveBeenCalledTimes(1));
  });

  it("if the server still answers 400 about contactability it is shown in Spanish, never in English", async () => {
    vi.mocked(requestsApi.updateInfo).mockRejectedValue(new ApiError(400, "Deja al menos un teléfono o correo válido"));
    await open({ phone: "3001234567" });
    goTo("Empresa");
    fireEvent.change(await screen.findByLabelText("Dirección"), { target: { value: "Calle 1" } });
    save();
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(CHANNEL_MESSAGE));
    expect(await screen.findByRole("alert")).toHaveTextContent(CHANNEL_MESSAGE);
    expect(screen.queryByText(/At least one/)).not.toBeInTheDocument();
  });

  it("maps a server 400 about a phone to the Spanish phone rule", async () => {
    vi.mocked(requestsApi.updateInfo).mockRejectedValue(new ApiError(400, "companyPhone must be a valid phone"));
    await open({ phone: "3001234567" });
    goTo("Empresa");
    fireEvent.change(await screen.findByLabelText("Dirección"), { target: { value: "Calle 1" } });
    save();
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("El teléfono debe tener 10 dígitos (puede iniciar con +57)"),
    );
  });
});
