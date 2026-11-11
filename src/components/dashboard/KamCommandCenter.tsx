import React, { useMemo } from "react";
import { Link } from "@/lib/app-router";
import { Plus, Rocket, Search, ArrowRight, X, Building2, LayoutGrid, List, Clock } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequestItem, RequestStatus, formatCop, formatCompactCop, isReadyForKamHandoff } from "@/lib/mock-data";
import { KAM_BOARD_STAGES, KAM_STAGE_LABELS, countByStage, groupByStage, kamStageOf } from "@/lib/board-stages";
import { cn } from "@/lib/utils";
import { IcesiCenefa } from "@/components/IcesiLogo";
import { UrgencyBadge } from "@/components/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { RequestCard } from "@/components/RequestCard";
import { StageKpiCard } from "@/components/kanban/StageKpiCard";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { KanbanBoardSkeleton } from "@/components/dashboard/KanbanBoardSkeleton";
import { BoardMotion } from "@/components/kanban/BoardMotion";
import { AnimatedNumber } from "@/components/kanban/AnimatedNumber";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useRequests } from "@/hooks/use-requests";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { formatCopTotal } from "@/lib/cop-total";
import { formatRelativeTime, mapProposalToRequestItem } from "@/lib/proposal-adapter";
import type { ProposalListItem } from "@/lib/api/requests";
import { fuzzyMatch } from "@/lib/fuzzy";
import { getStageAgeLabel, getTotalAgeLabel } from "@/lib/stage-age";
import { OfficialNumberBadge } from "@/components/OfficialNumberBadge";
import { CommercialStatusChip } from "@/components/CommercialStatusChip";
import { ResentAdjustmentBadge } from "@/components/ResentAdjustmentBadge";
import { AdjustmentFilterSelect, PendingAdjustmentsCounter } from "@/components/dashboard/AdjustmentFilterControls";
import {
  countPendingAdjustments,
  hasPendingAdjustment,
  isAdjustmentFilter,
  matchesAdjustmentFilter,
  type AdjustmentFilter,
} from "@/lib/adjustments";
import {
  COMMERCIAL_STATUS_LABELS,
  COMMERCIAL_STATUS_NONE_THEME,
  COMMERCIAL_STATUS_THEME,
  isCommercialStatus,
  matchesCommercialStatus,
  sumDeliveredValues,
  type CommercialStatusFilter,
} from "@/lib/commercial-status";
import {
  EMPTY_KAM_BOARD_FILTERS,
  deriveKamBoardFilterOptions,
  hasActiveKamBoardFilters,
  matchesKamBoardFilters,
  sanitizeKamBoardFilters,
  type KamBoardFilters as KamBoardFilterValues,
} from "@/lib/kam-board-filters";
import { KamBoardFilters } from "@/components/dashboard/KamBoardFilters";

// Color de la insignia de la tabla por etapa percibida (las mismas 4 etapas del Kanban).
const KAM_STAGE_BADGE: Partial<Record<RequestStatus, { tone: string; dot: string }>> = {
  nueva: {
    tone: "border-icesi-blue/30 bg-icesi-blue/10 text-icesi-blue dark:text-icesi-purple",
    dot: "bg-icesi-blue",
  },
  "en-experto": { tone: "border-icesi-orange/30 bg-icesi-orange/10 text-icesi-orange", dot: "bg-icesi-orange" },
  "en-costeo": { tone: "border-icesi-purple/30 bg-icesi-purple/10 text-icesi-purple", dot: "bg-icesi-purple" },
  entregada: { tone: "border-icesi-green/30 bg-icesi-green/10 text-icesi-green", dot: "bg-icesi-green" },
};

interface KamCommandCenterProps {
  userName: string;
  /** @deprecated Ignored — KamCommandCenter queries proposals directly from React Query */
  requests?: RequestItem[];
}

type FilterType = RequestStatus | "all";

