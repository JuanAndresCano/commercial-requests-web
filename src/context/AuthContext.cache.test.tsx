import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authApi, type SessionUser } from "@/lib/api/auth";
import { requestsApi, type ProposalDashboardMetrics, type ProposalListItem } from "@/lib/api/requests";
import { KamCommandCenter } from "@/components/dashboard/KamCommandCenter";
import { TestRouter } from "@/test/router";
import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";

vi.mock("@/lib/api/auth", () => ({ authApi: { login: vi.fn(), devLogin: vi.fn(), getMe: vi.fn(), logout: vi.fn() } }));
vi.mock("@/lib/api/requests", () => ({ requestsApi: { list: vi.fn(), getDashboardMetrics: vi.fn() } }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

function session(id: string): SessionUser {
  return {
    id,
    email: `${id}@icesi.edu.co`,
    firstName: id,
    lastName: "KAM",
    roles: ["KAM"],
    expiresAt: Date.now() + 60000,
  };
}

function metrics(value: string): ProposalDashboardMetrics {
  return {
    total: 1,
    nuevas: 0,
    listas: 0,
    entregadas: 1,
    deliveredValueCop: value,
    urgentes: 0,
    proximas: 0,
    sinDocente: 0,
    borradoresPendientes: 0,
    enviadasSemana: 0,
    inProgress: 0,
    rejected: 0,
  };
}

function proposal(owner: string): ProposalListItem {
  return {
    id: owner,
    code: null,
    companyId: owner,
    contactId: null,
    nodeId: null,
    title: `Propuesta privada de ${owner}`,
    generalDescription: null,
    creatorId: owner,
    productLeaderId: null,
    priority: null,
    comments: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    company: {
      id: owner,
      name: owner,
      nit: null,
      description: null,
      website: null,
      area: null,
      type: null,
      sector: null,
    },
    workflow: {
      id: owner,
      proposalId: owner,
      currentStatusId: "NEW",
      requestDate: null,
      proposalCreationDate: null,
      clientSentDate: null,
      clientApprovalDate: null,
      closingDate: null,
      deadline: null,
      currentStatusSince: null,
      currentStatus: { id: "NEW", code: "NEW", name: "New" },
    },
    program: null,
  };
}

function AccountBoard() {
  const auth = useAuth();
  return (
    <>
      <output>{auth.status === "authenticated" ? auth.user.email : "Sin sesión"}</output>
      <button onClick={auth.logout}>Cerrar sesión de prueba</button>
      <button onClick={() => void auth.login("B@icesi.edu.co", "password")}>Entrar como B</button>
      {auth.status === "authenticated" && <KamCommandCenter userName={auth.user.name} />}
    </>
  );
}

describe("private query data across KAM sessions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.clear();
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: "B-token", expiresAt: Date.now() + 60000 });
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    vi.mocked(authApi.getMe).mockResolvedValueOnce(session("A")).mockResolvedValue(session("B"));
  });

  it.each([true, false])(
    "never shows A's cached money or proposals to B, even when A's old responses finish late (logout=%s)",
    async (logoutFirst) => {
      const oldMetrics = deferred<ProposalDashboardMetrics>();
      const oldRequests = deferred<ProposalListItem[]>();
      const nextMetrics = deferred<ProposalDashboardMetrics>();
      const nextRequests = deferred<ProposalListItem[]>();
      vi.mocked(requestsApi.getDashboardMetrics)
        .mockResolvedValueOnce(metrics("10000000.00"))
        .mockReturnValueOnce(oldMetrics.promise)
        .mockReturnValue(nextMetrics.promise);
      vi.mocked(requestsApi.list)
        .mockResolvedValueOnce([proposal("A")])
        .mockReturnValueOnce(oldRequests.promise)
        .mockReturnValue(nextRequests.promise);
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={client}>
          <TestRouter>
            <ThemeProvider>
              <AuthProvider>
                <AccountBoard />
              </AuthProvider>
            </ThemeProvider>
          </TestRouter>
        </QueryClientProvider>,
      );
      expect(await screen.findByText("$ 10.000.000 COP total entregado")).toBeInTheDocument();
      expect(await screen.findByText("Propuesta privada de A")).toBeInTheDocument();
      act(() => {
        void client.invalidateQueries({ queryKey: ["dashboard-metrics"] });
        void client.invalidateQueries({ queryKey: ["requests"] });
      });
      await waitFor(() => expect(requestsApi.getDashboardMetrics).toHaveBeenCalledTimes(2));

      if (logoutFirst) fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión de prueba" }));
      fireEvent.click(screen.getByRole("button", { name: "Entrar como B" }));
      await screen.findByText("B@icesi.edu.co");
      expect(screen.queryByText("$ 10.000.000 COP total entregado")).not.toBeInTheDocument();
      expect(screen.queryByText("Propuesta privada de A")).not.toBeInTheDocument();
      await act(async () => {
        oldMetrics.resolve(metrics("99000000.00"));
        oldRequests.resolve([proposal("A-respuesta-tardía")]);
      });
      expect(screen.queryByText("$ 99.000.000 COP total entregado")).not.toBeInTheDocument();
      expect(screen.queryByText("Propuesta privada de A-respuesta-tardía")).not.toBeInTheDocument();
      await act(async () => {
        nextMetrics.resolve(metrics("2000000.00"));
        nextRequests.resolve([proposal("B")]);
      });
      expect(await screen.findByText("$ 2.000.000 COP total entregado")).toBeInTheDocument();
      expect(await screen.findByText("Propuesta privada de B")).toBeInTheDocument();
      client.clear();
    },
  );
});
