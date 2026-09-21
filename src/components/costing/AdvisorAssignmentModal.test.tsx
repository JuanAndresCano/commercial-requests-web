import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { professorsApi, type Professor } from "@/lib/api/professors";
import { MOCK_REQUESTS, type RequestItem } from "@/lib/mock-data";
import { AdvisorAssignmentModal } from "./AdvisorAssignmentModal";

vi.mock("@/lib/api/professors", () => ({ professorsApi: { list: vi.fn(), createExternal: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedList = vi.mocked(professorsApi.list);
const mockedCreate = vi.mocked(professorsApi.createExternal);

const staff: Professor = {
  id: "s1",
  fullName: "Nohra Villegas",
  type: "STAFF",
  faculty: "Ingeniería",
  company: null,
  isActive: true,
};
const registered: Professor = {
  id: "e1",
  fullName: "Ana Ruiz",
  type: "EXTERNAL",
  faculty: null,
  company: "Consultores SAS",
  isActive: true,
};

const plantaRequest: RequestItem = {
  ...MOCK_REQUESTS[0],
  professor: undefined,
  professorType: undefined,
  externalProfessorData: undefined,
};
const externoRequest: RequestItem = { ...plantaRequest, professorType: "externo" };

function renderModal(request: RequestItem) {
  const onSaveAssignment = vi.fn();
  const onClose = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AdvisorAssignmentModal isOpen onClose={onClose} request={request} onSaveAssignment={onSaveAssignment} />
    </QueryClientProvider>,
  );
  return { onSaveAssignment, onClose };
}

const save = () => fireEvent.click(screen.getByRole("button", { name: /Guardar asignación/ }));

describe("AdvisorAssignmentModal with the professor directory", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedList.mockImplementation((params) => Promise.resolve(params?.type === "EXTERNAL" ? [registered] : [staff]));
  });

  it("assigns a staff professor picked from the directory, passing its id as 4th argument", async () => {
    const { onSaveAssignment, onClose } = renderModal(plantaRequest);

    fireEvent.click(await screen.findByRole("button", { name: /Nohra Villegas/ }));
    expect(screen.getByText(/Facultad: Ingeniería/)).toBeInTheDocument();
    save();

    await waitFor(() => expect(onSaveAssignment).toHaveBeenCalledWith("Nohra Villegas", "planta", undefined, "s1"));
    expect(onClose).toHaveBeenCalled();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("does not save a staff assignment until a professor is picked", async () => {
    const { onSaveAssignment } = renderModal(plantaRequest);
    await screen.findByRole("button", { name: /Nohra Villegas/ });

    save();

    expect(toast.error).toHaveBeenCalledWith("Por favor selecciona un profesor de planta");
    expect(onSaveAssignment).not.toHaveBeenCalled();
  });

  it("assigns an already registered external advisor without registering it again", async () => {
    const { onSaveAssignment } = renderModal(externoRequest);

    fireEvent.click(await screen.findByRole("button", { name: /Ana Ruiz/ }));
    expect(screen.getByLabelText(/Nombre completo/)).toHaveValue("Ana Ruiz");
    expect(screen.getByLabelText(/Firma consultora/)).toHaveValue("Consultores SAS");
    save();

    await waitFor(() =>
      expect(onSaveAssignment).toHaveBeenCalledWith(
        "Ana Ruiz",
        "externo",
        expect.objectContaining({ nombre: "Ana Ruiz", empresaConsultora: "Consultores SAS" }),
        "e1",
      ),
    );
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("registers a new external advisor in the directory and then assigns it", async () => {
    mockedCreate.mockResolvedValue({ ...registered, id: "e9", fullName: "Luis Mora", company: "Mora SAS" });
    const { onSaveAssignment } = renderModal(externoRequest);

    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: "Luis Mora" } });
    fireEvent.change(screen.getByLabelText(/Firma consultora/), { target: { value: "Mora SAS" } });
    save();

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledWith({ fullName: "Luis Mora", company: "Mora SAS" }));
    await waitFor(() =>
      expect(onSaveAssignment).toHaveBeenCalledWith("Luis Mora", "externo", expect.any(Object), "e9"),
    );
  });

  it("treats an edited registered advisor as a new one", async () => {
    mockedCreate.mockResolvedValue({ ...registered, id: "e10", fullName: "Ana Ruiz Otra" });
    renderModal(externoRequest);

    fireEvent.click(await screen.findByRole("button", { name: /Ana Ruiz/ }));
    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: "Ana Ruiz Otra" } });
    save();

    await waitFor(() =>
      expect(mockedCreate).toHaveBeenCalledWith({ fullName: "Ana Ruiz Otra", company: "Consultores SAS" }),
    );
  });

  it("does not assign and explains when the advisor is already registered (409)", async () => {
    mockedCreate.mockRejectedValue(new ApiError(409, "already registered"));
    const { onSaveAssignment } = renderModal(externoRequest);

    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: "Ana Ruiz" } });
    save();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("ya está registrado en el directorio")),
    );
    expect(onSaveAssignment).not.toHaveBeenCalled();
  });

  it("does not assign when the directory cannot be reached", async () => {
    mockedCreate.mockRejectedValue(new Error("network"));
    const { onSaveAssignment } = renderModal(externoRequest);

    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: "Luis Mora" } });
    save();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("No pudimos registrar")));
    expect(onSaveAssignment).not.toHaveBeenCalled();
  });
});