export function KamCommandCenter({ userName, requests }: KamCommandCenterProps) {
  const requestsQuery = useRequests();
  const apiProposals = requestsQuery.data;
  const isLoading = requestsQuery.isLoading && !requests;
  const isError = requestsQuery.isError && !requests;
  const {
    data: apiMetrics,
    isPending: metricsPending,
    isError: metricsError,
    refetch: refetchMetrics,
  } = useDashboardMetrics();

  // Persistido para que el tablero (búsqueda, filtro y vista) siga como lo dejó
  // el KAM al volver del detalle de una propuesta — antes se reiniciaba porque
  // el dashboard se desmonta y remonta en cada navegación. Cada inicio de sesión
  // arranca limpio y en Kanban (resetDashboardUiState en AuthContext).
  const [activeFilter, setActiveFilter] = usePersistentState<FilterType>("icesi_kam_dashboard_filter_v1", "all");
  const [searchQuery, setSearchQuery] = usePersistentState("icesi_kam_dashboard_search_v1", "");
  const [storedCommercialFilter, setCommercialFilter] = usePersistentState<CommercialStatusFilter>(
    "icesi_kam_dashboard_commercial_filter_v1",
    "",
  );
  const [storedAdjustmentFilter, setAdjustmentFilter] = usePersistentState<AdjustmentFilter>(
    "icesi_kam_dashboard_adjustment_filter_v1",
    "",
  );
  const [viewMode, setViewMode] = usePersistentState<"tabla" | "kanban">("icesi_kam_dashboard_view_v1", "kanban");

  const adjustmentFilter: AdjustmentFilter = isAdjustmentFilter(storedAdjustmentFilter) ? storedAdjustmentFilter : "";

  const commercialFilter: CommercialStatusFilter =
    storedCommercialFilter === "none" || isCommercialStatus(storedCommercialFilter) ? storedCommercialFilter : "";

  const firstName = userName ? userName.split(" ")[0] : "Andrea";

  const activeDataset = useMemo(() => {
    let dataset: RequestItem[] = [];
    if (apiProposals && apiProposals.length > 0) {
      dataset = (apiProposals as unknown[]).map((p) => {
        if (
          p &&
          typeof p === "object" &&
          ("workflow" in p ||
            "assignments" in p ||
            ("company" in p && typeof (p as Record<string, unknown>).company === "object"))
        ) {
          return mapProposalToRequestItem(p as ProposalListItem);
        }
        return p as RequestItem;
      });
    } else if (requests && requests.length > 0) {
      dataset = requests;
    }
    if (requests && userName) {
      return dataset.filter((r) => !r.kam || r.kam === userName);
    }
    return dataset;
  }, [apiProposals, requests, userName]);

  const myRequests = activeDataset;
  const canEditCommercialStatus = Boolean(apiProposals);

  // Filtros por líder de producto, empresa y tipo. Se combinan (AND) con la
  // etapa y el buscador, y se guardan igual que ellos. Las opciones salen de
  // las solicitudes cargadas; una selección guardada que ya no existe en los
  // datos se ignora para no dejar un filtro invisible que vacíe el tablero.
  const [storedBoardFilters, setBoardFilters] = usePersistentState<KamBoardFilterValues>(
    "icesi_kam_dashboard_board_filters_v1",
    EMPTY_KAM_BOARD_FILTERS,
  );
  const boardFilterOptions = useMemo(() => deriveKamBoardFilterOptions(activeDataset), [activeDataset]);
  const boardFilters = useMemo(
    () => sanitizeKamBoardFilters(storedBoardFilters, boardFilterOptions),
    [storedBoardFilters, boardFilterOptions],
  );
  const hasBoardFilters = hasActiveKamBoardFilters(boardFilters);
  // Vacía buscador y filtros de líder/empresa/tipo (el filtro de etapa lo
  // limpia aparte la vista Tabla, que es donde oculta filas).
  const clearBoardFilters = () => {
    setSearchQuery("");
    setBoardFilters(EMPTY_KAM_BOARD_FILTERS);
    setCommercialFilter("");
    setAdjustmentFilter("");
  };
  const hasAnyBoardFilter = Boolean(searchQuery.trim() || hasBoardFilters || commercialFilter || adjustmentFilter);
  // El contador de la cabecera cuenta sobre todo el conjunto del KAM, sin aplicar el propio filtro.
  const pendingAdjustmentsCount = countPendingAdjustments(activeDataset);

  // Conteos por etapa percibida por el KAM (ver kamStageOf) — cada uno mapea
  // 1:1 a una columna del Kanban y a una tarjeta KPI, para que nunca se
  // desalineen entre vistas.
  const stageCounts = countByStage(activeDataset, kamStageOf);
  const nuevaCount = stageCounts.nueva;
  const enProcesoCount = stageCounts["en-experto"];
  // "Lista para Entregar" es una promesa concreta ("ya puedes enviarla al
  // cliente"), no solo la etapa "en-costeo" — desde que el Líder de Producto
  // confirma explícitamente el envío (docs/04), una solicitud
  // puede estar en "en-costeo" sin que el KAM tenga nada que hacer todavía.
  // Contar solo las confirmadas evita que este número (y el aviso de abajo)
  // le diga al KAM que puede entregar algo que el Líder aún está costeando.
  const listasParaEntregarCount = stageCounts["en-costeo"];
  const entregadasCount = apiMetrics?.entregadas ?? stageCounts.entregada;
  const deliveredValue = formatCopTotal(apiMetrics?.deliveredValueCop);
  const deliveredValueUnavailable = metricsError || (!metricsPending && deliveredValue === null);

  // Valor financiero acumulado de propuestas listas para entregar (en juego para presentar)
  const listasParaEntregarList = activeDataset.filter((r) => kamStageOf(r) === "en-costeo");
  const listasParaEntregarValue = listasParaEntregarList.reduce(
    (sum, r) => sum + (r.totalCostCop || r.costing?.totalOfferedCop || 0),
    0,
  );

  const entregadasList = activeDataset.filter((r) => r.status === "entregada");
  const fallbackEntregadasValue = entregadasList.reduce(
    (sum, r) => sum + (r.totalCostCop || r.costing?.totalOfferedCop || 0),
    0,
  );
  const displayDeliveredValue =
    deliveredValue !== null
      ? deliveredValue
      : fallbackEntregadasValue > 0
        ? formatCompactCop(fallbackEntregadasValue)
        : null;

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
      (req.code ? req.code.toLowerCase().includes(term) : false) ||
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
      if (!matchesKamBoardFilters(req, boardFilters)) return false;
      if (!matchesCommercialStatus(req, commercialFilter)) return false;
      if (!matchesAdjustmentFilter(req, adjustmentFilter)) return false;
      if (activeFilter !== "all") {
        return kamStageOf(req) === activeFilter;
      }
      return true;
    });
  }, [activeDataset, searchQuery, activeFilter, boardFilters, commercialFilter, adjustmentFilter]);

  // Vista Kanban: la columna ya ES el estado, así que el filtro de estado no debe vaciar el
  // contenido (no aporta nada nuevo) — solo el buscador y los filtros de líder/empresa/tipo, que sí cruzan información que el
  // tablero no muestra por sí solo. El filtro activo solo dispara el "spotlight" (resaltar +
  // scroll a la columna), no oculta nada.
  const kanbanRequests = useMemo(() => {
    return activeDataset.filter((req) => {
      if (searchQuery.trim() && !matchesSearch(req, searchQuery.toLowerCase().trim())) return false;
      if (!matchesKamBoardFilters(req, boardFilters)) return false;
      if (!matchesCommercialStatus(req, commercialFilter)) return false;
      if (!matchesAdjustmentFilter(req, adjustmentFilter)) return false;
      return true;
    });
  }, [activeDataset, searchQuery, boardFilters, commercialFilter, adjustmentFilter]);

  // Agrupación por etapa percibida por el KAM (ver kamStageOf), para la vista
  // Kanban — así la columna "Lista para Entregar" solo contiene tarjetas que
  // de verdad se pueden entregar, y las "en-costeo" aún sin confirmar caen en
  // "En Proceso" junto con las que están con el experto.
  const groupedByStatus = useMemo(() => groupByStage(kanbanRequests, kamStageOf), [kanbanRequests]);

  // En Kanban, las columnas ya son el filtro — la tarjeta KPI en esa vista no
  // oculta nada (no aportaba valor, ver docs), sino que "aísla" esa columna a
  // pantalla completa para revisar más tarjetas cómodamente sin salir del
  // Kanban. Es un estado de enfoque, no un filtro de datos.
  const [isolatedStage, setIsolatedStage] = usePersistentState<RequestStatus | null>(
    "icesi_kam_dashboard_isolated_v1",
    null,
  );

  const visibleRequests =
    viewMode === "tabla"
      ? filteredRequests
      : isolatedStage
        ? kanbanRequests.filter((request) => kamStageOf(request) === isolatedStage)
        : kanbanRequests;
  // Filtros que estrechan lo visible además de la etiqueta comercial. La etiqueta
  // comercial reescribe la cabecera de la columna Entregada; el resto de filtros
  // solo se resume en el aviso de abajo (la cabecera sigue siendo el total bruto).
  const hasOtherVisibleFilters = Boolean(
    searchQuery.trim() || hasBoardFilters || (viewMode === "tabla" ? activeFilter !== "all" : isolatedStage),
  );
  const visibleDeliveredCount = visibleRequests.filter((request) => request.status === "entregada").length;
  const visibleDeliveredValue = formatCopTotal(sumDeliveredValues(visibleRequests) ?? undefined);
  // Cabecera de Entregada con la etiqueta comercial o el filtro de ajustes activos: solo el
  // conjunto filtrado (conteo y suma exacta en BigInt vía sumDeliveredValues).
  const deliveredHeaderFiltered = Boolean(commercialFilter || adjustmentFilter);
  const deliveredMatches = deliveredHeaderFiltered
    ? activeDataset.filter(
        (request) =>
          request.status === "entregada" &&
          matchesCommercialStatus(request, commercialFilter) &&
          matchesAdjustmentFilter(request, adjustmentFilter),
      )
    : [];
  const deliveredMatchesValue = formatCopTotal(sumDeliveredValues(deliveredMatches) ?? undefined);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <KanbanBoardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <section className="mx-auto max-w-xl py-16 text-center">
        <p className="text-sm font-medium text-destructive">No se pudo cargar el tablero de solicitudes.</p>
        <button
          type="button"
          className="mt-3 text-xs font-semibold text-primary hover:underline cursor-pointer"
          onClick={() => void requestsQuery.refetch()}
        >
          Reintentar
        </button>
      </section>
    );
  }

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
            <Link href="/solicitudes/nueva" className="inline-flex items-center gap-2">
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
                {misListasParaEntregarCount === 1
                  ? "propuesta lista para presentar"
                  : "propuestas listas para presentar"}
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
          <strong className="font-bold text-foreground">
            <AnimatedNumber value={totalCount} />
          </strong>{" "}
          solicitudes en total
        </span>
        <span className="text-border dark:text-icesi-border">·</span>
        <span>
          <strong className="font-bold text-foreground">{formatCompactCop(pipelineTotal)}</strong> en pipeline cotizado
        </span>
        <PendingAdjustmentsCounter
          count={pendingAdjustmentsCount}
          filter={adjustmentFilter}
          onChange={setAdjustmentFilter}
        />
      </div>

      {deliveredValueUnavailable && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
          <span>No se pudo cargar el valor total de las propuestas presentadas.</span>
          <button type="button" className="font-semibold underline" onClick={() => void refetchMetrics()}>
            Reintentar total
          </button>
        </div>
      )}

      {/* 2. TARJETAS DE MÉTRICAS INTERACTIVAS — cada una mapea 1:1 a una etapa
          real del pipeline, igual que el Kanban. En Tabla filtran (ocultan
          filas); en Kanban aíslan esa columna a pantalla completa. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StageKpiCard
          stage="nueva"
          label={KAM_STAGE_LABELS.nueva}
          count={nuevaCount}
          hint="Entregadas al líder, aún sin docente asignado"
          activeHint={viewMode === "tabla" ? "✓ Filtro activo" : "✓ Aislada en el tablero"}
          active={viewMode === "tabla" ? activeFilter === "nueva" : isolatedStage === "nueva"}
          onClick={() => handleCardClick("nueva")}
        />
        <StageKpiCard
          stage="en-experto"
          label={KAM_STAGE_LABELS["en-experto"]}
          count={enProcesoCount}
          hint="El Líder ya la trabaja con docente asignado"
          activeHint={viewMode === "tabla" ? "✓ Filtro activo" : "✓ Aislada en el tablero"}
          active={viewMode === "tabla" ? activeFilter === "en-experto" : isolatedStage === "en-experto"}
          onClick={() => handleCardClick("en-experto")}
        />
        <StageKpiCard
          stage="en-costeo"
          label={KAM_STAGE_LABELS["en-costeo"]}
          count={listasParaEntregarCount}
          hint="Costeo listo para presentar al cliente"
          secondaryLine={
            listasParaEntregarValue > 0 ? (
              <span className="font-semibold text-foreground">
                {formatCompactCop(listasParaEntregarValue)} por entregar
              </span>
            ) : undefined
          }
          activeHint={viewMode === "tabla" ? "✓ Filtro activo" : "✓ Aislada en el tablero"}
          active={viewMode === "tabla" ? activeFilter === "en-costeo" : isolatedStage === "en-costeo"}
          onClick={() => handleCardClick("en-costeo")}
        />
        <StageKpiCard
          stage="entregada"
          label={KAM_STAGE_LABELS.entregada}
          count={deliveredHeaderFiltered ? deliveredMatches.length : entregadasCount}
          hint="Propuestas presentadas al cliente"
          secondaryLine={
            deliveredHeaderFiltered ? (
              <span className="font-semibold text-foreground">
                Filtradas: {deliveredMatches.length} de {entregadasCount} · {deliveredMatchesValue ?? "No disponible"}
              </span>
            ) : displayDeliveredValue !== null ? (
              <span className="font-semibold text-foreground">{displayDeliveredValue} total entregado</span>
            ) : deliveredValueUnavailable ? (
              "Total no disponible"
            ) : (
              "Calculando total..."
            )
          }
          activeHint={viewMode === "tabla" ? "✓ Filtro activo" : "✓ Aislada en el tablero"}
          active={viewMode === "tabla" ? activeFilter === "entregada" : isolatedStage === "entregada"}
          onClick={() => handleCardClick("entregada")}
        />
      </div>

      {hasOtherVisibleFilters && (
        <div role="status" className="rounded-lg border border-border bg-secondary/20 p-3 text-xs text-foreground">
          <p>
            {visibleDeliveredCount}{" "}
            {visibleDeliveredCount === 1 ? "propuesta entregada visible" : "propuestas entregadas visibles"} · Total
            visible: {visibleDeliveredValue ?? "No disponible"}
          </p>
          {!deliveredHeaderFiltered && (
            <p className="mt-1 text-muted-foreground">
              El total entregado superior conserva el volumen bruto de toda tu cartera.
            </p>
          )}
        </div>
      )}

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
          <div className="space-y-3 border-b border-border dark:border-icesi-border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

            {activeDataset.length > 0 && (
              <KamBoardFilters
                filters={boardFilters}
                options={boardFilterOptions}
                onChange={setBoardFilters}
                onClear={() => setBoardFilters(EMPTY_KAM_BOARD_FILTERS)}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <label htmlFor="commercial-filter" className="text-xs font-medium text-foreground">
              Seguimiento comercial
            </label>
            <span
              aria-hidden="true"
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                isCommercialStatus(commercialFilter)
                  ? COMMERCIAL_STATUS_THEME[commercialFilter].dot
                  : commercialFilter === "none"
                    ? COMMERCIAL_STATUS_NONE_THEME.dot
                    : "bg-transparent",
              )}
            />
            <select
              id="commercial-filter"
              aria-label="Filtrar por etiqueta comercial"
              value={commercialFilter}
              onChange={(event) => {
                const value = event.target.value;
                setCommercialFilter(value === "none" || isCommercialStatus(value) ? value : "");
              }}
              className="min-w-0 max-w-full rounded-md border border-input bg-background px-2 py-2 text-xs text-foreground"
            >
              <option value="">Todas las etiquetas</option>
              <option value="none">Sin etiqueta</option>
              {Object.entries(COMMERCIAL_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {commercialFilter && (
              <button
                type="button"
                className="text-xs underline text-muted-foreground"
                onClick={() => setCommercialFilter("")}
              >
                Quitar etiqueta
              </button>
            )}
            <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-border sm:inline-block" />
            <AdjustmentFilterSelect value={adjustmentFilter} onChange={setAdjustmentFilter} />
            <ul
              aria-label="Leyenda de colores del seguimiento comercial"
              className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:ml-auto"
            >
              {(Object.keys(COMMERCIAL_STATUS_LABELS) as Array<keyof typeof COMMERCIAL_STATUS_LABELS>).map((value) => (
                <li key={value} className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn("h-1.5 w-1.5 rounded-full", COMMERCIAL_STATUS_THEME[value].dot)}
                  />
                  {COMMERCIAL_STATUS_LABELS[value]}
                </li>
              ))}
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", COMMERCIAL_STATUS_NONE_THEME.dot)} />
                Sin etiqueta
              </li>
            </ul>
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
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        <div className="mx-auto max-w-sm">
                          {!hasAnyBoardFilter && activeFilter === "all" && myRequests.length === 0 ? (
                            <>
                              <p className="font-medium text-foreground">
                                No tienes solicitudes en tu cartera comercial actualmente
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Las solicitudes que registres quedarán aquí automáticamente.
                              </p>
                              <div className="mt-3 flex items-center justify-center gap-2">
                                <Button
                                  asChild
                                  size="sm"
                                  className="text-xs bg-icesi-blue hover:bg-icesi-blue/90 text-white"
                                >
                                  <Link href="/solicitudes/nueva">Crear mi primera solicitud</Link>
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-foreground">No se encontraron solicitudes</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {hasAnyBoardFilter || activeFilter !== "all"
                                  ? "Intenta modificar los términos de búsqueda o limpiar los filtros seleccionados."
                                  : "No hay registros disponibles en este momento."}
                              </p>
                              {(hasAnyBoardFilter || activeFilter !== "all") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    clearBoardFilters();
                                    setActiveFilter("all");
                                  }}
                                  className="mt-3 text-xs"
                                >
                                  Limpiar filtros
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
                      const relativeTime = formatRelativeTime(r.createdAt);
                      const kamStage = kamStageOf(r);
                      const stageAgeLabel = getStageAgeLabel(r, kamStage);
                      const totalAgeLabel = getTotalAgeLabel(r);
                      const offeredValueLabel =
                        r.status === "entregada"
                          ? formatCopTotal(r.deliveredValueCop ?? undefined)
                          : r.totalCostCop || r.costing?.totalOfferedCop
                            ? formatCop(r.totalCostCop || r.costing?.totalOfferedCop || 0)
                            : null;

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
                              <span className="font-mono text-xs font-semibold text-foreground">{r.code ?? r.id}</span>
                              <OfficialNumberBadge officialNumber={r.officialNumber} />
                              <span className="text-muted-foreground/60 text-xs">·</span>
                              <span className="text-xs text-muted-foreground">{relativeTime}</span>
                            </div>
                          </td>

                          {/* 2. Propuesta y Empresa */}
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex flex-col gap-1 max-w-[320px]">
                              <Link
                                href={`/solicitudes/${r.id}`}
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
                            ) : offeredValueLabel !== null ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground text-xs sm:text-sm tracking-tight">
                                  {offeredValueLabel}
                                </span>
                                {isReady && (
                                  <span className="text-[10px] text-icesi-green font-medium">Costeo aprobado</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs italic text-muted-foreground">
                                {r.status === "entregada" ? "Valor entregado no disponible" : "- Pendiente de costeo -"}
                              </span>
                            )}
                          </td>

                          {/* 5. Estado — misma etapa, etiqueta y color que el Kanban (kamStageOf) */}
                          <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                            {KAM_STAGE_BADGE[kamStage] && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                  KAM_STAGE_BADGE[kamStage].tone,
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    KAM_STAGE_BADGE[kamStage].dot,
                                    kamStage === "en-experto" && "animate-pulse",
                                  )}
                                />
                                {KAM_STAGE_LABELS[kamStage]}
                              </span>
                            )}
                            {r.status === "entregada" && (
                              <div className="mt-1">
                                <CommercialStatusChip
                                  proposalId={r.id}
                                  status={r.commercialStatus}
                                  canEdit={canEditCommercialStatus}
                                />
                              </div>
                            )}
                            {hasPendingAdjustment(r) && (
                              <p className="mt-1 text-[10px] font-semibold text-icesi-orange">Sustentación y ajustes</p>
                            )}
                            {r.status === "entregada" && <ResentAdjustmentBadge req={r} className="mt-1" />}
                            {stageAgeLabel && (
                              <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3 shrink-0" />
                                {stageAgeLabel}
                              </p>
                            )}
                            {totalAgeLabel && (
                              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3 shrink-0" />
                                {totalAgeLabel}
                              </p>
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
                                <Link href={`/solicitudes/${r.id}`}>
                                  <span>Ver propuesta</span>
                                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            ) : (
                              <Link
                                href={`/solicitudes/${r.id}`}
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
                <div role="status" className="flex flex-col items-center justify-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-icesi-blue border-t-transparent" />
                  <p className="font-medium text-foreground">Cargando tablero...</p>
                </div>
              </div>
            ) : kanbanRequests.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                <div className="mx-auto max-w-sm">
                  {!hasAnyBoardFilter && myRequests.length === 0 ? (
                    <>
                      <p className="font-medium text-foreground">
                        No tienes solicitudes en tu cartera comercial actualmente
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Las solicitudes que registres quedarán aquí automáticamente.
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <Button asChild size="sm" className="text-xs bg-icesi-blue hover:bg-icesi-blue/90 text-white">
                          <Link href="/solicitudes/nueva">Crear mi primera solicitud</Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-foreground">No se encontraron solicitudes</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {hasAnyBoardFilter
                          ? "Intenta modificar los términos de búsqueda o limpiar los filtros seleccionados."
                          : "No hay registros disponibles en este momento."}
                      </p>
                      {hasAnyBoardFilter && (
                        <Button variant="outline" size="sm" onClick={clearBoardFilters} className="mt-3 text-xs">
                          Limpiar filtros
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <BoardMotion
                layoutKey={[
                  isolatedStage ?? "",
                  searchQuery,
                  JSON.stringify(boardFilters),
                  commercialFilter,
                  adjustmentFilter,
                ].join("|")}
              >
                <div
                  className={cn(
                    "grid gap-4 p-4 items-start",
                    isolatedStage ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4",
                  )}
                >
                  {(isolatedStage ? [isolatedStage] : KAM_BOARD_STAGES).map((col) => (
                    <KanbanColumn
                      key={col}
                      stage={col}
                      title={KAM_STAGE_LABELS[col]}
                      items={groupedByStatus[col] || []}
                      getKey={(r) => r.id}
                      isolated={!!isolatedStage}
                      onExitIsolation={() => setIsolatedStage(null)}
                      onHeaderClick={() => handleCardClick(col)}
                      renderItem={(r) => (
                        // Toda tarjeta en "en-costeo" ya pasó por kamStageOf, así que aquí solo
                        // llegan las confirmadas por el Líder — el atajo siempre aplica, igual
                        // que los botones de acción del tablero del Líder de Producto.
                        <RequestCard
                          req={r}
                          stage={col}
                          canEditCommercialStatus={canEditCommercialStatus}
                          cta={col === "en-costeo" ? "Revisar y presentar" : undefined}
                        />
                      )}
                    />
                  ))}
                </div>
              </BoardMotion>
            ))}
        </div>
      </div>
    </div>
  );
}
