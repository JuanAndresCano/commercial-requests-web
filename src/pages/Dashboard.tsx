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
    { label: "Total solicitudes", value: total, icon: FileText, tone: "bg-secondary text-foreground" },
    { label: "Nuevas", value: nuevas, icon: TrendingUp, tone: "bg-accent/10 text-accent" },
    { label: "Listas para entregar", value: listas, icon: Clock, tone: "bg-info/10 text-info" },
    { label: "Entregadas", value: entregadas, icon: CheckCircle2, tone: "bg-success/10 text-success" },
  ];

  return (
    <AppShell>
      <div className="animate-fade-in">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Centro de control</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Solicitudes Comerciales</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Gestiona el ciclo completo de solicitudes de capacitación, consultoría y mentoría desde un solo lugar.
          </p>
        </div>

        {/* Primary actions */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Link
            to="/solicitudes/nueva"
            className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-navy p-8 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-glow"
          >
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-brand opacity-30 blur-3xl transition-opacity group-hover:opacity-50" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                <PlusCircle className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold">Ingresar solicitud</h2>
              <p className="mt-2 text-sm text-white/70">
                Registra una nueva solicitud comercial paso a paso. El sistema calculará la fecha límite y notificará al LDP.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                Comenzar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          <Link
            to="/solicitudes"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
          >
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-brand opacity-10 blur-3xl transition-opacity group-hover:opacity-25" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <ListChecks className="h-6 w-6 text-accent" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold">Ver solicitudes</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tablero kanban con todas las solicitudes por estado. Filtra, busca y haz seguimiento.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                Ver tablero <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-10">
          <h2 className="font-display text-lg font-bold">Resumen</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-xs">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Actividad reciente</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/solicitudes">Ver todas <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Solicitud</th>
                  <th className="px-5 py-3 hidden md:table-cell">Tipo</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Empresa</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_REQUESTS.slice(0, 5).map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                    <td className="px-5 py-3">
                      <Link to={`/solicitudes/${r.id}`} className="font-semibold text-foreground hover:text-accent">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 hidden text-muted-foreground md:table-cell">{r.type}</td>
                    <td className="px-5 py-3 hidden text-muted-foreground lg:table-cell">{r.company}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold capitalize">
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
