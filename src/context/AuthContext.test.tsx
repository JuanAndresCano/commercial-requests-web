import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "@/lib/api/client";
import { authApi, type SessionUser } from "@/lib/api/auth";
import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider, useTheme } from "./ThemeContext";

vi.mock("@/lib/api/auth", () => ({
  authApi: { login: vi.fn(), getMe: vi.fn(), logout: vi.fn() },
}));

const mocked = vi.mocked(authApi);

const session = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: "u1",
  email: "ana@icesi.edu.co",
  firstName: "Ana",
  lastName: "Pérez",
  roles: ["KAM"],
  expiresAt: Date.now() + 60_000,
  ...overrides,
});

type Auth = ReturnType<typeof useAuth> & { theme: ReturnType<typeof useTheme> };

function mountProvider() {
  const ref: { current: Auth | null } = { current: null };
  function Probe() {
    ref.current = { ...useAuth(), theme: useTheme() };
    return null;
  }
  render(
    <ThemeProvider>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </ThemeProvider>,
  );
  return ref as { current: Auth };
}

describe("AuthProvider session handling", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocked.logout.mockResolvedValue(undefined);
    window.localStorage.clear();
  });

  it("restores a live session from the cookie", async () => {
    mocked.getMe.mockResolvedValue(session());
    const auth = mountProvider();

    expect(auth.current.status).toBe("loading");
    await waitFor(() => expect(auth.current.status).toBe("authenticated"));
    expect(auth.current.user).toMatchObject({ role: "kam", name: "Ana Pérez", email: "ana@icesi.edu.co" });
  });

  it("accepts a single role without warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocked.getMe.mockResolvedValue(session({ roles: ["PRODUCT_LEADER"] }));
    const auth = mountProvider();

    await waitFor(() => expect(auth.current.status).toBe("authenticated"));
    expect(auth.current.user.role).toBe("lider-producto");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("warns with the user id and received roles when the session carries more than one", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocked.getMe.mockResolvedValue(session({ id: "u-42", roles: ["KAM", "PRODUCT_LEADER"] }));
    const auth = mountProvider();

    await waitFor(() => expect(auth.current.status).toBe("authenticated"));
    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain("u-42");
    expect(message).toContain("KAM, PRODUCT_LEADER");
    warn.mockRestore();
  });

  it("does not assume the session is valid when the backend says it is already expired", async () => {
    mocked.getMe.mockResolvedValue(session({ expiresAt: Date.now() - 1_000 }));
    const auth = mountProvider();

    await waitFor(() => expect(auth.current.status).toBe("unauthenticated"));
  });

  it("stays signed out when there is no cookie (401)", async () => {
    mocked.getMe.mockRejectedValue(new ApiError(401, "Unauthorized"));
    const auth = mountProvider();

    await waitFor(() => expect(auth.current.status).toBe("unauthenticated"));
  });

  it("rejects accounts without any role the UI supports", async () => {
    mocked.getMe.mockRejectedValueOnce(new ApiError(401, "no cookie"));
    const auth = mountProvider();
    await waitFor(() => expect(auth.current.status).toBe("unauthenticated"));

    mocked.login.mockResolvedValue({ accessToken: "t", expiresAt: Date.now() + 60_000 });
    mocked.getMe.mockResolvedValue(session({ roles: ["ASSISTANT"] }));
    await act(async () => {
      await expect(auth.current.login("a@icesi.edu.co", "x")).rejects.toThrow();
    });
    expect(auth.current.status).toBe("unauthenticated");
  });

  it("signs in and takes the role from the backend session", async () => {
    mocked.getMe.mockRejectedValueOnce(new ApiError(401, "no cookie"));
    const auth = mountProvider();
    await waitFor(() => expect(auth.current.status).toBe("unauthenticated"));

    mocked.login.mockResolvedValue({ accessToken: "t", expiresAt: Date.now() + 60_000 });
    mocked.getMe.mockResolvedValue(session());
    await act(async () => {
      await auth.current.login("ana@icesi.edu.co", "secret");
    });
    expect(auth.current.status).toBe("authenticated");
    expect(auth.current.user.role).toBe("kam");
  });

  it("logout clears local state and revokes the session on the backend", async () => {
    mocked.getMe.mockResolvedValue(session());
    const auth = mountProvider();
    await waitFor(() => expect(auth.current.status).toBe("authenticated"));

    act(() => auth.current.logout());

    expect(auth.current.status).toBe("unauthenticated");
    expect(mocked.logout).toHaveBeenCalledTimes(1);
  });

  it("signs out on its own when the token expiry is reached", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      mocked.getMe.mockResolvedValue(session({ expiresAt: Date.now() + 5_000 }));
      const auth = mountProvider();
      await waitFor(() => expect(auth.current.status).toBe("authenticated"));

      await act(async () => {
        vi.advanceTimersByTime(5_001);
      });
      expect(auth.current.status).toBe("unauthenticated");
    } finally {
      vi.useRealTimers();
    }
  });

  it("signs out when any authenticated request answers 401", async () => {
    mocked.getMe.mockResolvedValue(session());
    const auth = mountProvider();
    await waitFor(() => expect(auth.current.status).toBe("authenticated"));

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    try {
      await act(async () => {
        await expect(apiRequest("/requests")).rejects.toBeInstanceOf(ApiError);
      });
    } finally {
      vi.unstubAllGlobals();
    }
    expect(auth.current.status).toBe("unauthenticated");
  });

  it("starts every sign-in with clean boards and the light theme", async () => {
    mocked.getMe.mockRejectedValueOnce(new ApiError(401, "no cookie"));
    const auth = mountProvider();
    await waitFor(() => expect(auth.current.status).toBe("unauthenticated"));

    act(() => auth.current.theme.setTheme("dark"));
    window.localStorage.setItem("icesi_kam_dashboard_isolated_v1", JSON.stringify("entregada"));
    window.localStorage.setItem("icesi_kam_dashboard_view_v1", JSON.stringify("tabla"));

    mocked.login.mockResolvedValue({ accessToken: "t", expiresAt: Date.now() + 60_000 });
    mocked.getMe.mockResolvedValue(session());
    await act(async () => {
      await auth.current.login("ana@icesi.edu.co", "secret");
    });

    expect(auth.current.theme.theme).toBe("light");
    expect(window.localStorage.getItem("icesi_kam_dashboard_isolated_v1")).toBeNull();
    expect(window.localStorage.getItem("icesi_kam_dashboard_view_v1")).toBeNull();
  });

  it("logout forgets the board selections and returns to the light theme", async () => {
    mocked.getMe.mockResolvedValue(session());
    const auth = mountProvider();
    await waitFor(() => expect(auth.current.status).toBe("authenticated"));

    act(() => auth.current.theme.setTheme("dark"));
    window.localStorage.setItem("icesi_lp_dashboard_isolated_v1", JSON.stringify("nueva"));

    act(() => auth.current.logout());

    expect(auth.current.theme.theme).toBe("light");
    expect(window.localStorage.getItem("icesi_lp_dashboard_isolated_v1")).toBeNull();
  });

  it("keeps the board selections when the page reloads within the same session", async () => {
    window.localStorage.setItem("icesi_kam_dashboard_isolated_v1", JSON.stringify("entregada"));
    mocked.getMe.mockResolvedValue(session());
    const auth = mountProvider();
    await waitFor(() => expect(auth.current.status).toBe("authenticated"));

    expect(window.localStorage.getItem("icesi_kam_dashboard_isolated_v1")).toBe(JSON.stringify("entregada"));
  });
});
