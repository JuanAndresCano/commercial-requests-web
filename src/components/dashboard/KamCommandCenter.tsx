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
  Layers,
  TrendingUp,
  Sparkles,
  LayoutGrid,
  List,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RequestItem,
  RequestStatus,
  STATUS_META,
  formatCop,
  formatCompactCop,
  getRelativeTime,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { IcesiCenefa } from "@/components/IcesiLogo";
import { UrgencyBadge } from "@/components/StatusBadge";
import { RequestCard } from "@/components/RequestCard";

const BOARD_COLUMNS: RequestStatus[] = ["nueva", "en-experto", "en-costeo", "entregada"];

interface KamCommandCenterProps {
  requests: RequestItem[];
  userName: string;
}

type FilterType = "all" | "en-proceso" | "listas-para-entregar" | "entregada" | "cotizado";

export function KamCommandCenter({ requests, userName }: KamCommandCenterProps) {
  const [scopeFilter, setScopeFilter] = useState<"mis" | "todas">("mis");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"tabla" | "kanban">("tabla");

  const firstName = userName ? userName.split(" ")[0] : "Andrea";

  // Solicitudes propias vs. las de todo el equipo comercial
  const myRequests = requests.filter((r) => r.kam === userName);
  const activeDataset = scopeFilter === "mis" ? myRequests : requests;

  // KPIs calculations según la nomenclatura oficial solicitada por Líder de Producto
  // (siempre respetan el alcance activo: mías o todo el equipo)
  const totalCount = activeDataset.length;
  // "En Proceso": Solicitudes que están siendo gestionadas (nuevas o en formulación con experto)
  const enProcesoCount = activeDataset.filter((r) => r.status === "nueva" || r.status === "en-experto").length;
  // "Listas para Entregar": Solicitudes con costeo elaborado y listas para entrega al cliente
  const listasParaEntregarCount = activeDataset.filter((r) => r.status === "en-costeo").length;
  const entregadasCount = activeDataset.filter((r) => r.status === "entregada").length;

  // Pipeline Cotizado: propuestas en "en-costeo" o "entregada" (con valor económico estimado)
  const pipelineTotal = activeDataset
    .filter((r) => r.status === "en-costeo" || r.status === "entregada")
    .reduce((sum, r) => sum + (r.totalCostCop || r.costing?.totalOfferedCop || 0), 0);

  // El aviso de "listas para entregar" es un recordatorio personal: siempre cuenta
  // lo propio del KAM, sin importar si está viendo el alcance "Todas" en ese momento.
  const misListasParaEntregarCount = myRequests.filter((r) => r.status === "en-costeo").length;

  // Filtered requests for table
  const filteredRequests = useMemo(() => {
    return activeDataset.filter((req) => {
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
      if (activeFilter === "en-proceso") {
        return req.status === "nueva" || req.status === "en-experto";
      }
      if (activeFilter === "listas-para-entregar") {
        return req.status === "en-costeo";
      }
      if (activeFilter === "cotizado") {
        return req.status === "en-costeo" || req.status === "entregada" || (req.totalCostCop && req.totalCostCop > 0 && req.status !== "nueva");
      }
      if (activeFilter === "entregada") {
        return req.status === "entregada";
      }

      return true;
    });
  }, [activeDataset, searchQuery, activeFilter]);

  // Agrupación por estado real (para la vista Kanban) — respeta el mismo dataset filtrado que la tabla
  const groupedByStatus = useMemo(() => {
    const g: Record<RequestStatus, RequestItem[]> = {
      nueva: [],
      "en-experto": [],
      "en-costeo": [],
      entregada: [],
    };
    filteredRequests.forEach((r) => {
      if (g[r.status]) g[r.status].push(r);
    });
    return g;
  }, [filteredRequests]);

  const handleCardClick = (filter: FilterType) => {
    setActiveFilter((prev) => (prev === filter ? "all" : filter));
  };

  const getServiceTypeBadge = (type: string) => {
    switch (type) {
      case "Capacitación":
        return "bg-[#5454e9]/10 text-[#5454e9] dark:text-[#865cf0] border-[#5454e9]/30";
      case "Consultoría":
        return "bg-[#865cf0]/10 text-[#865cf0] border-[#865cf0]/30";
      case "Mentoría":
        return "bg-[#e9683b]/10 text-[#e9683b] border-[#e9683b]/30";
      case "Investigación":
        return "bg-[#4cb979]/10 text-[#4cb979] border-[#4cb979]/30";
      default:
        return "bg-secondary text-foreground border-border";
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
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Hola, {firstName}
            </h1>
            <span className="rounded bg-[#e4eb60]/25 px-2 py-0.5 text-xs font-bold text-[#757a07] dark:text-[#e4eb60]">
              KAM Icesi
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Panel de seguimiento, prospección y gestión de propuestas corporativas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-border dark:border-[#252838] p-0.5 bg-secondary/30">
            <button
              type="button"
              onClick={() => setScopeFilter("mis")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                scopeFilter === "mis"
                  ? "bg-[#5454e9] text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Mis Solicitudes ({myRequests.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("todas")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                scopeFilter === "todas"
                  ? "bg-[#5454e9] text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Todas ({requests.length})</span>
            </button>
          </div>
          <Button
            asChild
            className="h-10 rounded-lg bg-[#5454e9] px-4 font-bold text-white shadow-sm hover:bg-[#4343d3] transition-all"
          >
            <Link to="/solicitudes/nueva" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Nueva Solicitud</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Aviso contextual si el KAM tiene propuestas propias listas para entregar
          (siempre personal, sin importar el alcance "Mis/Todas" seleccionado) */}
      {misListasParaEntregarCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#4cb979]/30 bg-[#4cb979]/10 dark:bg-[#4cb979]/15 p-4 text-foreground shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5 sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4cb979] text-white">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                ¡Tienes {misListasParaEntregarCount} {misListasParaEntregarCount === 1 ? "propuesta lista para entregar" : "propuestas listas para entregar"}!
              </p>
              <p className="text-xs text-muted-foreground">
                El Líder de Producto ha finalizado el costeo y la propuesta está lista para remitir al cliente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setScopeFilter("mis");
              setActiveFilter("listas-para-entregar");
            }}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 rounded-lg bg-[#4cb979] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#3ea569]"
          >
            Ver listas
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
            "group relative flex flex-col justify-between rounded-xl border p-4 text-left shadow-xs transition-all hover:border-[#5454e9]/50",
            activeFilter === "all"
              ? "border-[#5454e9] ring-2 ring-[#5454e9]/20 bg-[#5454e9]/5 dark:bg-[#5454e9]/10"
              : "border-border dark:border-[#252838] bg-card dark:bg-[#141622]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Solicitudes</span>
            <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-bold text-foreground">
              Total
            </span>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {totalCount}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {activeFilter === "all" ? "✓ Filtro activo" : "Todas las solicitudes registradas"}
            </p>
          </div>
        </button>

        {/* KPI 2: En Proceso */}
        <button
          type="button"
          onClick={() => handleCardClick("en-proceso")}
          className={cn(
            "group relative flex flex-col justify-between rounded-xl border p-4 text-left shadow-xs transition-all hover:border-[#5454e9]/50",
            activeFilter === "en-proceso"
              ? "border-[#5454e9] ring-2 ring-[#5454e9]/20 bg-[#5454e9]/10 dark:bg-[#5454e9]/15"
              : "border-border dark:border-[#252838] bg-card dark:bg-[#141622]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">En Proceso</span>
            <span className="inline-flex items-center rounded-md border border-[#5454e9]/30 bg-[#5454e9]/10 px-2 py-0.5 text-[11px] font-bold text-[#5454e9]">
              {enProcesoCount} en proceso
            </span>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {enProcesoCount}
            </p>
            <p className="mt-1 text-[11px] text-[#5454e9] dark:text-[#865cf0]">
              {activeFilter === "en-proceso" ? "✓ Filtro activo" : "En formulación y asignación"}
            </p>
          </div>
        </button>

        {/* KPI 3: Listas para Entregar */}
        <button
          type="button"
          onClick={() => handleCardClick("listas-para-entregar")}
          className={cn(
            "group relative flex flex-col justify-between rounded-xl border p-4 text-left shadow-xs transition-all hover:border-[#4cb979]/50",
            activeFilter === "listas-para-entregar"
              ? "border-[#4cb979] ring-2 ring-[#4cb979]/20 bg-[#4cb979]/10 dark:bg-[#4cb979]/15"
              : "border-border dark:border-[#252838] bg-card dark:bg-[#141622]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Listas para Entregar</span>
            <span className="inline-flex items-center rounded-md border border-[#4cb979]/30 bg-[#4cb979]/10 px-2 py-0.5 text-[11px] font-bold text-[#4cb979]">
              {listasParaEntregarCount} listas
            </span>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl font-bold tracking-tight text-[#4cb979] sm:text-3xl">
              {listasParaEntregarCount}
            </p>
            <p className="mt-1 text-[11px] font-medium text-[#4cb979]">
              {activeFilter === "listas-para-entregar" ? "✓ Filtro activo" : "Costeo listo para enviar al cliente"}
            </p>
          </div>
        </button>

        {/* KPI 4: Pipeline Cotizado */}
        <button
          type="button"
          onClick={() => handleCardClick("cotizado")}
          className={cn(
            "group relative flex flex-col justify-between rounded-xl border p-4 text-left shadow-xs transition-all hover:border-[#865cf0]/50",
            activeFilter === "cotizado"
              ? "border-[#865cf0] ring-2 ring-[#865cf0]/20 bg-[#865cf0]/10 dark:bg-[#865cf0]/15"
              : "border-border dark:border-[#252838] bg-card dark:bg-[#141622]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pipeline Cotizado</span>
            <span className="inline-flex items-center rounded-md border border-[#865cf0]/30 bg-[#865cf0]/10 px-2 py-0.5 text-[11px] font-bold text-[#865cf0]">
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
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Actividad reciente & Solicitudes
            </h2>
            <IcesiCenefa barsCount={8} height={6} color="#5454e9" className="opacity-40" />
          </div>

          <div className="flex items-center gap-0.5 rounded-lg border border-border dark:border-[#2b2d3d] p-0.5 bg-card dark:bg-[#141622]">
            <button
              type="button"
              onClick={() => setViewMode("tabla")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "tabla" ? "bg-[#5454e9] text-white" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Vista tabla"
              title="Vista tabla"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "kanban" ? "bg-[#5454e9] text-white" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Vista kanban"
              title="Vista kanban por estado"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] shadow-xs overflow-hidden">
          {/* Barra superior de la tabla */}
          <div className="flex flex-col gap-3 border-b border-border dark:border-[#252838] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por propuesta, empresa o ID..."
                  className="h-9 w-full rounded-lg border-border dark:border-[#2b2d3d] bg-background dark:bg-[#0e0f14] pl-9 pr-8 text-xs focus-visible:ring-1 focus-visible:ring-[#5454e9]"
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
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#5454e9]/30 bg-[#5454e9]/10 px-2.5 py-1 text-xs font-medium text-[#5454e9] dark:text-[#865cf0]">
                  <span>
                    {activeFilter === "en-proceso" && `En proceso (${enProcesoCount})`}
                    {activeFilter === "listas-para-entregar" && `Listas para entregar (${listasParaEntregarCount})`}
                    {activeFilter === "cotizado" && `Pipeline Cotizado (${listasParaEntregarCount})`}
                    {activeFilter === "entregada" && `Entregadas (${entregadasCount})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className="rounded-full p-0.5 hover:bg-[#5454e9]/20 transition-colors"
                    title="Quitar filtro"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {activeFilter !== "all" && (
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto sm:hidden"
              >
                Limpiar filtro
              </button>
            )}
          </div>

          {/* Tabla comercial */}
          {viewMode === "tabla" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="border-b border-border dark:border-[#252838] bg-secondary/40 dark:bg-[#12131d] text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ID y Fecha</th>
                  <th className="px-4 py-3 font-medium">Propuesta y Empresa</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Líder de Producto</th>
                  <th className="px-4 py-3 font-medium">Valor Ofertado</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right min-w-[140px]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-[#252838]">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      <div className="mx-auto max-w-sm">
                        {scopeFilter === "mis" && !searchQuery && activeFilter === "all" && myRequests.length === 0 ? (
                          <>
                            <p className="font-medium text-foreground">Aún no tienes solicitudes registradas</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Las solicitudes que registres quedarán aquí automáticamente.
                            </p>
                            <div className="mt-3 flex items-center justify-center gap-2">
                              <Button asChild size="sm" className="text-xs bg-[#5454e9] hover:bg-[#4343d3] text-white">
                                <Link to="/solicitudes/nueva">Crear mi primera solicitud</Link>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setScopeFilter("todas")} className="text-xs">
                                Ver las del equipo
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => {
                    const isReady = r.status === "en-costeo";
                    const isEnProceso = r.status === "nueva" || r.status === "en-experto";
                    const isEntregada = r.status === "entregada";
                    const relativeTime = getRelativeTime(r.id);

                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          "transition-colors hover:bg-secondary/30 dark:hover:bg-[#1a1c2a]",
                          isReady && "bg-[#4cb979]/5 dark:bg-[#4cb979]/10"
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

                        {/* 2. Propuesta y Empresa */}
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex flex-col gap-1 max-w-[320px]">
                            <Link
                              to={`/solicitudes/${r.id}`}
                              className="font-semibold text-sm text-foreground hover:text-[#5454e9] dark:hover:text-[#865cf0] transition-colors leading-snug line-clamp-2"
                              title={r.title}
                            >
                              {r.title}
                            </Link>
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium shrink-0",
                                  getServiceTypeBadge(r.type)
                                )}
                              >
                                {r.type}
                              </span>
                              <UrgencyBadge urgency={r.urgency} className="shrink-0" />
                              <span className="inline-flex items-center gap-1 text-muted-foreground font-medium truncate">
                                <Building2 className="h-3 w-3 shrink-0 opacity-70" />
                                {r.company}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Líder de Producto Responsable */}
                        <td className="px-4 py-3.5 align-middle hidden md:table-cell">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary dark:bg-[#1e202d] text-xs font-bold text-foreground border border-border dark:border-[#2b2d3d]">
                              {getProductLeaderInitials(r.productLeader)}
                            </div>
                            <span className="text-xs font-medium text-foreground/90 truncate max-w-[180px]">
                              {r.productLeader}
                            </span>
                          </div>
                        </td>

                        {/* 4. Valor Ofertado */}
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          {r.status === "nueva" ? (
                            <span className="inline-block rounded bg-muted/40 px-2 py-0.5 text-xs italic text-muted-foreground border border-border/50">
                              - Pendiente de costeo -
                            </span>
                          ) : r.totalCostCop || r.costing?.totalOfferedCop ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground text-xs sm:text-sm tracking-tight">
                                {formatCop(r.totalCostCop || r.costing?.totalOfferedCop || 0)}
                              </span>
                              {isReady && (
                                <span className="text-[10px] text-[#4cb979] font-medium">
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
                          {isEnProceso && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5454e9]/30 bg-[#5454e9]/10 px-2.5 py-0.5 text-xs font-medium text-[#5454e9] dark:text-[#865cf0]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#5454e9] animate-pulse" />
                              En proceso
                            </span>
                          )}
                          {isReady && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4cb979]/30 bg-[#4cb979]/10 px-2.5 py-0.5 text-xs font-medium text-[#4cb979]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#4cb979]" />
                              Lista para entregar
                            </span>
                          )}
                          {isEntregada && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#865cf0]/30 bg-[#865cf0]/10 px-2.5 py-0.5 text-xs font-medium text-[#865cf0]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#865cf0]" />
                              Entregada
                            </span>
                          )}
                          {!isEnProceso && !isReady && !isEntregada && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5454e9]/30 bg-[#5454e9]/10 px-2.5 py-0.5 text-xs font-medium text-[#5454e9]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#5454e9]" />
                              En proceso
                            </span>
                          )}
                        </td>

                        {/* 6. Acción */}
                        <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap min-w-[140px]">
                          {isReady ? (
                            <Button
                              asChild
                              size="sm"
                              className="h-8 rounded-full bg-[#4cb979] hover:bg-[#3ea569] px-3.5 text-xs font-bold text-white shadow-xs transition-colors"
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
          )}

          {/* Vista Kanban por estado */}
          {viewMode === "kanban" && (
            filteredRequests.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                <div className="mx-auto max-w-sm">
                  {scopeFilter === "mis" && !searchQuery && activeFilter === "all" && myRequests.length === 0 ? (
                    <>
                      <p className="font-medium text-foreground">Aún no tienes solicitudes registradas</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Las solicitudes que registres quedarán aquí automáticamente.
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <Button asChild size="sm" className="text-xs bg-[#5454e9] hover:bg-[#4343d3] text-white">
                          <Link to="/solicitudes/nueva">Crear mi primera solicitud</Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setScopeFilter("todas")} className="text-xs">
                          Ver las del equipo
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                {BOARD_COLUMNS.map((col) => {
                  const meta = STATUS_META[col];
                  const items = groupedByStatus[col] || [];
                  return (
                    <div
                      key={col}
                      className="flex flex-col rounded-xl border border-border dark:border-[#222434] bg-secondary/30 dark:bg-[#0f1017] p-2.5"
                    >
                      <div className="mb-2.5 flex items-center justify-between px-2 py-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            {meta.label}
                          </h3>
                        </div>
                        <span className="rounded-full bg-card dark:bg-[#1a1c28] border border-border dark:border-[#252838] px-2 py-0.5 text-[11px] font-bold text-foreground">
                          {items.length}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-2.5">
                        {items.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border dark:border-[#252838] p-6 text-center text-xs text-muted-foreground">
                            Sin solicitudes en esta fase
                          </div>
                        ) : (
                          items.map((r) => <RequestCard key={r.id} req={r} />)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
