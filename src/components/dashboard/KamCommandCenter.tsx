import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Rocket, Search, ArrowRight, X, Building2, LayoutGrid, List } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequestItem, RequestStatus, formatCop, formatCompactCop, isReadyForKamHandoff } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { IcesiCenefa } from "@/components/IcesiLogo";
import { UrgencyBadge } from "@/components/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { RequestCard } from "@/components/RequestCard";
import { StageKpiCard } from "@/components/kanban/StageKpiCard";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useRequests } from "@/hooks/use-requests";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { formatRelativeTime, mapProposalToRequestItem } from "@/lib/proposal-adapter";
import { fuzzyMatch } from "@/lib/fuzzy";

const BOARD_COLUMNS: RequestStatus[] = ["nueva", "en-experto", "en-costeo", "entregada"];

// Etiquetas comerciales para el KAM: mismo estado real del pipeline, pero sin
// vocabulario interno de coordinación académica ("en proceso por experto").
// Se usan igual en el Kanban, la tabla y las tarjetas KPI para que las 3
// vistas siempre coincidan — confirmado con Dianis (docs/08, pregunta 2).
const KAM_STAGE_LABELS: Record<RequestStatus, string> = {
  nueva: "Nueva",
  "en-experto": "En Proceso",
  "en-costeo": "Lista para Entregar",
  entregada: "Entregada",
};

interface KamCommandCenterProps {
  requests?: RequestItem[];
  userName: string;
}

type FilterType = RequestStatus | "all";

// Reclasifica una solicitud a la etapa que el KAM realmente percibe. Una
// "en-costeo" que el Líder todavía no confirmó ("Enviar a KAM") sigue siendo,
// desde la óptica del KAM, trabajo en proceso — no algo que ya pueda revisar
// para entregar. Antes esa distinción solo se aplicaba al contador de la
// tarjeta KPI ("Lista para Entregar"), mientras el Kanban seguía agrupando
// por el estado real "en-costeo" completo: la tarjeta decía "1" pero la
// columna mostraba las 3 solicitudes en costeo. Con una sola función como
// fuente de verdad para KPI, tabla y Kanban, ese desfase no puede repetirse.
function kamStageOf(r: RequestItem): RequestStatus {
  if (r.status === "en-costeo" && !isReadyForKamHandoff(r)) return "en-experto";
  return r.status;
}

