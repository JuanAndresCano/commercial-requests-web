import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PendingApproval from "./PendingApproval";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/lib/app-router";
import { toast } from "sonner";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/app-router", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button aria-label="Cambiar tema">Tema</button>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("PendingApproval view (Onboarding & Role Selection)", () => {
  const replaceMock = vi.fn();
  const refreshSessionMock = vi.fn();
  const requestRoleMock = vi.fn();
  const logoutMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      replace: replaceMock,
    });
  });

  it("renders role selection cards when user has not yet requested a role", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "pending-role",
      user: {
        name: "Carlos Mora",
        email: "carlos.mora@icesi.edu.co",
        requestedRole: null,
      },
      refreshSession: refreshSessionMock,
      requestRole: requestRoleMock,
      logout: logoutMock,
    });

    render(<PendingApproval />);

    expect(screen.getByText("Selecciona tu Rol Operativo")).toBeInTheDocument();
    expect(screen.getByText("Asesor Comercial (KAM)")).toBeInTheDocument();
    expect(screen.getByText("Líder de Producto")).toBeInTheDocument();
    expect(screen.getByText("Enviar solicitud de rol")).toBeInTheDocument();
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  it("opens confirmation dialog and submits requested role", async () => {
    requestRoleMock.mockResolvedValue(undefined);

    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "pending-role",
      user: {
        name: "Carlos Mora",
        email: "carlos.mora@icesi.edu.co",
        requestedRole: null,
      },
      refreshSession: refreshSessionMock,
      requestRole: requestRoleMock,
      logout: logoutMock,
    });

    render(<PendingApproval />);

    // Click on Líder de Producto
    fireEvent.click(screen.getByText("Líder de Producto"));

    // Click on Enviar solicitud de rol
    fireEvent.click(screen.getByText("Enviar solicitud de rol"));

    // Confirmation dialog should be open
    expect(screen.getByText(/¿Confirmas tu rol como Líder de Producto\?/i)).toBeInTheDocument();
    expect(screen.getByText(/No podrás cambiar esta elección una vez enviada/i)).toBeInTheDocument();

    // Confirm submission
    fireEvent.click(screen.getByText("Confirmar y enviar"));

    await waitFor(() => {
      expect(requestRoleMock).toHaveBeenCalledWith("PRODUCT_LEADER");
      expect(toast.success).toHaveBeenCalledWith("¡Solicitud enviada!", expect.any(Object));
    });
  });

  it("renders the locked state when user has already submitted their role choice", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "pending-role",
      user: {
        name: "Carlos Mora",
        email: "carlos.mora@icesi.edu.co",
        requestedRole: "KAM",
      },
      refreshSession: refreshSessionMock,
      requestRole: requestRoleMock,
      logout: logoutMock,
    });

    render(<PendingApproval />);

    expect(screen.getByText("Solicitud de Rol en Proceso")).toBeInTheDocument();
    expect(screen.getByText("Has solicitado el rol de Asesor Comercial (KAM)")).toBeInTheDocument();
    expect(screen.getByText("Solo puedes enviar esta solicitud una vez")).toBeInTheDocument();
    expect(screen.queryByText("Enviar solicitud de rol")).not.toBeInTheDocument();
  });

  it("calls logout and redirects to /login when clicking Cerrar sesión", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "pending-role",
      user: {
        name: "Carlos Mora",
        email: "carlos.mora@icesi.edu.co",
        requestedRole: "KAM",
      },
      refreshSession: refreshSessionMock,
      requestRole: requestRoleMock,
      logout: logoutMock,
    });

    render(<PendingApproval />);

    fireEvent.click(screen.getByText("Cerrar sesión"));

    expect(logoutMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });
});
