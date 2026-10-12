import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestRouter } from "@/test/router";
import { RequireAuth } from "./RequireAuth";

const useAuthMock = vi.fn();
vi.mock("@/context/AuthContext", () => ({ useAuth: () => useAuthMock() }));

function renderAt(route: string) {
  return render(
    <TestRouter
      route={route}
      routes={{
        "/dashboard": (
          <RequireAuth>
            <div>Contenido privado</div>
          </RequireAuth>
        ),
        "/login": <div>Pantalla de login</div>,
      }}
    />,
  );
}

describe("RequireAuth", () => {
  beforeEach(() => useAuthMock.mockReset());

  it("shows the checking-session message while the session is being restored", () => {
    useAuthMock.mockReturnValue({ status: "loading" });
    renderAt("/dashboard");
    expect(screen.getByText("Verificando sesión…")).toBeInTheDocument();
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });

  it("sends signed-out visitors to /login and renders nothing meanwhile", async () => {
    useAuthMock.mockReturnValue({ status: "unauthenticated" });
    renderAt("/dashboard");
    expect(await screen.findByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });

  it("renders the private content for an authenticated session", () => {
    useAuthMock.mockReturnValue({ status: "authenticated" });
    renderAt("/dashboard");
    expect(screen.getByText("Contenido privado")).toBeInTheDocument();
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
  });
});
