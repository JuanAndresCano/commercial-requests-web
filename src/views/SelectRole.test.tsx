import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TestRouter } from "@/test/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SelectRole from "./SelectRole";

const assignInitialRoleMock = vi.hoisted(() => vi.fn());
const mockUser = {
  id: "new-user-123",
  email: "nuevo.colaborador@icesi.edu.co",
  name: "Nuevo Colaborador",
  role: "kam" as const,
  roleLabel: "KAM",
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    status: "pending-role",
    assignInitialRole: assignInitialRoleMock,
  }),
}));

const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

describe("SelectRole view (Onboarding)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders strictly the two permitted self-assignable roles: KAM and Líder de Producto", () => {
    render(
      <TestRouter>
        <SelectRole />
      </TestRouter>,
    );

    expect(screen.getByText("Key Account Manager (KAM)")).toBeInTheDocument();
    expect(screen.getByText("Líder de Producto")).toBeInTheDocument();

    // Must NOT render Administrador as an option
    expect(screen.queryByText("Administrador (ADMIN)")).not.toBeInTheDocument();
    // Must NOT render Líder de Nodo
    expect(screen.queryByText("Líder de Nodo")).not.toBeInTheDocument();
  });

  it("allows selecting KAM and confirms role assignment", async () => {
    assignInitialRoleMock.mockResolvedValue(undefined);

    render(
      <TestRouter>
        <SelectRole />
      </TestRouter>,
    );

    const kamCard = screen.getByText("Key Account Manager (KAM)");
    fireEvent.click(kamCard);

    const continueButton = screen.getByRole("button", {
      name: /Continuar con Key Account Manager/i,
    });
    fireEvent.click(continueButton);

    // Modal dialog is shown
    expect(screen.getByText("Confirmar asignación de rol")).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", {
      name: "Sí, confirmar rol",
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(assignInitialRoleMock).toHaveBeenCalledWith("KAM");
    });
  });

  it("allows selecting Líder de Producto and confirms role assignment", async () => {
    assignInitialRoleMock.mockResolvedValue(undefined);

    render(
      <TestRouter>
        <SelectRole />
      </TestRouter>,
    );

    const ldpCard = screen.getByText("Líder de Producto");
    fireEvent.click(ldpCard);

    const continueButton = screen.getByRole("button", {
      name: /Continuar con Líder de Producto/i,
    });
    fireEvent.click(continueButton);

    const confirmButton = screen.getByRole("button", {
      name: "Sí, confirmar rol",
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(assignInitialRoleMock).toHaveBeenCalledWith("PRODUCT_LEADER");
    });
  });
});
