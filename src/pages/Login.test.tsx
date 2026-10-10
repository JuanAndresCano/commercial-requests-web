import { fireEvent, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import Login from "./Login";

const loginMock = vi.hoisted(() => vi.fn());
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ login: loginMock, user: null }),
}));

const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

vi.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));

function submitCredentials() {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
  fireEvent.change(document.getElementById("usuario") as HTMLElement, { target: { value: "kam@icesi.edu.co" } });
  fireEvent.change(document.getElementById("contrasena") as HTMLElement, { target: { value: "una-clave" } });
  fireEvent.submit((document.getElementById("usuario") as HTMLElement).closest("form") as HTMLFormElement);
}

describe("Login: what the user is told when the sign-in fails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("says the credentials are wrong on a 401", async () => {
    loginMock.mockRejectedValue(new ApiError(401, "Unauthorized"));
    submitCredentials();
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Correo o contraseña incorrectos.", expect.anything()),
    );
  });

  it("asks to wait, in Spanish, when the backend blocks after too many failed attempts (429)", async () => {
    loginMock.mockRejectedValue(new ApiError(429, "Too many failed login attempts. Try again in 15 minutes."));
    submitCredentials();
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Demasiados intentos fallidos.", expect.anything()),
    );
    expect(toastMock.error).not.toHaveBeenCalledWith("Correo o contraseña incorrectos.", expect.anything());
  });
});