export function KamCommandCenter({ requests, userName }: KamCommandCenterProps) {
  const { data: apiProposals, isLoading, isError, refetch } = useRequests({ role: "KAM" });
  const { data: apiMetrics } = useDashboardMetrics();

  // Persistido para que el tablero (búsqueda, filtro y vista) siga como lo dejó
  // el KAM al volver del detalle de una propuesta — antes se reiniciaba porque
  // el dashboard se desmonta y remonta en cada navegación.
  const [activeFilter, setActiveFilter] = usePersistentState<FilterType>("icesi_kam_dashboard_filter_v1", "all");
  const [searchQuery, setSearchQuery] = usePersistentState("icesi_kam_dashboard_search_v1", "");
  const [viewMode, setViewMode] = usePersistentState<"tabla" | "kanban">("icesi_kam_dashboard_view_v1", "tabla");

  const firstName = userName ? userName.split(" ")[0] : "Andrea";

  // El KAM es dueño de su propia cartera de clientes — solo ve sus propias
  // solicitudes. Si la API responde datos reales, los adaptamos; de lo contrario
  // se utiliza el dataset fallback.
  const activeDataset = useMemo(() => {
    if (apiProposals) {
      return apiProposals.map((p) => mapProposalToRequestItem(p, userName));
    }
    return requests ? requests.filter((r) => r.kam === userName) : [];
  }, [apiProposals, requests, userName]);

  const myRequests = activeDataset;

  // Conteos por etapa percibida por el KAM (ver kamStageOf) — cada uno mapea
  // 1:1 a una columna del Kanban y a una tarjeta KPI, para que nunca se
  // desalineen entre vistas.
  const nuevaCount = activeDataset.filter((r) => kamStageOf(r) === "nueva").length;
  const enProcesoCount = activeDataset.filter((r) => kamStageOf(r) === "en-experto").length;
  // "Lista para Entregar" es una promesa concreta ("ya puedes enviarla al
  // cliente"), no solo la etapa "en-costeo" — desde que el Líder de Producto
  // confirma explícitamente el envío (docs/04), una solicitud
  // puede estar en "en-costeo" sin que el KAM tenga nada que hacer todavía.
  // Contar solo las confirmadas evita que este número (y el aviso de abajo)
  // le diga al KAM que puede entregar algo que el Líder aún está costeando.
  const listasParaEntregarCount = activeDataset.filter((r) => kamStageOf(r) === "en-costeo").length;
  const entregadasCount = activeDataset.filter((r) => kamStageOf(r) === "entregada").length;
  const stageCounts: Record<RequestStatus, number> = {
    nueva: nuevaCount,
    "en-experto": enProcesoCount,
    "en-costeo": listasParaEntregarCount,
    entregada: entregadasCount,
  };

  // Métricas agregadas (no son una etapa del pipeline) — se muestran como
  // dato secundario, no como tarjeta-filtro principal.
  const totalCount = apiMetrics?.total ?? activeDataset.length;
  const pipelineTotal = activeDataset
    .filter((r) => r.status === "en-costeo" || r.status === "entregada")
    .reduce((sum, r) => sum + (r.totalCostCop || r.costing?.totalOfferedCop || 0), 0);

  const misListasParaEntregarCount = listasParaEntregarCount;

  const matchesSearch = (req: RequestItem, q: string) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    if (
      req.id.toLowerCase().includes(term) ||
      req.company.toLowerCase().includes(term) ||
      req.title.toLowerCase().includes(term) ||
      req.type.toLowerCase().includes(term) ||
      req.productLeader.toLowerCase().includes(term) ||
      (req.applicant ? req.applicant.toLowerCase().includes(term) : false)
    ) {
      return true;
    }
    return fuzzyMatch(term, req.company) || fuzzyMatch(term, req.title) || fuzzyMatch(term, req.productLeader);
  };

  // Vista Tabla: el estado sí oculta filas — ahí aporta valor real (reduce una lista larga).
  const filteredRequests = useMemo(() => {
    return activeDataset.filter((req) => {
      if (searchQuery.trim() && !matchesSearch(req, searchQuery.toLowerCase().trim())) return false;
      if (activeFilter !== "all") {
        return kamStageOf(req) === activeFilter;
      }
      return true;
    });
  }, [activeDataset, searchQuery, activeFilter]);

  // Vista Kanban: la columna ya ES el estado, así que el filtro de estado no debe vaciar el
  // contenido (no aporta nada nuevo) — solo el buscador, que sí cruza información que el
  // tablero no muestra por sí solo. El filtro activo solo dispara el "spotlight" (resaltar +
  // scroll a la columna), no oculta nada.
  const kanbanRequests = useMemo(() => {
    return activeDataset.filter((req) => {
      if (searchQuery.trim() && !matchesSearch(req, searchQuery.toLowerCase().trim())) return false;
      return true;
    });
  }, [activeDataset, searchQuery]);

  // Agrupación por etapa percibida por el KAM (ver kamStageOf), para la vista
  // Kanban — así la columna "Lista para Entregar" solo contiene tarjetas que
  // de verdad se pueden entregar, y las "en-costeo" aún sin confirmar caen en
  // "En Proceso" junto con las que están con el experto.
  const groupedByStatus = useMemo(() => {
    const g: Record<RequestStatus, RequestItem[]> = {
      nueva: [],
      "en-experto": [],
      "en-costeo": [],
      entregada: [],
    };
    kanbanRequests.forEach((r) => {
      const stage = kamStageOf(r);
      if (g[stage]) g[stage].push(r);
    });
    return g;
  }, [kanbanRequests]);

  // En Kanban, las columnas ya son el filtro — la tarjeta KPI en esa vista no
  // oculta nada (no aportaba valor, ver docs), sino que "aísla" esa columna a
  // pantalla completa para revisar más tarjetas cómodamente sin salir del
  // Kanban. Es un estado de enfoque, no un filtro de datos.
  const [isolatedStage, setIsolatedStage] = usePersistentState<RequestStatus | null>(
    "icesi_kam_dashboard_isolated_v1",
    null,
  );

  const handleCardClick = (stage: RequestStatus) => {
    if (viewMode === "tabla") {
      setActiveFilter((prev) => (prev === stage ? "all" : stage));
    } else {
      setIsolatedStage((prev) => (prev === stage ? null : stage));
    }
  };

  const getServiceTypeBadge = (type: string) => {
    switch (type) {
      case "Capacitación":
        return "bg-icesi-blue/10 text-icesi-blue dark:text-icesi-purple border-icesi-blue/30";
      case "Consultoría":
        return "bg-icesi-purple/10 text-icesi-purple border-icesi-purple/30";
      case "Mentoría":
        return "bg-icesi-orange/10 text-icesi-orange border-icesi-orange/30";
      case "Investigación":
        return "bg-icesi-green/10 text-icesi-green border-icesi-green/30";
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
            <RoleBadge label="KAM Icesi" />
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Panel de seguimiento, prospección y gestión de propuestas corporativas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            className="h-10 rounded-lg bg-icesi-blue px-4 font-bold text-white shadow-sm hover:bg-icesi-blue/90 transition-all"
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
        <div className="flex flex-col gap-3 rounded-xl border border-icesi-green/30 bg-icesi-green/10 dark:bg-icesi-green/15 p-4 text-foreground shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5 sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-icesi-green text-white">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                ¡Tienes {misListasParaEntregarCount}{" "}
                {misListasParaEntregarCount === 1 ? "propuesta lista para entregar" : "propuestas listas para entregar"}
                !
              </p>
              <p className="text-xs text-muted-foreground">
                El Líder de Producto ha finalizado el costeo y la propuesta está lista para remitir al cliente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCardClick("en-costeo")}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 rounded-lg bg-icesi-blue px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-icesi-blue/90"
          >
            Ver listas
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Dato agregado secundario — no es una etapa del pipeline, así que ya
          no ocupa una tarjeta-filtro completa (evita que se confunda con un
          estado del Kanban). */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-0.5 text-xs text-muted-foreground">
        <span>
          <strong className="font-bold text-foreground">{totalCount}</strong> solicitudes en total
        </span>
        <span className="text-border dark:text-icesi-border">·</span>
        <span>
          <strong className="font-bold text-foreground">{formatCompactCop(pipelineTotal)}</strong> en pipeline cotizado
        </span>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS INTERACTIVAS — cada una mapea 1:1 a una etapa
          real del pipeline, igual que el Kanban. En Tabla filtran (ocultan
          filas); en Kanban aíslan esa columna a pantalla completa. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StageKpiCard
          stage="nueva"
          label="Nueva"
          count={nuevaCount}
          hint="Recién enviadas, sin asignar"
          activeHint={viewMode === "tabla" ? "✓ Filtro activo" : "✓ Aislada en el tablero"}
          active={viewMode === "tabla" ? activeFilter === "nueva" : isolatedStage === "nueva"}
          onClick={() => handleCardClick("nueva")}
        />
        <StageKpiCard
          stage="en-experto"
          label="En Proceso"
          count={enProcesoCount}
          hint="El Líder de Producto la está formulando"
          activeHint={viewMode === "tabla" ? "✓ Filtro activo" : "✓ Aislada en el tablero"}
          active={viewMode === "tabla" ? activeFilter === "en-experto" : isolatedStage === "en-experto"}
          onClick={() => handleCardClick("en-experto")}
        />
        <StageKpiCard
          stage="en-costeo"
          label="Lista para Entregar"
          count={listasParaEntregarCount}
          hint="Costeo listo para enviar al cliente"
          activeHint={viewMode === "tabla" ? "✓ Filtro activo" : "✓ Aislada en el tablero"}
          active={viewMode === "tabla" ? activeFilter === "en-costeo" : isolatedStage === "en-costeo"}
          onClick={() => handleCardClick("en-costeo")}
        />
        <StageKpiCard
          stage="entregada"
          label="Entregada"
          count={entregadasCount}
          hint="Cerradas con el cliente"
          activeHint={viewMode === "tabla" ? "✓ Filtro activo" : "✓ Aislada en el tablero"}
          active={viewMode === "tabla" ? activeFilter === "entregada" : isolatedStage === "entregada"}
          onClick={() => handleCardClick("entregada")}
        />
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

          <div className="flex items-center gap-0.5 rounded-lg border border-border dark:border-icesi-border p-0.5 bg-card dark:bg-icesi-card">
            <button
              type="button"
              onClick={() => setViewMode("tabla")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "tabla" ? "bg-icesi-blue text-white" : "text-muted-foreground hover:text-foreground",
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
                viewMode === "kanban" ? "bg-icesi-blue text-white" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Vista kanban"
              title="Vista kanban por estado"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border dark:border-icesi-border bg-card dark:bg-icesi-card shadow-xs overflow-hidden">
          {/* Barra superior de la tabla */}
          <div className="flex flex-col gap-3 border-b border-border dark:border-icesi-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por propuesta, empresa o ID..."
                  className="h-9 w-full rounded-lg border-border dark:border-icesi-border bg-background dark:bg-icesi-dark pl-9 pr-8 text-xs focus-visible:ring-1 focus-visible:ring-icesi-blue"
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

              {/* Pill de filtro activo — solo aplica en Tabla, donde el filtro sí oculta filas */}
              {viewMode === "tabla" && activeFilter !== "all" && (
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-icesi-blue/30 bg-icesi-blue/10 px-2.5 py-1 text-xs font-medium text-icesi-blue dark:text-icesi-purple">
                  <span>
                    {KAM_STAGE_LABELS[activeFilter]} ({stageCounts[activeFilter]})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className="rounded-full p-0.5 hover:bg-icesi-blue/20 transition-colors"
                    title="Quitar filtro"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {viewMode === "tabla" && activeFilter !== "all" && (
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
                <thead className="border-b border-border dark:border-icesi-border bg-secondary/40 dark:bg-icesi-card text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">ID y Fecha</th>
                    <th className="px-4 py-3 font-medium">Propuesta y Empresa</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Líder de Producto</th>
                    <th className="px-4 py-3 font-medium">Valor Ofertado</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium text-right min-w-[140px]">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-icesi-border">
                  {isLoading && activeDataset.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-icesi-blue border-t-transparent" />
                          <p className="font-medium text-foreground">Cargando solicitudes desde el servidor...</p>
                        </div>
                      </td>
                    </tr>
                  ) : isError && activeDataset.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        <div className="mx-auto max-w-sm">
                          <p className="font-medium text-destructive">No se pudieron cargar las solicitudes</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Ocurrió un error al consultar el servidor.
                          </p>
                          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3 text-xs">
                            Reintentar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        <div className="mx-auto max-w-sm">
                          {!searchQuery && activeFilter === "all" && myRequests.length === 0 ? (
                            <>
                              <p className="font-medium text-foreground">Aún no tienes solicitudes registradas</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Las solicitudes que registres quedarán aquí automáticamente.
                              </p>
                              <div className="mt-3 flex items-center justify-center gap-2">
                                <Button
                                  asChild
                                  size="sm"
                                  className="text-xs bg-icesi-blue hover:bg-icesi-blue/90 text-white"
                                >
                                  <Link to="/solicitudes/nueva">Crear mi primera solicitud</Link>
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
                      const isReady = isReadyForKamHandoff(r);
                      const isBeingCosted = r.status === "en-costeo" && !isReady;
                      const relativeTime = formatRelativeTime(r.createdAt);

                      return (
                        <tr
                          key={r.id}
                          className={cn(
                            "transition-colors hover:bg-secondary/30 dark:hover:bg-muted/50",
                            isReady && "bg-icesi-green/5 dark:bg-icesi-green/10",
                          )}
                        >
                          {/* 1. ID y Fecha */}
                          <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-semibold text-foreground">{r.id}</span>
                              <span className="text-muted-foreground/60 text-xs">·</span>
                              <span className="text-xs text-muted-foreground">{relativeTime}</span>
                            </div>
                          </td>

                          {/* 2. Propuesta y Empresa */}
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex flex-col gap-1 max-w-[320px]">
                              <Link
                                to={`/solicitudes/${r.id}`}
                                className="font-semibold text-sm text-foreground hover:text-icesi-blue dark:hover:text-icesi-purple transition-colors leading-snug line-clamp-2"
                                title={r.title}
                              >
                                {r.title}
                              </Link>
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium shrink-0",
                                    getServiceTypeBadge(r.type),
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
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary dark:bg-icesi-card text-xs font-bold text-foreground border border-border dark:border-icesi-border">
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
                                  <span className="text-[10px] text-icesi-green font-medium">Costeo aprobado</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs italic text-muted-foreground">- Pendiente de costeo -</span>
                            )}
                          </td>

                          {/* 5. Estado — mismas 4 etiquetas y colores que el Kanban */}
                          <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                            {r.status === "nueva" && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-icesi-blue/30 bg-icesi-blue/10 px-2.5 py-0.5 text-xs font-medium text-icesi-blue dark:text-icesi-purple">
                                <span className="h-1.5 w-1.5 rounded-full bg-icesi-blue" />
                                Nueva
                              </span>
                            )}
                            {r.status === "en-experto" && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-icesi-orange/30 bg-icesi-orange/10 px-2.5 py-0.5 text-xs font-medium text-icesi-orange">
                                <span className="h-1.5 w-1.5 rounded-full bg-icesi-orange animate-pulse" />
                                En Proceso
                              </span>
                            )}
                            {isBeingCosted && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                En Costeo
                              </span>
                            )}
                            {isReady && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-icesi-purple/30 bg-icesi-purple/10 px-2.5 py-0.5 text-xs font-medium text-icesi-purple">
                                <span className="h-1.5 w-1.5 rounded-full bg-icesi-purple" />
                                Lista para entregar
                              </span>
                            )}
                            {r.status === "entregada" && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-icesi-green/30 bg-icesi-green/10 px-2.5 py-0.5 text-xs font-medium text-icesi-green">
                                <span className="h-1.5 w-1.5 rounded-full bg-icesi-green" />
                                Entregada
                              </span>
                            )}
                          </td>

                          {/* 6. Acción */}
                          <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap min-w-[140px]">
                            {isReady ? (
                              <Button
                                asChild
                                size="sm"
                                className="h-8 rounded-full bg-icesi-blue hover:bg-icesi-blue/90 px-3.5 text-xs font-bold text-white shadow-xs transition-colors"
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
          {viewMode === "kanban" &&
            (isLoading && activeDataset.length === 0 ? (
              <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-icesi-blue border-t-transparent" />
                  <p className="font-medium text-foreground">Cargando tablero...</p>
                </div>
              </div>
            ) : kanbanRequests.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                <div className="mx-auto max-w-sm">
                  {!searchQuery && myRequests.length === 0 ? (
                    <>
                      <p className="font-medium text-foreground">Aún no tienes solicitudes registradas</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Las solicitudes que registres quedarán aquí automáticamente.
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <Button asChild size="sm" className="text-xs bg-icesi-blue hover:bg-icesi-blue/90 text-white">
                          <Link to="/solicitudes/nueva">Crear mi primera solicitud</Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-foreground">No se encontraron solicitudes</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {searchQuery
                          ? "Intenta modificar los términos de búsqueda."
                          : "No hay registros disponibles en este momento."}
                      </p>
                      {searchQuery && (
                        <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="mt-3 text-xs">
                          Limpiar búsqueda
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "grid gap-4 p-4 items-start",
                  isolatedStage ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4",
                )}
              >
                {(isolatedStage ? [isolatedStage] : BOARD_COLUMNS).map((col) => (
                  <KanbanColumn
                    key={col}
                    stage={col}
                    title={KAM_STAGE_LABELS[col]}
                    items={groupedByStatus[col] || []}
                    getKey={(r) => r.id}
                    isolated={!!isolatedStage}
                    onExitIsolation={() => setIsolatedStage(null)}
                    renderItem={(r) => (
                      // Toda tarjeta en "en-costeo" ya pasó por kamStageOf, así que aquí solo
                      // llegan las confirmadas por el Líder — el atajo siempre aplica, igual
                      // que los botones de acción del tablero del Líder de Producto.
                      <RequestCard req={r} cta={col === "en-costeo" ? "Revisar y entregar" : undefined} />
                    )}
                  />
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
