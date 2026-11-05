import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./Dashboard";
import * as authContext from "@/context/AuthContext";

vi.mock("@/components/dashboard/AdminDashboard", () => ({
  AdminDashboard: () => <div data-testid="mock-admin-dashboard">Admin Dashboard Rendered</div>,
}));

vi.mock("@/components/dashboard/KamCommandCenter", () => ({
  KamCommandCenter: () => <div data-testid="mock-kam-command-center">KAM Command Center Rendered</div>,
}));

vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-app-shell">{children}</div>,
}));

describe("Dashboard Page Role Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithClient = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("renders AdminDashboard when the user has role 'administrador'", () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      user: {
        id: "admin-1",
        name: "Lina Ayala",
        email: "admin@icesi.edu.co",
        role: "administrador",
        roleLabel: "Administrador",
      },
      requests: [],
      updateRequest: vi.fn(),
    } as unknown as ReturnType<typeof authContext.useAuth>);

    renderWithClient();
    expect(screen.getByTestId("mock-admin-dashboard")).toBeInTheDocument();
  });

  it("renders KamCommandCenter when the user has role 'kam'", () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      user: {
        id: "kam-1",
        name: "Diana Martínez",
        email: "diana.martinez@icesi.edu.co",
        role: "kam",
        roleLabel: "KAM",
      },
      requests: [],
      updateRequest: vi.fn(),
    } as unknown as ReturnType<typeof authContext.useAuth>);

    renderWithClient();
    expect(screen.getByTestId("mock-kam-command-center")).toBeInTheDocument();
  });

  it("renders placeholder for roles that do not have a dedicated dashboard yet", () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      user: {
        id: "prof-1",
        name: "Ricardo Mejía",
        email: "ricardo@icesi.edu.co",
        role: "profesor",
        roleLabel: "Profesor",
      },
      requests: [],
      updateRequest: vi.fn(),
    } as unknown as ReturnType<typeof authContext.useAuth>);

    renderWithClient();
    expect(screen.getByText(/El panel para el rol/i)).toBeInTheDocument();
  });
});
