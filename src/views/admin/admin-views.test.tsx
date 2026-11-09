import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestRouter } from "@/test/router";
import { ThemeProvider } from "@/context/ThemeContext";
import AdminDashboardView from "./AdminDashboardView";
import AdminKamsView from "./AdminKamsView";
import AdminNodosView from "./AdminNodosView";
import AdminEmpresasView from "./AdminEmpresasView";
import AdminSolicitudesView from "./AdminSolicitudesView";

const mockAuth = vi.hoisted(() => ({
  user: {
    name: "Admin Sistema",
    email: "admin@icesi.edu.co",
    role: "administrador",
    roleLabel: "Administrador Icesi",
  },
  status: "authenticated",
  logout: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuth.user,
    status: mockAuth.status,
    logout: mockAuth.logout,
  }),
}));

vi.mock("@/components/dashboard/AdminDashboard", () => ({
  AdminDashboard: () => <div data-testid="mock-admin-dashboard">Tablero Ejecutivo Macro</div>,
}));

vi.mock("@/components/dashboard/Company360View", () => ({
  Company360View: () => <div data-testid="mock-company-360">Inteligencia 360 Empresas</div>,
}));

function renderWithShell(ui: React.ReactElement, route: string) {
  return render(
    <ThemeProvider>
      <TestRouter route={route}>{ui}</TestRouter>
    </ThemeProvider>,
  );
}

describe("Admin Submodule Views (Phase 2 Routing & Shells)", () => {
  beforeEach(() => {
    mockAuth.logout.mockReset();
  });

  it("renders AdminDashboardView (Submódulo 1) with AppShell and executive dashboard", () => {
    renderWithShell(<AdminDashboardView />, "/admin/dashboard");
    expect(screen.getByTestId("admin-resumen-view")).toBeInTheDocument();
    expect(screen.getByTestId("mock-admin-dashboard")).toBeInTheDocument();
  });

  it("renders AdminKamsView (Submódulo 2) with KPIs and targets placeholder", () => {
    renderWithShell(<AdminKamsView />, "/admin/kams");
    expect(screen.getByTestId("admin-kams-view")).toBeInTheDocument();
    expect(screen.getByText("Rendimiento Comercial & Metas de Venta")).toBeInTheDocument();
    expect(screen.getByText("KAM Líder en Ventas")).toBeInTheDocument();
    expect(screen.getByText("Mayor Efectividad (Win Rate)")).toBeInTheDocument();
    expect(screen.getByText("Meta Global del Centro")).toBeInTheDocument();
  });

  it("renders AdminNodosView (Submódulo 3) with academic capacity overview", () => {
    renderWithShell(<AdminNodosView />, "/admin/nodos");
    expect(screen.getByTestId("admin-nodos-view")).toBeInTheDocument();
    expect(screen.getByText("Nodos Temáticos & Portafolio Académico")).toBeInTheDocument();
    expect(screen.getByText("Nodo con Mayor Recaudo")).toBeInTheDocument();
    expect(screen.getByText("Líder de Producto Destacado")).toBeInTheDocument();
    expect(screen.getByText("Tiempo Promedio de Diseño Técnico")).toBeInTheDocument();
  });

  it("renders AdminEmpresasView (Submódulo 4) with Company360 component", () => {
    renderWithShell(<AdminEmpresasView />, "/admin/empresas");
    expect(screen.getByTestId("admin-empresas-view")).toBeInTheDocument();
    expect(screen.getByText("Inteligencia 360° de Empresas Aliadas")).toBeInTheDocument();
    expect(screen.getByTestId("mock-company-360")).toBeInTheDocument();
  });

  it("renders AdminSolicitudesView (Submódulo 5) with search bar and audit shell", () => {
    renderWithShell(<AdminSolicitudesView />, "/admin/solicitudes");
    expect(screen.getByTestId("admin-solicitudes-view")).toBeInTheDocument();
    expect(screen.getByText("Gestión y Auditoría Global de Solicitudes")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por código/i)).toBeInTheDocument();
    expect(screen.getByText("Exportar Informe CSV")).toBeInTheDocument();
  });
});
