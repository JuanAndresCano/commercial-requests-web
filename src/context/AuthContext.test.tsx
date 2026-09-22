import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "@/lib/api/client";
import { authApi, type SessionUser } from "@/lib/api/auth";
import { AuthProvider, useAuth, type UserRole } from "./AuthContext";

vi.mock("@/lib/api/auth", () => ({
  authApi: { login: vi.fn(), getMe: vi.fn(), logout: vi.fn() },
}));

const mocked = vi.mocked(authApi);

const session = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: "u1",
  email: "ana@icesi.edu.co",
  firstName: "Ana",
  lastName: "Pérez",
  roles: ["KAM", "PRODUCT_LEADER"],
  expiresAt: Date.now() + 60_000,
  ...overrides,
});

type Auth = ReturnType<typeof useAuth>;

function mountProvider() {
  const ref: { current: Auth | null } = { current: null };
  function Probe() {
    ref.current = useAuth();
    return null;
  }
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  return ref as { current: Auth };
}

describe("AuthProvider session handling", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocked.logout.mockResolvedValue(undefined);
  });

  it("restores a live session from the cookie", async () => {
    mocked.getMe.mockResolvedValue(session());
    const auth = mountProvider();

    expect(auth.current.status).toBe("loading");
    await waitFor(() => expect(auth.current.status).toBe("authenticated"));
    expect(auth.current.user).toMatchObject({ role: "kam", name: "Ana Pérez", email: "ana@icesi.edu.co" });
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
    mocked.getMe.mockResolvedValue(session({ roles: ["ADMIN"] }));
    await act(async () => {
      await expect(auth.current.login("a@icesi.edu.co", "x")).rejects.toThrow();
    });
    expect(auth.current.status).toBe("unauthenticated");
  });

  it("signs in and only allows switching to roles the account really has", async () => {
    mocked.getMe.mockRejectedValueOnce(new ApiError(401, "no cookie"));
    const auth = mountProvider();
    await waitFor(() => expect(auth.current.status).toBe("unauthenticated"));

    mocked.login.mockResolvedValue({ accessToken: "t", expiresAt: Date.now() + 60_000 });
    mocked.getMe.mockResolvedValue(session());
    await act(async () => {
      await auth.current.login("ana@icesi.edu.co", "secret");
    });
    expect(auth.current.status).toBe("authenticated");

    const forbidden: UserRole = "profesor";
    act(() => auth.current.switchRole(forbidden));
    expect(auth.current.user.role).toBe("kam");

    act(() => auth.current.switchRole("lider-producto"));
    expect(auth.current.user.role).toBe("lider-producto");
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
});
