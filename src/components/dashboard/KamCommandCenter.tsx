import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Rocket,
  Search,
  ArrowRight,
  Filter,
  X,
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
  Building2,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RequestItem,
  RequestStatus,
  formatCop,
  formatCompactCop,
  getRelativeTime,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface KamCommandCenterProps {
  requests: RequestItem[];
  userName: string;
}

type FilterType = "all" | "nueva" | "lista" | "cotizado" | "entregada";

export function KamCommandCenter({ requests, userName }: KamCommandCenterProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const firstName = userName ? userName.split(" ")[0] : "Andrea";

  // KPIs calculations
  const totalCount = requests.length;
  const nuevasCount = requests.filter((r) => r.status === "nueva").length;
  const listasCount = requests.filter((r) => r.status === "lista").length;
  const entregadasCount = requests.filter((r) => r.status === "entregada").length;

  // Pipeline Cotizado: proposals in "lista" (approved costing, ready for customer)
  const pipelineTotal = requests
    .filter((r) => r.status === "lista")
    .reduce((sum, r) => sum + (r.totalCostCop || r.costing?.totalOfferedCop || 0), 0);

  // Filtered requests for table
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Search matching: company, title, ID, applicant, productLeader
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          req.id.toLowerCase().includes(q) ||
          req.company.toLowerCase().includes(q) ||
          req.title.toLowerCase().includes(q) ||
          req.type.toLowerCase().includes(q) ||
          req.productLeader.toLowerCase().includes(q) ||
          (req.applicant && req.applicant.toLowerCase().includes(q));

        if (!matchesQuery) return false;
      }

      // Status / KPI filter
      if (activeFilter === "nueva") {
        return req.status === "nueva";
      }
      if (activeFilter === "lista") {
        return req.status === "lista";
      }
      if (activeFilter === "cotizado") {
        // Active proposals with approved costing ready for delivery
        return req.status === "lista" || (req.totalCostCop && req.totalCostCop > 0 && req.status !== "nueva");
      }
      if (activeFilter === "entregada") {
        return req.status === "entregada";
      }

      return true;
    });
  }, [requests, searchQuery, activeFilter]);

  const handleCardClick = (filter: FilterType) => {
    setActiveFilter((prev) => (prev === filter ? "all" : filter));
  };

  const getServiceTypeBadge = (type: string) => {
    switch (type) {
      case "Capacitación":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "Consultoría":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      case "Mentoría":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "Investigación":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
      case "Proyectos Especiales (Eventos)":
        return "bg-teal-50 text-teal-700 border-teal-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/80";
    }
  };

  const getProductLeaderInitials = (name: string) => {
    if (!name) return "LP";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* 1. CABECERA Y ACCIONES RÁPIDAS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Hola, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Panel de seguimiento y gestión de propuestas corporativas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            className="h-10 rounded-lg bg-blue-600 px-4 font-medium text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Link to="/solicitudes/nueva" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Nueva Solicitud</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Banner contextual si hay propuestas listas para entregar */}
      {listasCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5 sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-950">
                ¡Tienes {listasCount} {listasCount === 1 ? "propuesta lista" : "propuestas listas"} para entregar!
              </p>
              <p className="text-xs text-emerald-800">
                El Líder de Producto ya aprobó el costeo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveFilter("lista")}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
          >
            Ver listas para entrega
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. TARJETAS DE MÉTRICAS INTERACTIVAS (KPIs con Filtro) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* KPI 1: Total Solicitudes */}
        <button
          type="button"
          onClick={() => handleCardClick("all")}
          className={cn(
            "group relative flex flex-col justify-between rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm",
            activeFilter === "all"
              ? "border-slate-900 ring-2 ring-slate-900/10 bg-slate-50/60"
              : "border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Solicitudes</span>
            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              Total
            </span>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {totalCount}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {activeFilter === "all" ? "✓ Filtro activo" : "Todas las solicitudes activas"}
            </p>
          </div>
        </button>

        {/* KPI 2: En Costeo / Nuevas */}
        <button
          type="button"
          onClick={() => handleCardClick("nueva")}
          className={cn(
            "group relative flex flex-col justify-between rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-blue-300 hover:shadow-sm",
            activeFilter === "nueva"
              ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/40"
              : "border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">En Costeo / Nuevas</span>
            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              {nuevasCount} en trámite
            </span>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {nuevasCount}
            </p>
            <p className="mt-1 text-[11px] text-blue-700/80">
              {activeFilter === "nueva" ? "✓ Filtro activo" : "Pendientes de costeo"}
            </p>
          </div>
        </button>

        {/* KPI 3: Listas para Entregar */}
        <button
          type="button"
          onClick={() => handleCardClick("lista")}
          className={cn(
            "group relative flex flex-col justify-between rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm",
            activeFilter === "lista"
              ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/40"
              : "border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Listas para Entregar</span>
            <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
              Actionable
            </span>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl font-bold tracking-tight text-emerald-700 sm:text-3xl">
              {listasCount}
            </p>
            <p className="mt-1 text-[11px] font-medium text-emerald-600">
              {activeFilter === "lista" ? "✓ Filtro activo" : "Listas para enviar a cliente"}
            </p>
          </div>
        </button>

        {/* KPI 4: Pipeline Cotizado */}
        <button
          type="button"
          onClick={() => handleCardClick("cotizado")}
          className={cn(
            "group relative flex flex-col justify-between rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm",
            activeFilter === "cotizado"
              ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/30"
              : "border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pipeline Cotizado</span>
            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              COP
            </span>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {formatCompactCop(pipelineTotal)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {activeFilter === "cotizado" ? "✓ Filtro activo" : "Propuestas aprobadas"}
            </p>
          </div>
        </button>
      </div>

      {/* 3. TABLA DE ACTIVIDAD RECIENTE Y SEGUIMIENTO COMERCIAL */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Actividad reciente
          </h2>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {/* Barra superior de la tabla */}
          <div className="flex flex-col gap-3 border-b border-border p-4 pr-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por empresa, solicitud o ID..."
                  className="h-9 w-full rounded-lg border-border bg-background pl-9 pr-8 text-xs focus-visible:ring-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Pill de filtro activo */}
              {activeFilter !== "all" && (
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  <span>
                    {activeFilter === "nueva" && `En Costeo / Nuevas (${nuevasCount})`}
                    {activeFilter === "lista" && `Listas para Entregar (${listasCount})`}
                    {activeFilter === "cotizado" && `Pipeline Cotizado (${listasCount})`}
                    {activeFilter === "entregada" && `Entregadas (${entregadasCount})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className="rounded-full p-0.5 hover:bg-blue-200 text-blue-800 transition-colors"
                    title="Quitar filtro"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              {activeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className="text-xs text-muted-foreground hover:text-foreground sm:hidden"
                >
                  Limpiar filtro
                </button>
              )}
              <Button variant="ghost" size="sm" asChild className="text-xs font-medium text-muted-foreground hover:text-foreground">
                <Link to="/solicitudes" className="inline-flex items-center gap-1.5">
                  <span>Ver todas las solicitudes</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Tabla comercial */}
          <div className="overflow-x-auto pr-6">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="border-b border-border bg-secondary/40 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ID y Fecha</th>
                  <th className="px-4 py-3 font-medium">Empresa y Tipo de Servicio</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Líder de Producto</th>
                  <th className="px-4 py-3 font-medium">Valor Ofertado</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="pl-4 pr-6 py-3 font-medium text-right min-w-[140px]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      <div className="mx-auto max-w-sm">
                        <p className="font-medium text-foreground">No se encontraron solicitudes</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {searchQuery || activeFilter !== "all"
                            ? "Intenta modificar los términos de búsqueda o limpiar los filtros seleccionados."
                            : "No hay registros disponibles en este momento."}
                        </p>
                        {(searchQuery || activeFilter !== "all") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setActiveFilter("all");
                            }}
                            className="mt-3 text-xs"
                          >
                            Restablecer filtros
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => {
                    const isReady = r.status === "lista";
                    const isNueva = r.status === "nueva";
                    const isEntregada = r.status === "entregada";
                    const relativeTime = getRelativeTime(r.id);

                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          "transition-colors hover:bg-secondary/30",
                          isReady && "bg-emerald-50/20"
                        )}
                      >
                        {/* 1. ID y Fecha */}
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {r.id}
                            </span>
                            <span className="text-muted-foreground/60 text-xs">·</span>
                            <span className="text-xs text-muted-foreground">
                              {relativeTime}
                            </span>
                          </div>
                        </td>

                        {/* 2. Empresa y Tipo de Servicio */}
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex flex-col gap-1">
                            <Link
                              to={`/solicitudes/${r.id}`}
                              className="font-medium text-foreground hover:text-blue-600 transition-colors"
                            >
                              {r.company}
                            </Link>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
                                  getServiceTypeBadge(r.type)
                                )}
                              >
                                {r.type}
                              </span>
                              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                {r.title}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Líder de Producto Responsable */}
                        <td className="px-4 py-3.5 align-middle hidden md:table-cell">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground border border-border">
                              {getProductLeaderInitials(r.productLeader)}
                            </div>
                            <span className="text-xs font-medium text-foreground/90 truncate max-w-[180px]">
                              {r.productLeader}
                            </span>
                          </div>
                        </td>

                        {/* 4. Valor Ofertado */}
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          {isNueva ? (
                            <span className="inline-block rounded bg-muted/40 px-2 py-0.5 text-xs italic text-muted-foreground border border-border/50">
                              - Pendiente de costeo -
                            </span>
                          ) : r.totalCostCop || r.costing?.totalOfferedCop ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground text-xs sm:text-sm tracking-tight">
                                {formatCop(r.totalCostCop || r.costing?.totalOfferedCop || 0)}
                              </span>
                              {isReady && (
                                <span className="text-[10px] text-emerald-700 font-medium">
                                  Costeo aprobado
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs italic text-muted-foreground">
                              - Pendiente de costeo -
                            </span>
                          )}
                        </td>

                        {/* 5. Estado */}
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          {isNueva && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Nueva / En Costeo
                            </span>
                          )}
                          {isReady && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Lista para entregar
                            </span>
                          )}
                          {isEntregada && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                              Entregada
                            </span>
                          )}
                          {!isNueva && !isReady && !isEntregada && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                              Borrador
                            </span>
                          )}
                        </td>

                        {/* 6. Acción */}
                        <td className="pl-4 pr-6 py-3.5 align-middle text-right whitespace-nowrap min-w-[140px]">
                          {isReady ? (
                            <Button
                              asChild
                              size="sm"
                              className="h-8 rounded-full bg-emerald-600 px-3.5 text-xs font-medium text-white shadow-xs hover:bg-emerald-700 transition-colors"
                            >
                              <Link to={`/solicitudes/${r.id}`}>
                                <span>Ver propuesta</span>
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          ) : (
                            <Link
                              to={`/solicitudes/${r.id}`}
                              className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
                            >
                              <span>Ver detalle</span>
                              <ArrowRight className="ml-1 h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
