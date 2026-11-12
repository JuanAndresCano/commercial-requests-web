import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./page";
import LoginPage from "./login/page";
import NotFoundPage from "./not-found";
import DashboardPage from "./(private)/dashboard/page";
import NewRequestPage from "./(private)/solicitudes/nueva/page";
import RequestDetailPage from "./(private)/solicitudes/[id]/page";
import PendingApprovalPage from "./onboarding/pending/page";
import UserManagementPage from "./(private)/admin/usuarios/page";
import PrivateLayout from "./(private)/layout";
import AdminAppLayout from "./(private)/admin/layout";
import AdminDashboardPage from "./(private)/admin/dashboard/page";
import AdminResumenPage from "./(private)/admin/resumen/page";
import AdminKamsPage from "./(private)/admin/kams/page";
import AdminNodosPage from "./(private)/admin/nodos/page";
import AdminEmpresasPage from "./(private)/admin/empresas/page";
import AdminSolicitudesPage from "./(private)/admin/solicitudes/page";

vi.mock("@/views/Index", () => ({ default: () => <div>vista-index</div> }));
vi.mock("@/views/Login", () => ({ default: () => <div>vista-login</div> }));
vi.mock("@/views/NotFound", () => ({ default: () => <div>vista-404</div> }));
vi.mock("@/views/Dashboard", () => ({ default: () => <div>vista-dashboard</div> }));
vi.mock("@/views/NewRequest", () => ({ default: () => <div>vista-nueva</div> }));
vi.mock("@/views/RequestDetail", () => ({ default: () => <div>vista-detalle</div> }));
vi.mock("@/views/PendingApproval", () => ({ default: () => <div>vista-pending</div> }));
vi.mock("@/views/admin/UserManagementView", () => ({ default: () => <div>vista-usuarios</div> }));

vi.mock("@/views/admin/AdminDashboardView", () => ({ default: () => <div>vista-admin-dashboard</div> }));
vi.mock("@/views/admin/AdminKamsView", () => ({ default: () => <div>vista-admin-kams</div> }));
vi.mock("@/views/admin/AdminNodosView", () => ({ default: () => <div>vista-admin-nodos</div> }));
vi.mock("@/views/admin/AdminEmpresasView", () => ({ default: () => <div>vista-admin-empresas</div> }));
vi.mock("@/views/admin/AdminSolicitudesView", () => ({ default: () => <div>vista-admin-solicitudes</div> }));

vi.mock("@/components/RequireAuth", () => ({
  RequireAuth: ({ children }: { children: ReactElement }) => <div data-testid="guard">{children}</div>,
}));

vi.mock("@/components/admin/AdminGuard", () => ({
  AdminGuard: ({ children }: { children: ReactElement }) => <div data-testid="admin-guard">{children}</div>,
}));

// Each route file must load its own view (client-side only) and nothing else.
describe("app routes", () => {
  it.each([
    ["/", HomePage, "vista-index"],
    ["/login", LoginPage, "vista-login"],
    ["not-found", NotFoundPage, "vista-404"],
    ["/dashboard", DashboardPage, "vista-dashboard"],
    ["/solicitudes/nueva", NewRequestPage, "vista-nueva"],
    ["/solicitudes/[id]", RequestDetailPage, "vista-detalle"],
    ["/onboarding/pending", PendingApprovalPage, "vista-pending"],
    ["/admin/usuarios", UserManagementPage, "vista-usuarios"],
    ["/admin/dashboard", AdminDashboardPage, "vista-admin-dashboard"],
    ["/admin/resumen", AdminResumenPage, "vista-admin-dashboard"],
    ["/admin/kams", AdminKamsPage, "vista-admin-kams"],
    ["/admin/nodos", AdminNodosPage, "vista-admin-nodos"],
    ["/admin/empresas", AdminEmpresasPage, "vista-admin-empresas"],
    ["/admin/solicitudes", AdminSolicitudesPage, "vista-admin-solicitudes"],
  ])("%s renders its view", async (_route, Page, marker) => {
    render(<Page />);
    expect(await screen.findByText(marker)).toBeInTheDocument();
  });

  it("the (private) layout puts its children behind the auth guard", () => {
    render(
      <PrivateLayout>
        <span>privado</span>
      </PrivateLayout>,
    );
    expect(screen.getByTestId("guard")).toContainElement(screen.getByText("privado"));
  });

  it("the (private)/admin layout puts its children behind the admin guard", () => {
    render(
      <AdminAppLayout>
        <span>admin-privado</span>
      </AdminAppLayout>,
    );
    expect(screen.getByTestId("admin-guard")).toContainElement(screen.getByText("admin-privado"));
  });
});
