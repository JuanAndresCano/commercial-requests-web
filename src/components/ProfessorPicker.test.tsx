import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { professorsApi, type Professor } from "@/lib/api/professors";
import { ProfessorPicker } from "./ProfessorPicker";

vi.mock("@/lib/api/professors", () => ({ professorsApi: { list: vi.fn(), createExternal: vi.fn() } }));

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
const noFaculty: Professor = { ...staff, id: "s2", fullName: "Lina Ayala", faculty: null };

function renderPicker(props: Partial<React.ComponentProps<typeof ProfessorPicker>> = {}) {
  const onSelect = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ProfessorPicker type="STAFF" onSelect={onSelect} {...props} />
    </QueryClientProvider>,
  );
  return onSelect;
}

describe("ProfessorPicker", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists the first directory entries without typing, with faculty or a placeholder", async () => {
    mockedList.mockResolvedValue([staff, noFaculty]);
    renderPicker();

    expect(await screen.findByText("Nohra Villegas")).toBeInTheDocument();
    expect(screen.getByText("Ingeniería")).toBeInTheDocument();
    expect(screen.getByText("Facultad sin registrar")).toBeInTheDocument();
    expect(mockedList).toHaveBeenCalledWith({ q: undefined, type: "STAFF" });
  });

  it("searches the backend by what the user types", async () => {
    mockedList.mockResolvedValue([staff]);
    renderPicker();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "nohra" } });

    await waitFor(() => expect(mockedList).toHaveBeenCalledWith({ q: "nohra", type: "STAFF" }));
  });

  it("reports the picked entry and highlights the selected one", async () => {
    mockedList.mockResolvedValue([staff]);
    const onSelect = renderPicker({ selectedId: "s1" });

    const button = await screen.findByRole("button", { name: /Nohra Villegas/ });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledWith(staff);
  });

  it("shows the company of external advisors", async () => {
    mockedList.mockResolvedValue([
      { ...staff, id: "e1", fullName: "Ana Ruiz", type: "EXTERNAL", faculty: null, company: "Consultores SAS" },
    ]);
    renderPicker({ type: "EXTERNAL" });

    expect(await screen.findByText("Consultores SAS")).toBeInTheDocument();
    expect(mockedList).toHaveBeenCalledWith({ q: undefined, type: "EXTERNAL" });
  });

  it("tells the user when nothing matches", async () => {
    mockedList.mockResolvedValue([]);
    renderPicker();

    expect(await screen.findByText(/Sin coincidencias/)).toBeInTheDocument();
  });

  it("degrades gracefully when the directory cannot be reached", async () => {
    mockedList.mockRejectedValue(new Error("network"));
    renderPicker();

    expect(await screen.findByText(/No pudimos consultar el directorio/)).toBeInTheDocument();
  });
});
