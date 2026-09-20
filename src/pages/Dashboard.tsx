import { useState, useMemo } from "react";
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
  Sparkles,
  Building2,
  Check,
} from "@/components/icons";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { KamCommandCenter } from "@/components/dashboard/KamCommandCenter";
import { ProductLeaderDashboard } from "@/components/dashboard/ProductLeaderDashboard";
import { IcesiCenefa } from "@/components/IcesiLogo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user, requests, updateRequest, updateStatus } = useAuth();
  const role = user.role;

  // Filter for the requests table: default to "mis" for other roles
  const [tableFilter, setTableFilter] = useState<"mis" | "todas">("todas");

  // Custom high-impact commercial command center for KAM
  if (role === "kam") {
    return (
      <AppShell>
        <KamCommandCenter requests={requests} userName={user.name} />
      </AppShell>
    );
  }

  // Unified frictionless command board for Líder de Producto
  if (role === "lider-producto") {
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

  // Requests assigned to this product leader or relevant to the role
  const myRequests = requests.filter((r) => {
    if (role === "lider-producto") {
      return r.productLeader === user.name;
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
  const enExperto = requests.filter((r) => r.status === "en-experto").length;
  const enCosteo = requests.filter((r) => r.status === "en-costeo").length;
  const entregadas = requests.filter((r) => r.status === "entregada").length;

  const sinProfesor = requests.filter((r) => !r.professor && r.status !== "entregada").length;
  const enPropuesta = requests.filter((r) => r.status === "en-experto" || r.status === "en-costeo").length;

  const stats = (() => {
    // Nota: el rol "lider-producto" ya retornó más arriba (usa
    // ProductLeaderDashboard), así que esta función solo atiende
    // "lider-nodo" y "profesor". Antes había aquí una rama muerta para
    // "lider-producto" que además referenciaba una variable `listas` nunca
    // declarada (docs/11, Requisito 3) — se retiró en esta limpieza.
    if (role === "profesor") {
      return [
        { label: "Propuestas a diseñar", value: requests.filter((r) => r.professor === user.name).length, icon: GraduationCap, color: "text-[#5454e9]" },
        { label: "En desarrollo", value: requests.filter((r) => r.status === "en-experto").length, icon: Clock, color: "text-[#e9683b]" },
        { label: "Propuestas finalizadas", value: requests.filter((r) => r.status === "en-costeo" || r.status === "entregada").length, icon: CheckCircle2, color: "text-[#4cb979]" },
      ];
    }
    if (role === "lider-nodo") {
      return [
        { label: "Total solicitudes en nodos", value: total, icon: Network, color: "text-[#5454e9]" },
        { label: "Nuevas", value: nuevas, icon: TrendingUp, color: "text-[#5454e9]" },
        { label: "En experto / costeo", value: enPropuesta, icon: Clock, color: "text-[#e9683b]" },
        { label: "Entregadas", value: entregadas, icon: CheckCircle2, color: "text-[#4cb979]" },
      ];
    }
    // Default fallback
    return [
      { label: "Total solicitudes", value: total, icon: FileText, color: "text-[#5454e9]" },
      { label: "Nuevas", value: nuevas, icon: TrendingUp, color: "text-[#5454e9]" },
      { label: "En proceso", value: enPropuesta, icon: Clock, color: "text-[#865cf0]" },
      { label: "Entregadas", value: entregadas, icon: CheckCircle2, color: "text-[#4cb979]" },
    ];
  })();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-sans">
                {role === "lider-producto" && "Inicio · Líder de Producto"}
                {role === "kam" && "Inicio · KAM"}
                {role === "lider-nodo" && "Inicio · Líder de Nodo"}
                {role === "profesor" && "Inicio · Docente / Profesor"}
              </h1>
              <span className="rounded bg-[#5454e9]/10 dark:bg-[#5454e9]/20 px-2.5 py-0.5 text-xs font-bold text-[#5454e9] dark:text-[#865cf0]">
                {user.roleLabel}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {role === "lider-producto" && "Construye propuestas técnicas, asigna profesores docentes y coordina los programas comerciales."}
              {role === "kam" && "Gestiona cuentas corporativas y crea nuevas solicitudes comerciales."}
              {role === "lider-nodo" && "Supervisa y coordina las solicitudes entre los nodos académicos de la universidad."}
              {role === "profesor" && "Diseña contenidos curriculares, cronogramas y propuestas pedagógicas."}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-lg border border-border dark:border-[#252838] bg-card dark:bg-[#141622] px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#4cb979]" />
            {user.name}
          </span>
        </div>

        {/* Primary actions tailored by role */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {role === "lider-producto" ? (
            <>
              <Link
                to="/solicitudes?filter=sin-profesor"
                className="group flex items-start gap-4 rounded-xl border border-border dark:border-[#252838] border-t-4 border-t-[#e9683b] bg-card dark:bg-[#141622] p-5 transition-all hover:shadow-md hover:border-border"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9683b]/10 text-[#e9683b] group-hover:scale-105 transition-transform">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-base text-foreground font-sans">Asignar profesores</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Asigna docentes calificados a solicitudes pendientes de propuesta.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#e9683b]">
                    Ver pendientes ({sinProfesor}) <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>

              <Link
                to="/solicitudes?filter=propuestas"
                className="group flex items-start gap-4 rounded-xl border border-border dark:border-[#252838] border-t-4 border-t-[#5454e9] bg-card dark:bg-[#141622] p-5 transition-all hover:shadow-md hover:border-border"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5454e9]/10 text-[#5454e9] group-hover:scale-105 transition-transform">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-base text-foreground font-sans">Construir propuestas</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Elabora alcance, objetivos y costeo de programas.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#5454e9] dark:text-[#865cf0]">
                    Ver en trámite <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>

              <Link
                to="/solicitudes"
                className="group flex items-start gap-4 rounded-xl border border-border dark:border-[#252838] border-t-4 border-t-[#4cb979] bg-card dark:bg-[#141622] p-5 transition-all hover:shadow-md hover:border-border md:col-span-2 lg:col-span-1"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4cb979]/10 text-[#4cb979] group-hover:scale-105 transition-transform">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-base text-foreground font-sans">Tablero de solicitudes</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Monitorea todas las solicitudes asignadas por estado.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#4cb979]">
                    Abrir tablero <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/solicitudes/nueva"
                className="group flex items-start gap-4 rounded-xl border border-border dark:border-[#252838] border-t-4 border-t-[#5454e9] bg-card dark:bg-[#141622] p-5 transition-all hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5454e9]/10 text-[#5454e9]">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-base text-foreground font-sans">Ingresar solicitud</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Registra una nueva solicitud comercial paso a paso.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#5454e9] dark:text-[#865cf0]">
                    Comenzar <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>

              <Link
                to="/solicitudes"
                className="group flex items-start gap-4 rounded-xl border border-border dark:border-[#252838] border-t-4 border-t-[#4cb979] bg-card dark:bg-[#141622] p-5 transition-all hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4cb979]/10 text-[#4cb979]">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-base text-foreground font-sans">Ver solicitudes</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tablero con todas las solicitudes por estado.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#4cb979]">
                    Ver tablero <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Resumen Operativo · {user.roleLabel}
            </h2>
            <IcesiCenefa barsCount={6} height={6} color="#5454e9" className="opacity-40" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <Icon className={`h-4 w-4 ${s.color || "text-muted-foreground"}`} />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground font-sans">
                    {s.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Requests Table */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {role === "lider-producto" ? "Solicitudes para gestión de propuesta" : "Actividad reciente"}
              </h2>

              {role === "lider-producto" && (
                <div className="inline-flex rounded-lg border border-border dark:border-[#252838] p-0.5 bg-secondary/30">
                  <button
                    type="button"
                    onClick={() => setTableFilter("mis")}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5",
                      tableFilter === "mis"
                        ? "bg-card dark:bg-[#1a1c29] text-foreground shadow-2xs font-bold border border-border/50"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <UserCheck className="h-3.5 w-3.5 text-[#5454e9]" />
                    <span>Mis solicitudes ({requests.filter((r) => r.productLeader === user.name).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableFilter("todas")}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5",
                      tableFilter === "todas"
                        ? "bg-card dark:bg-[#1a1c29] text-foreground shadow-2xs font-bold border border-border/50"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Todas ({requests.length})</span>
                  </button>
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" asChild className="text-xs font-medium">
              <Link to="/solicitudes" className="gap-1.5 text-muted-foreground hover:text-foreground">
                Ver todas <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] shadow-xs">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="border-b border-border dark:border-[#252838] bg-secondary/40 dark:bg-[#12131d] text-left text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Solicitud & Empresa</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Líder Producto</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Docente asignado</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right min-w-[150px]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-[#252838]">
                {displayedTableRequests.length > 0 ? (
                  displayedTableRequests.slice(0, 8).map((r) => {
                    const isAssignedToMe = r.productLeader === user.name;
                    return (
                      <tr key={r.id} className="hover:bg-secondary/30 dark:hover:bg-[#1a1c29] transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-foreground">{r.id}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Link to={`/solicitudes/${r.id}`} className="font-semibold text-foreground hover:text-[#5454e9] transition-colors">
                              {r.title}
                            </Link>
                            {isAssignedToMe && role === "lider-producto" && (
                              <span className="rounded bg-[#5454e9]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#5454e9]">
                                Tu producto
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.company} · {r.type}</p>
                        </td>
                        <td className="px-4 py-3.5 hidden text-muted-foreground md:table-cell text-xs">{r.productLeader}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          {r.professor ? (
                            <span className="text-xs font-semibold text-foreground">{r.professor}</span>
                          ) : (
                            <span className="inline-flex items-center rounded border border-[#e9683b]/30 bg-[#e9683b]/10 px-2 py-0.5 text-xs font-medium text-[#e9683b]">
                              Sin asignar
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap min-w-[150px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="ghost" size="sm" asChild className="h-7.5 text-xs font-semibold">
                              <Link to={`/solicitudes/${r.id}`}>
                                {role === "lider-producto" && !r.professor ? "Asignar" : "Detalle"}
                                <ArrowRight className="ml-1 h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      <div className="max-w-md mx-auto space-y-2">
                        <p className="text-xs font-medium text-foreground">
                          No tienes solicitudes comerciales asignadas directamente a tu nombre en este momento.
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Las solicitudes ingresadas por los KAM con tu nombre como Líder de Producto aparecerán automáticamente aquí.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setTableFilter("todas")}
                          className="text-xs mt-2"
                        >
                          Ver todas las solicitudes del nodo
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
