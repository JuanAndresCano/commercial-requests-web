import { Link } from "react-router-dom";
import {
  PlusCircle,
  ListChecks,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  UserCheck,
  Layers,
  GraduationCap,
  Network,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { KamCommandCenter } from "@/components/dashboard/KamCommandCenter";

export default function Dashboard() {
  const { user, requests } = useAuth();
  const role = user.role;

  // Custom high-impact commercial command center for KAM
  if (role === "kam") {
    return (
      <AppShell>
        <KamCommandCenter requests={requests} userName={user.name} />
      </AppShell>
    );
  }

  // Requests assigned to this product leader or relevant to the role
  const myRequests = requests.filter((r) => {
    if (role === "lider-producto") {
      return r.productLeader === user.name || !r.professor;
    }
    if (role === "kam") {
      return r.kam === user.name;
    }
    if (role === "profesor") {
      return r.professor === user.name;
    }
    return true;
  });

  // Calculate role-specific stats
  const total = requests.length;
  const nuevas = requests.filter((r) => r.status === "nueva").length;
  const listas = requests.filter((r) => r.status === "lista").length;
  const entregadas = requests.filter((r) => r.status === "entregada").length;

  const sinProfesor = requests.filter((r) => !r.professor && r.status !== "entregada").length;
  const enPropuesta = requests.filter((r) => r.status === "nueva" || r.status === "borrador").length;
  const misAsignadas = requests.filter((r) => r.productLeader === user.name).length;

  const stats = (() => {
    if (role === "lider-producto") {
      return [
        { label: "Mis solicitudes asignadas", value: misAsignadas || myRequests.length, icon: Layers },
        { label: "Pendientes de docente", value: sinProfesor, icon: AlertCircle },
        { label: "En formulación de propuesta", value: enPropuesta, icon: TrendingUp },
        { label: "Listas para entregar a KAM", value: listas, icon: CheckCircle2 },
      ];
    }
    if (role === "profesor") {
      return [
        { label: "Propuestas a diseñar", value: requests.filter((r) => r.professor === user.name).length, icon: GraduationCap },
        { label: "En desarrollo", value: requests.filter((r) => r.status === "nueva").length, icon: Clock },
        { label: "Propuestas finalizadas", value: requests.filter((r) => r.status === "lista" || r.status === "entregada").length, icon: CheckCircle2 },
      ];
    }
    if (role === "lider-nodo") {
      return [
        { label: "Total solicitudes en nodos", value: total, icon: Network },
        { label: "Nuevas", value: nuevas, icon: TrendingUp },
        { label: "En propuesta", value: enPropuesta, icon: Clock },
        { label: "Entregadas", value: entregadas, icon: CheckCircle2 },
      ];
    }
    // Default KAM
    return [
      { label: "Total solicitudes", value: total, icon: FileText },
      { label: "Nuevas", value: nuevas, icon: TrendingUp },
      { label: "Listas para entregar", value: listas, icon: Clock },
      { label: "Entregadas", value: entregadas, icon: CheckCircle2 },
    ];
  })();

  return (
    <AppShell>
      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {role === "lider-producto" && "Inicio · Líder de Producto"}
              {role === "kam" && "Inicio · KAM"}
              {role === "lider-nodo" && "Inicio · Líder de Nodo"}
              {role === "profesor" && "Inicio · Docente / Profesor"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {role === "lider-producto" && "Construye propuestas técnicas, asigna profesores docentes y coordina los programas comerciales."}
              {role === "kam" && "Gestiona cuentas corporativas y crea nuevas solicitudes comerciales."}
              {role === "lider-nodo" && "Supervisa y coordina las solicitudes entre los nodos académicos de la universidad."}
              {role === "profesor" && "Diseña contenidos curriculares, cronogramas y propuestas pedagógicas."}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground">
            <span className="h-2 w-2 rounded-full bg-accent" />
            {user.roleLabel} · {user.name}
          </span>
        </div>

        {/* Primary actions tailored by role */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {role === "lider-producto" ? (
            <>
              <Link
                to="/solicitudes?filter=sin-profesor"
                className="flex items-start gap-4 rounded-md border border-border bg-card p-5 transition-colors hover:border-accent/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-foreground">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-bold text-foreground">Asignar profesores</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Asigna docentes calificados a solicitudes pendientes de propuesta.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Ver pendientes ({sinProfesor}) <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>

              <Link
                to="/solicitudes?filter=propuestas"
                className="flex items-start gap-4 rounded-md border border-border bg-card p-5 transition-colors hover:border-accent/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-foreground">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-bold text-foreground">Construir propuestas</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Elabora alcance, objetivos y costeo de programas.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Ver en trámite <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>

              <Link
                to="/solicitudes"
                className="flex items-start gap-4 rounded-md border border-border bg-card p-5 transition-colors hover:border-accent/50 md:col-span-2 lg:col-span-1"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-foreground">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-bold text-foreground">Tablero de solicitudes</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Monitorea todas las solicitudes asignadas por estado.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Abrir tablero <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Resumen · {user.roleLabel}
          </h2>
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
            <div>
              <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {role === "lider-producto" ? "Solicitudes para gestión de propuesta" : "Actividad reciente"}
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/solicitudes">Ver todas <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="mt-3 overflow-x-auto pr-6 rounded-md border border-border bg-card">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="border-b border-border bg-secondary/50 text-left text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">ID</th>
                  <th className="px-4 py-2.5 font-medium">Solicitud</th>
                  <th className="px-4 py-2.5 font-medium hidden md:table-cell">Líder Producto</th>
                  <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Docente asignado</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="pl-4 pr-6 py-2.5 font-medium text-right min-w-[130px]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.slice(0, 6).map((r) => {
                  const isAssignedToMe = r.productLeader === user.name;
                  return (
                    <tr key={r.id} className="hover:bg-secondary/40">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.id}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Link to={`/solicitudes/${r.id}`} className="font-medium text-foreground hover:text-accent">
                            {r.title}
                          </Link>
                          {isAssignedToMe && role === "lider-producto" && (
                            <span className="rounded bg-accent/10 px-1.5 py-0.2 text-[10px] font-semibold text-accent">
                              Tu producto
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{r.company} · {r.type}</p>
                      </td>
                      <td className="px-4 py-2.5 hidden text-muted-foreground md:table-cell">{r.productLeader}</td>
                      <td className="px-4 py-2.5 hidden lg:table-cell">
                        {r.professor ? (
                          <span className="text-xs font-medium text-foreground">{r.professor}</span>
                        ) : (
                          <span className="inline-flex items-center rounded border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="pl-4 pr-6 py-2.5 text-right whitespace-nowrap min-w-[130px]">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/solicitudes/${r.id}`}>
                            {role === "lider-producto" && !r.professor ? "Asignar" : "Detalle"}
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
