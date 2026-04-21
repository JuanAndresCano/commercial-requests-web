import { Link } from "react-router-dom";
import { PlusCircle, ListChecks, ArrowRight, TrendingUp, Clock, CheckCircle2, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MOCK_REQUESTS } from "@/lib/mock-data";

export default function Dashboard() {
  const total = MOCK_REQUESTS.length;
  const nuevas = MOCK_REQUESTS.filter((r) => r.status === "nueva").length;
  const listas = MOCK_REQUESTS.filter((r) => r.status === "lista").length;
  const entregadas = MOCK_REQUESTS.filter((r) => r.status === "entregada").length;

  const stats = [
    { label: "Total solicitudes", value: total, icon: FileText },
    { label: "Nuevas", value: nuevas, icon: TrendingUp },
    { label: "Listas para entregar", value: listas, icon: Clock },
    { label: "Entregadas", value: entregadas, icon: CheckCircle2 },
  ];

  return (
    <AppShell>
      <div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Inicio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona solicitudes de capacitación, consultoría y mentoría.
          </p>
        </div>

        {/* Primary actions */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            to="/solicitudes/nueva"
            className="flex items-start gap-4 rounded-md border border-border bg-card p-5 transition-colors hover:border-accent/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
              <PlusCircle className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-foreground">Ingresar solicitud</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registra una nueva solicitud comercial paso a paso.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Comenzar <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>

          <Link
            to="/solicitudes"
            className="flex items-start gap-4 rounded-md border border-border bg-card p-5 transition-colors hover:border-accent/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
              <ListChecks className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-foreground">Ver solicitudes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tablero con todas las solicitudes por estado.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Ver tablero <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">Resumen</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{s.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">Actividad reciente</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/solicitudes">Ver todas <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/50 text-left text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">ID</th>
                  <th className="px-4 py-2.5 font-medium">Solicitud</th>
                  <th className="px-4 py-2.5 font-medium hidden md:table-cell">Tipo</th>
                  <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Empresa</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_REQUESTS.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.id}</td>
                    <td className="px-4 py-2.5">
                      <Link to={`/solicitudes/${r.id}`} className="font-medium text-foreground hover:text-accent">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 hidden text-muted-foreground md:table-cell">{r.type}</td>
                    <td className="px-4 py-2.5 hidden text-muted-foreground lg:table-cell">{r.company}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded border border-border bg-secondary px-2 py-0.5 text-xs font-medium capitalize">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
