import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { KamCommandCenter } from "@/components/dashboard/KamCommandCenter";
import { ProductLeaderDashboard } from "@/components/dashboard/ProductLeaderDashboard";
import { useProductLeaderQueue, useUpdateProposalStatus } from "@/hooks/use-requests";
import type { BackendStatusCode } from "@/lib/api/requests";
import type { RequestStatus } from "@/lib/mock-data";
import { toast } from "sonner";

// Only the two transitions the Kanban triggers from here (docs/03, B.3): "Pasar a
// Experto" and "Pasar a Costeo". Both go through the same backend endpoint as every
// other status change (HU 4.3).
const KANBAN_TARGET_STATUS: Partial<Record<RequestStatus, BackendStatusCode>> = {
  "en-experto": "IN_PROGRESS",
  "en-costeo": "IN_COSTING",
};

/**
 * Role-based dashboard entry point.
 *
 * Only KAM and Product Leader are in scope for the current release. Other
 * roles (node leader, professor) get an explicit placeholder: the previous
 * generic branch referenced undeclared variables and crashed at runtime
 * (see docs/07-gaps-conocidos-y-deuda-tecnica.md, item 4).
 *
 * The Product Leader branch reads real data from commercial-requests-backend
 * (HU 4.1/4.3, Persona 3) instead of the shared mock/localStorage state — the KAM
 * branch stays on mocks until HU 3.x connects it.
 */
export default function Dashboard() {
  const { user, requests, updateRequest } = useAuth();

  if (user.role === "kam") {
    return (
      <AppShell>
        <KamCommandCenter requests={requests} userName={user.name} />
      </AppShell>
    );
  }

  if (user.role === "lider-producto") {
    return (
      <AppShell>
        <ProductLeaderDashboardConnected user={user} updateRequest={updateRequest} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">Hola, {user.name}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          El panel para el rol <strong>{user.roleLabel}</strong> todavía no está disponible. Por ahora, la plataforma
          está habilitada para KAM y Líder de Producto.
        </p>
      </section>
    </AppShell>
  );
}

interface ProductLeaderDashboardConnectedProps {
  user: { name: string; email: string; roleLabel: string };
  // Still the mock context's updateRequest — ProductLeaderDashboard requires it in its
  // props but never actually calls it (only `updateStatus` has a call site); kept as a
  // harmless pass-through instead of changing that component's public interface.
  updateRequest: (id: string, updates: Partial<import("@/lib/mock-data").RequestItem>) => void;
}

function ProductLeaderDashboardConnected({ user, updateRequest }: ProductLeaderDashboardConnectedProps) {
  const { data: requests, isLoading, isError, refetch } = useProductLeaderQueue();
  const updateProposalStatus = useUpdateProposalStatus();

  if (isLoading) {
    return (
      <section className="mx-auto max-w-xl py-16 text-center text-sm text-muted-foreground">
        Cargando tus propuestas...
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mx-auto max-w-xl py-16 text-center">
        <p className="text-sm text-destructive">No se pudo cargar el tablero.</p>
        <button
          type="button"
          className="mt-3 text-xs font-semibold text-primary hover:underline"
          onClick={() => void refetch()}
        >
          Reintentar
        </button>
      </section>
    );
  }

  const handleUpdateStatus = (id: string, status: RequestStatus, onSuccess?: () => void) => {
    const backendStatus = KANBAN_TARGET_STATUS[status];
    if (!backendStatus) return; // only "en-experto"/"en-costeo" are triggered from here
    updateProposalStatus.mutate(
      { id, status: backendStatus },
      {
        onSuccess,
        onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo avanzar la propuesta"),
      },
    );
  };

  return (
    <ProductLeaderDashboard
      requests={requests ?? []}
      user={user}
      updateRequest={updateRequest}
      updateStatus={handleUpdateStatus}
    />
  );
}
