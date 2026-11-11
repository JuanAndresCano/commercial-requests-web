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

describe("PendingApproval view (Onboarding)", () => {
  const replaceMock = vi.fn();
  const refreshSessionMock = vi.fn();
  const logoutMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      replace: replaceMock,
    });
  });

  it("renders the institutional waiting view with user details", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "pending-role",
      user: {
        name: "Carlos Mora",
        email: "carlos.mora@icesi.edu.co",
      },
      refreshSession: refreshSessionMock,
      logout: logoutMock,
    });

    render(<PendingApproval />);

    expect(screen.getByText("Tu cuenta está pendiente de aprobación")).toBeInTheDocument();
    expect(screen.getAllByText("Carlos Mora").length).toBeGreaterThan(0);
    expect(screen.getAllByText("carlos.mora@icesi.edu.co").length).toBeGreaterThan(0);
    expect(screen.getByText("Comprobar estado")).toBeInTheDocument();
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  it("calls logout and redirects to /login when clicking Cerrar sesión", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "pending-role",
      user: {
        name: "Carlos Mora",
        email: "carlos.mora@icesi.edu.co",
      },
      refreshSession: refreshSessionMock,
      logout: logoutMock,
    });

    render(<PendingApproval />);

    fireEvent.click(screen.getByText("Cerrar sesión"));

    expect(logoutMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("checks status and shows info toast when still pending", async () => {
    refreshSessionMock.mockResolvedValue({
      id: "u1",
      email: "carlos.mora@icesi.edu.co",
      roles: [],
      isPendingRole: true,
    });

    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "pending-role",
      user: {
        name: "Carlos Mora",
        email: "carlos.mora@icesi.edu.co",
      },
      refreshSession: refreshSessionMock,
      logout: logoutMock,
    });

    render(<PendingApproval />);

    fireEvent.click(screen.getByText("Comprobar estado"));

    await waitFor(() => {
      expect(refreshSessionMock).toHaveBeenCalled();
      expect(toast.info).toHaveBeenCalledWith("Aún no tienes rol asignado", expect.any(Object));
    });
  });

  it("redirects to /dashboard and shows success toast when approved", async () => {
    refreshSessionMock.mockResolvedValue({
      id: "u1",
      email: "carlos.mora@icesi.edu.co",
      roles: ["KAM"],
      isPendingRole: false,
    });

    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "pending-role",
      user: {
        name: "Carlos Mora",
        email: "carlos.mora@icesi.edu.co",
      },
      refreshSession: refreshSessionMock,
      logout: logoutMock,
    });

    render(<PendingApproval />);

    fireEvent.click(screen.getByText("Comprobar estado"));

    await waitFor(() => {
      expect(refreshSessionMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("¡Acceso aprobado!", expect.any(Object));
      expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    });
  });
});
