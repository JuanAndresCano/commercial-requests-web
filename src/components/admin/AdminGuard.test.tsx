import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminGuard } from "./AdminGuard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/lib/app-router";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/app-router", () => ({
  useRouter: vi.fn(),
}));

describe("AdminGuard", () => {
  const replaceMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      replace: replaceMock,
    });
  });

  it("renders loading message while verifying session", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "loading",
      user: null,
    });

    render(
      <AdminGuard>
        <div>Contenido Administrativo Protegido</div>
      </AdminGuard>,
    );

    expect(screen.getByText("Verificando credenciales administrativas…")).toBeInTheDocument();
  });

  it("redirects non-admin users to /dashboard", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "authenticated",
      user: { role: "kam" },
    });

    render(
      <AdminGuard>
        <div>Contenido Administrativo Protegido</div>
      </AdminGuard>,
    );

    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    expect(screen.queryByText("Contenido Administrativo Protegido")).not.toBeInTheDocument();
  });

  it("renders protected content for authenticated administrators", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "authenticated",
      user: { role: "administrador" },
    });

    render(
      <AdminGuard>
        <div>Contenido Administrativo Protegido</div>
      </AdminGuard>,
    );

    expect(screen.getByText("Contenido Administrativo Protegido")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
