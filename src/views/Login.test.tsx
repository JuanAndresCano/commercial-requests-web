import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TestRouter } from "@/test/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import Login from "./Login";

const devLoginMock = vi.hoisted(() => vi.fn());
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ devLogin: devLoginMock, status: "unauthenticated", user: null }),
}));

const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

vi.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));

describe("Login view: Microsoft SSO and Dev Impersonation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the institutional Microsoft SSO button", () => {
    render(
      <TestRouter>
        <Login />
      </TestRouter>,
    );

    expect(screen.getByText("Iniciar sesión con cuenta Icesi")).toBeInTheDocument();
  });

  it("renders strictly the 3 essential dev profiles (KAM, LDP, Admin)", () => {
    render(
      <TestRouter>
        <Login />
      </TestRouter>,
    );

    expect(screen.getByText("Diana Martínez")).toBeInTheDocument();
    expect(screen.getByText("Laura Díaz")).toBeInTheDocument();
    expect(screen.getAllByText("Administrador").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Carlos Riveros")).not.toBeInTheDocument();
  });

  it("allows 1-click dev-login with seeded accounts in development mode", async () => {
    devLoginMock.mockResolvedValue(undefined);

    render(
      <TestRouter>
        <Login />
      </TestRouter>,
    );

    const dianaButton = screen.getByText("Diana Martínez");
    fireEvent.click(dianaButton);

    await waitFor(() => {
      expect(devLoginMock).toHaveBeenCalledWith("diana.martinez@icesi.edu.co");
    });
  });

  it("shows an error toast when dev login fails", async () => {
    devLoginMock.mockRejectedValue(new ApiError(401, "User not found"));

    render(
      <TestRouter>
        <Login />
      </TestRouter>,
    );

    const dianaButton = screen.getByText("Diana Martínez");
    fireEvent.click(dianaButton);

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("Usuario de prueba no encontrado en la base de datos.");
    });
  });
});
