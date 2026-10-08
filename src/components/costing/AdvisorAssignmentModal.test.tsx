import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { professorsApi, type Professor } from "@/lib/api/professors";
import { MOCK_REQUESTS, type RequestItem } from "@/lib/mock-data";
import { AdvisorAssignmentModal } from "./AdvisorAssignmentModal";

vi.mock("@/lib/api/professors", () => ({ professorsApi: { list: vi.fn(), create: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedList = vi.mocked(professorsApi.list);

const staff: Professor = {
  id: "s1",
  fullName: "Nohra Villegas",
  type: "STAFF",
  faculty: "Ingeniería",
  company: null,
  identityDocument: null,
  email: null,
  phone: null,
  profile: null,
  isActive: true,
};
const registered: Professor = {
  id: "e1",
  fullName: "Ana Ruiz",
  type: "EXTERNAL",
  faculty: null,
  company: "Consultores SAS",
  identityDocument: "CC 94.456.789",
  email: "ana.ruiz@consultores.com",
  phone: "+57 315 123 4567",
  profile: "Especialista en transformación digital.",
  isActive: true,
};
const accented: Professor = { ...staff, id: "s2", fullName: "Andrés Muñoz", faculty: "Derecho" };

const request: RequestItem = {
  ...MOCK_REQUESTS[0],
  professor: undefined,
  professorType: undefined,
  externalProfessorData: undefined,
};

type Save = (name: string, type: "planta" | "externo", data?: unknown, professorId?: string) => void | Promise<void>;

function renderModal(onSaveAssignment: Save = vi.fn(), current: RequestItem = request) {
  const onClose = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AdvisorAssignmentModal isOpen onClose={onClose} request={current} onSaveAssignment={onSaveAssignment} />
    </QueryClientProvider>,
  );
  return { onSaveAssignment, onClose };
}

const nameInput = () => screen.getByRole("combobox", { name: /Nombre completo/ });
const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });
const save = () => fireEvent.click(screen.getByRole("button", { name: /Guardar asignación/ }));
const pick = async (typed: string, optionName: RegExp) => {
  type(nameInput(), typed);
  fireEvent.click(await screen.findByRole("option", { name: optionName }));
};

describe("AdvisorAssignmentModal: one form for both kinds", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedList.mockResolvedValue([staff, registered, accented]);
  });

  it("is a single form (no tabs) that switches between planta and externo", () => {
    renderModal();

    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    const switcher = screen.getByRole("radiogroup", { name: /Tipo de docente/ });
    expect(within(switcher).getByRole("radio", { name: /planta/i })).toBeChecked();

    // Planta: faculty; the common fields are always there.
    expect(screen.getByLabelText("Facultad")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Firma consultora/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Cédula/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo electrónico/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Especialidad/)).toBeInTheDocument();

    fireEvent.click(within(switcher).getByRole("radio", { name: /externo/i }));

    expect(within(switcher).getByRole("radio", { name: /externo/i })).toBeChecked();
    expect(screen.getByLabelText(/Firma consultora/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Facultad")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Cédula/)).toBeInTheDocument();
  });

  it("switches the kind with the arrow keys", () => {
    renderModal();
    const planta = screen.getByRole("radio", { name: /planta/i });

    fireEvent.keyDown(planta, { key: "ArrowRight" });

    expect(screen.getByRole("radio", { name: /externo/i })).toBeChecked();
  });

  it("requires the name: it marks the field, explains with a toast and does not save", () => {
    const { onSaveAssignment } = renderModal();

    save();

    expect(toast.error).toHaveBeenCalledWith("Ingresa el nombre completo.");
    expect(screen.getByRole("alert")).toHaveTextContent("Ingresa el nombre completo.");
    expect(nameInput()).toHaveAttribute("aria-invalid", "true");
    expect(onSaveAssignment).not.toHaveBeenCalled();
  });

  it("validates the e-mail format and clears the error once it is fixed", () => {
    const { onSaveAssignment } = renderModal();
    type(nameInput(), "Luis Mora");
    type(screen.getByLabelText(/Correo electrónico/), "luis@");

    save();

    expect(screen.getByRole("alert")).toHaveTextContent(/correo válido/);
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveAttribute("aria-invalid", "true");
    expect(onSaveAssignment).not.toHaveBeenCalled();

    type(screen.getByLabelText(/Correo electrónico/), "luis@mora.co");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("creates a new entry: a name that matches nothing is saved with the typed data and no professorId", async () => {
    const { onSaveAssignment, onClose } = renderModal();

    fireEvent.click(screen.getByRole("radio", { name: /externo/i }));
    type(nameInput(), "Luis Mora");
    await screen.findByText(/se creará como nuevo al guardar/);
    type(screen.getByLabelText(/Firma consultora/), "Mora SAS");
    type(screen.getByLabelText(/Cédula/), "CC 12.345.678");
    type(screen.getByLabelText(/Correo electrónico/), "luis.mora@example.com");
    type(screen.getByLabelText(/Teléfono/), "+57 300 111 2222");
    type(screen.getByLabelText(/Especialidad/), "Consultor de innovación.");
    save();

    await waitFor(() =>
      expect(onSaveAssignment).toHaveBeenCalledWith(
        "Luis Mora",
        "externo",
        {
          nombre: "Luis Mora",
          identificacion: "CC 12.345.678",
          facultad: undefined,
          empresaConsultora: "Mora SAS",
          correo: "luis.mora@example.com",
          telefono: "+57 300 111 2222",
          perfil: "Consultor de innovación.",
        },
        undefined,
      ),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalled();
  });

  it("saves a planta professor with only its name and faculty", async () => {
    const { onSaveAssignment } = renderModal();

    type(nameInput(), "Zoila Prado");
    type(screen.getByLabelText("Facultad"), "Derecho");
    save();

    await waitFor(() =>
      expect(onSaveAssignment).toHaveBeenCalledWith(
        "Zoila Prado",
        "planta",
        expect.objectContaining({ nombre: "Zoila Prado", facultad: "Derecho", empresaConsultora: undefined }),
        undefined,
      ),
    );
  });
});

describe("AdvisorAssignmentModal: name suggestions from the directory", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedList.mockResolvedValue([staff, registered, accented]);
  });

  it("does not search before two characters", async () => {
    renderModal();

    type(nameInput(), "n");

    await screen.findByText(/Escribe al menos 2 letras/);
    expect(mockedList).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("suggests from two characters, ignoring case", async () => {
    renderModal();

    type(nameInput(), "NOH");

    expect(await screen.findByRole("option", { name: /Nohra Villegas/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Ana Ruiz/ })).not.toBeInTheDocument();
    expect(mockedList).toHaveBeenCalledWith(expect.objectContaining({ q: "NOH" }));
  });

  it("matches ignoring accents in what is typed and in the stored name", async () => {
    renderModal();

    type(nameInput(), "andres munoz");

    expect(await screen.findByRole("option", { name: /Andrés Muñoz/ })).toBeInTheDocument();
  });

  it("fills the form from the chosen entry, shows it read-only and locks the kind", async () => {
    renderModal();

    await pick("ana", /Ana Ruiz/);

    expect(screen.getByRole("radio", { name: /externo/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /externo/i })).toBeDisabled();
    const name = screen.getByLabelText(/Nombre completo/);
    expect(name).toHaveValue("Ana Ruiz");
    expect(name).toHaveAttribute("readonly");
    expect(screen.getByLabelText(/Firma consultora/)).toHaveValue("Consultores SAS");
    expect(screen.getByLabelText(/Cédula/)).toHaveValue("CC 94.456.789");
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue("ana.ruiz@consultores.com");
    expect(screen.getByLabelText(/Teléfono/)).toHaveValue("+57 315 123 4567");
    expect(screen.getByLabelText(/Especialidad/)).toHaveValue("Especialista en transformación digital.");
    for (const field of [/Firma consultora/, /Cédula/, /Correo electrónico/, /Teléfono/, /Especialidad/]) {
      expect(screen.getByLabelText(field)).toHaveAttribute("readonly");
    }
  });

  it("reuses the chosen entry: it saves with its id", async () => {
    const { onSaveAssignment, onClose } = renderModal();

    await pick("nohra", /Nohra Villegas/);
    save();

    await waitFor(() =>
      expect(onSaveAssignment).toHaveBeenCalledWith(
        "Nohra Villegas",
        "planta",
        expect.objectContaining({ nombre: "Nohra Villegas", facultad: "Ingeniería" }),
        "s1",
      ),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("'Cambiar' clears the entry and lets the leader type again, as a new one", async () => {
    const { onSaveAssignment } = renderModal();
    await pick("ana", /Ana Ruiz/);

    fireEvent.click(screen.getByRole("button", { name: "Cambiar" }));

    expect(screen.queryByRole("button", { name: "Cambiar" })).not.toBeInTheDocument();
    expect(nameInput()).toHaveValue("");
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue("");
    expect(screen.getByLabelText(/Correo electrónico/)).not.toHaveAttribute("readonly");
    expect(screen.getByRole("radio", { name: /externo/i })).toBeEnabled();

    type(nameInput(), "Ana Ruiz Otra");
    save();
    await waitFor(() =>
      expect(onSaveAssignment).toHaveBeenCalledWith("Ana Ruiz Otra", "externo", expect.any(Object), undefined),
    );
  });

  it("chooses a suggestion with the keyboard without submitting the form", async () => {
    const { onSaveAssignment } = renderModal();
    type(nameInput(), "nohra");
    await screen.findByRole("option", { name: /Nohra Villegas/ });

    fireEvent.keyDown(nameInput(), { key: "ArrowDown" });
    expect(nameInput()).toHaveAttribute("aria-activedescendant");
    fireEvent.keyDown(nameInput(), { key: "Enter" });

    expect(screen.getByLabelText(/Nombre completo/)).toHaveAttribute("readonly");
    expect(onSaveAssignment).not.toHaveBeenCalled();
  });

  it("keeps the typed name usable when the directory cannot be reached", async () => {
    mockedList.mockRejectedValue(new Error("network"));
    renderModal();

    type(nameInput(), "Luis Mora");

    expect(await screen.findByText(/No pudimos consultar el directorio/)).toBeInTheDocument();
  });
});

describe("AdvisorAssignmentModal: saving", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedList.mockResolvedValue([]);
  });

  it("disables the form while saving and closes only when it succeeds", async () => {
    let finish: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const { onClose } = renderModal(vi.fn(() => pending));
    type(nameInput(), "Luis Mora");

    save();

    const button = await screen.findByRole("button", { name: /Guardando/ });
    expect(button).toBeDisabled();
    expect(nameInput()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();

    finish();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows an error toast, stays open and keeps what was typed when the save fails", async () => {
    const { onClose } = renderModal(vi.fn().mockRejectedValue(new Error("boom")));
    type(nameInput(), "Luis Mora");

    save();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("No pudimos asignar")));
    expect(toast.success).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(nameInput()).toHaveValue("Luis Mora");
    expect(nameInput()).toBeEnabled();
    expect(screen.getByRole("button", { name: /Guardar asignación/ })).toBeEnabled();
  });

  it("explains that the request no longer allows the change (409)", async () => {
    renderModal(vi.fn().mockRejectedValue(new ApiError(409, "locked")));
    type(nameInput(), "Luis Mora");

    save();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("ya no permite cambiar el docente")),
    );
  });

  it("starts empty and mentions the current assignment, which the save replaces", () => {
    renderModal(vi.fn(), { ...request, professor: "Lina Ayala", professorType: "planta" });

    expect(screen.getByText(/Asignado actualmente/)).toHaveTextContent("Lina Ayala");
    expect(nameInput()).toHaveValue("");
  });
});
