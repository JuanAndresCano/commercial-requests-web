import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestRouter } from "@/test/router";
import { AdminGuard } from "./AdminGuard";
import type { UserRole } from "@/context/AuthContext";

const authMock = vi.hoisted(() => ({
  status: "authenticated",
  user: {
    name: "Admin User",
    email: "admin@icesi.edu.co",
    role: "administrador" as UserRole,
    roleLabel: "Administrador Icesi",
  },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    status: authMock.status,
    user: authMock.user,
  }),
}));

function renderAt(route: string) {
  return render(
    <TestRouter
      route={route}
      routes={{
        "/admin/dashboard": (
          <AdminGuard>
            <div data-testid="admin-content">Contenido de Administración</div>
          </AdminGuard>
        ),
        "/dashboard": <div data-testid="kam-dashboard">Tablero General</div>,
      }}
    />,
  );
}

describe("AdminGuard (RBAC Protection)", () => {
  beforeEach(() => {
    authMock.status = "authenticated";
    authMock.user = {
      name: "Admin User",
      email: "admin@icesi.edu.co",
      role: "administrador",
      roleLabel: "Administrador Icesi",
    };
  });

  it("shows checking credentials indicator while session is loading", () => {
    authMock.status = "loading";
    renderAt("/admin/dashboard");
    expect(screen.getByText("Verificando credenciales administrativas…")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });

  it("allows access and renders children when role is 'administrador'", () => {
    authMock.status = "authenticated";
    authMock.user.role = "administrador";
    renderAt("/admin/dashboard");
    expect(screen.getByTestId("admin-content")).toBeInTheDocument();
    expect(screen.queryByTestId("kam-dashboard")).not.toBeInTheDocument();
  });

  it("redirects KAM to /dashboard and does not show admin content", async () => {
    authMock.status = "authenticated";
    authMock.user.role = "kam";
    renderAt("/admin/dashboard");
    expect(await screen.findByTestId("kam-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });

  it("redirects Product Leader to /dashboard and does not show admin content", async () => {
    authMock.status = "authenticated";
    authMock.user.role = "lider-producto";
    renderAt("/admin/dashboard");
    expect(await screen.findByTestId("kam-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });

  it("redirects Professor to /dashboard and does not show admin content", async () => {
    authMock.status = "authenticated";
    authMock.user.role = "profesor" as unknown as UserRole;
    renderAt("/admin/dashboard");
    expect(await screen.findByTestId("kam-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });

  it("renders null for unauthenticated status", () => {
    authMock.status = "unauthenticated";
    renderAt("/admin/dashboard");
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });
});
