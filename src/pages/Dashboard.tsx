import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { KamCommandCenter } from "@/components/dashboard/KamCommandCenter";
import { ProductLeaderDashboard } from "@/components/dashboard/ProductLeaderDashboard";

/**
 * Role-based dashboard entry point.
 *
 * Only KAM and Product Leader are in scope for the current release. Other
 * roles (node leader, professor) get an explicit placeholder: the previous
 * generic branch referenced undeclared variables and crashed at runtime
 * (see docs/07-gaps-conocidos-y-deuda-tecnica.md, item 4).
 */
export default function Dashboard() {
  const { user, requests, updateRequest, updateStatus } = useAuth();

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
        <ProductLeaderDashboard
          requests={requests}
          user={user}
          updateRequest={updateRequest}
          updateStatus={updateStatus}
        />
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
