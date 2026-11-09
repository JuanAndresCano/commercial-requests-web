import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserManagementView from "./UserManagementView";
import { usersApi } from "@/lib/api/users";
import { toast } from "sonner";

vi.mock("@/lib/api/users", () => ({
  usersApi: {
    getPendingUsers: vi.fn(),
    getUserDirectory: vi.fn(),
    approveUser: vi.fn(),
    rejectUser: vi.fn(),
    preRegisterUser: vi.fn(),
  },
}));

vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-app-shell">{children}</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("UserManagementView (Admin)", () => {
  const mockPending = [
    {
      id: "p1",
      email: "nuevo.colaborador@icesi.edu.co",
      firstName: "Carlos",
      lastName: "Mora",
      azureOid: "oid-1",
      createdAt: "2026-11-09T10:00:00.000Z",
    },
  ];

  const mockDirectory = [
    {
      id: "u1",
      email: "diana.martinez@icesi.edu.co",
      firstName: "Diana",
      lastName: "Martínez",
      azureOid: "oid-kam",
      roles: ["KAM"],
      createdAt: "2026-10-01T10:00:00.000Z",
    },
    {
      id: "u2",
      email: "ldp@icesi.edu.co",
      firstName: "Laura",
      lastName: "Díaz",
      azureOid: "oid-lp",
      roles: ["PRODUCT_LEADER"],
      createdAt: "2026-10-02T10:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (usersApi.getPendingUsers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockPending);
    (usersApi.getUserDirectory as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockDirectory);
  });

  it("renders metrics, pending queue and directory data", async () => {
    render(<UserManagementView />);

    expect(await screen.findByText("Gestión de Accesos y Usuarios")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Solicitudes Pendientes/i })).toBeInTheDocument();
    expect(screen.getByText("nuevo.colaborador@icesi.edu.co")).toBeInTheDocument();
    expect(screen.getByText("Carlos Mora")).toBeInTheDocument();
  });

  it("allows approving a pending user with designated role", async () => {
    (usersApi.approveUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      message: "Aprobado",
    });

    render(<UserManagementView />);

    const approveBtn = await screen.findByRole("button", { name: /Aprobar/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(usersApi.approveUser).toHaveBeenCalledWith("p1", "KAM");
      expect(toast.success).toHaveBeenCalledWith("Usuario aprobado exitosamente", expect.any(Object));
    });
  });

  it("opens reject modal and confirms rejection", async () => {
    (usersApi.rejectUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      message: "Rechazado",
    });

    render(<UserManagementView />);

    const rejectBtn = await screen.findByRole("button", { name: /Rechazar/i });
    fireEvent.click(rejectBtn);

    expect(screen.getByText(/¿Estás seguro de que deseas rechazar la solicitud/i)).toBeInTheDocument();

    const confirmRejectBtn = screen.getByRole("button", { name: /Sí, rechazar acceso/i });
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(usersApi.rejectUser).toHaveBeenCalledWith("p1");
      expect(toast.success).toHaveBeenCalledWith("Solicitud rechazada", expect.any(Object));
    });
  });

  it("opens pre-register modal and creates pre-registered user", async () => {
    (usersApi.preRegisterUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "PRE_REGISTERED",
      roles: ["PRODUCT_LEADER"],
    });

    render(<UserManagementView />);

    const preRegBtn = await screen.findByRole("button", { name: /Pre-registrar Colaborador/i });
    fireEvent.click(preRegBtn);

    const emailInput = screen.getByPlaceholderText("ejemplo@icesi.edu.co");
    fireEvent.change(emailInput, { target: { value: "nuevo.docente@icesi.edu.co" } });

    // Select Líder de Producto
    const ldpCard = screen.getByTestId("role-option-ldp");
    fireEvent.click(ldpCard);

    const submitBtn = screen.getByRole("button", { name: /Pre-registrar y Autorizar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(usersApi.preRegisterUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "nuevo.docente@icesi.edu.co",
          roleCode: "PRODUCT_LEADER",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Colaborador pre-registrado exitosamente", expect.any(Object));
    });
  });

  it("switches to directory tab and filters users by search query", async () => {
    render(<UserManagementView />);

    const directoryTab = await screen.findByRole("tab", { name: /Directorio de Colaboradores/i });
    fireEvent.click(directoryTab);

    expect(screen.getByText("diana.martinez@icesi.edu.co")).toBeInTheDocument();
    expect(screen.getByText("ldp@icesi.edu.co")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText("Buscar por nombre, correo o rol…");
    fireEvent.change(searchInput, { target: { value: "Diana" } });

    expect(screen.getByText("diana.martinez@icesi.edu.co")).toBeInTheDocument();
    expect(screen.queryByText("ldp@icesi.edu.co")).not.toBeInTheDocument();
  });
});
