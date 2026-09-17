import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  UserCheck,
  Sparkles,
  ArrowLeftRight,
  Building2,
  Search,
  AlertCircle,
  Calendar,
  ChevronRight,
  List,
  LayoutGrid,
  Check,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, UrgencyBadge } from "@/components/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { StageKpiCard } from "@/components/kanban/StageKpiCard";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { usePersistentState } from "@/hooks/use-persistent-state";
import {
  PRODUCT_LEADERS,
  NODES,
  NODE_DEFAULT_LEADERS,
  formatCop,
  formatCompactCop,
  type RequestItem,
  type RequestStatus,
} from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";

interface ProductLeaderDashboardProps {
  requests: RequestItem[];
  user: { name: string; email: string; roleLabel: string };
  updateRequest: (id: string, patch: Partial<RequestItem>) => void;
  updateStatus: (id: string, status: RequestStatus) => void;
}

// Fecha límite en la tarjeta del Kanban: además de la fecha, el color avisa
// si ya venció o está por vencer, para que el Líder priorice sin abrir el
// detalle. No aplica a "Entregada" (el compromiso de fecha ya se cumplió).
function getDeadlineDisplay(
  deadline: string | undefined,
  status: RequestStatus,
): { text: string; className: string } | null {
  if (!deadline || status === "entregada") return null;
  const days = differenceInCalendarDays(new Date(deadline), new Date());
  const formatted = format(new Date(deadline), "d MMM", { locale: es });
  if (days < 0) {
    return { text: `Venció: ${formatted}`, className: "font-bold text-red-600 dark:text-red-400" };
  }
  if (days <= 3) {
    return { text: `Vence: ${formatted}`, className: "font-bold text-[#e9683b]" };
  }
  return { text: `Vence: ${formatted}`, className: "text-muted-foreground" };
}

const KANBAN_STAGES: {
  id: RequestStatus;
  title: string;
  description: string;
}[] = [
  {
    id: "nueva",
    title: "Nueva",
    description: "Pendientes por revisar alcance y asignar docente de planta o externo",
  },
  {
    id: "en-experto",
    title: "En proceso por experto",
    description: "Docente formulando temática, cronograma y propuesta técnica",
  },
  {
    id: "en-costeo",
    title: "En proceso de costeo",
    description: "Simulación financiera, tarifas y cálculo de margen antes de entrega",
  },
  {
    id: "entregada",
    title: "Entregada",
    description: "Propuestas culminadas y entregadas a la empresa o KAM comercial",
  },
];

export function ProductLeaderDashboard({ requests, user, updateRequest, updateStatus }: ProductLeaderDashboardProps) {
  // Filter states
  // Persistido para que el tablero (búsqueda, filtro y vista) siga como lo dejó
  // el Líder de Producto al volver del detalle de una propuesta — antes se
  // reiniciaba porque el dashboard se desmonta y remonta en cada navegación.
  const [searchQuery, setSearchQuery] = usePersistentState("icesi_lp_dashboard_search_v1", "");
  const [activeStageFilter, setActiveStageFilter] = usePersistentState<RequestStatus | "todas">(
    "icesi_lp_dashboard_filter_v1",
    "todas",
  );
  const [onlyMissingProfessor, setOnlyMissingProfessor] = usePersistentState(
    "icesi_lp_dashboard_sin_docente_v1",
    false,
  );
  const [viewMode, setViewMode] = usePersistentState<"kanban" | "tabla">("icesi_lp_dashboard_view_v1", "kanban");

  // En Kanban, las columnas ya son el filtro — la tarjeta KPI en esa vista no
  // oculta nada, sino que "aísla" esa columna a pantalla completa para revisar
  // más tarjetas cómodamente sin salir del Kanban.
  const [isolatedStage, setIsolatedStage] = usePersistentState<RequestStatus | null>(
    "icesi_lp_dashboard_isolated_v1",
    null,
  );

  const handleStageKpiClick = (stage: RequestStatus) => {
    if (viewMode === "tabla") {
      setActiveStageFilter((prev) => (prev === stage ? "todas" : stage));
    } else {
      setIsolatedStage((prev) => (prev === stage ? null : stage));
    }
  };

  // Reassignment Modal State
  const [reassigningRequest, setReassigningRequest] = useState<RequestItem | null>(null);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string>("");
  const [selectedNewNode, setSelectedNewNode] = useState<string>("");
  const [reassignReason, setReassignReason] = useState<string>("Temática no afín / Corresponde a otro nodo");
  const [reassignNotes, setReassignNotes] = useState<string>("");

  const handleOpenReassign = (r: RequestItem) => {
    setReassigningRequest(r);
    setSelectedNewLeader("");
    setSelectedNewNode(r.node);
    setReassignReason("Temática no afín / Corresponde a otro nodo");
    setReassignNotes("");
  };

  const handleConfirmReassign = () => {
    if (!reassigningRequest || !selectedNewLeader) return;
    const targetLeader = selectedNewLeader;
    const targetNode = selectedNewNode || reassigningRequest.node;

    updateRequest(reassigningRequest.id, {
      productLeader: targetLeader,
      node: targetNode,
    });

    toast.success(`Solicitud ${reassigningRequest.id} transferida a ${targetLeader}.`);
    setReassigningRequest(null);
  };

  // Avanzar de etapa es irreversible desde la UI (no hay botón para "devolver"
  // una solicitud a la fase anterior) y las tarjetas del Kanban van densas,
  // con varios botones pegados — un clic de más ahí mueve la solicitud sin
  // querer. Por eso se confirma explícitamente antes de ejecutar, con los
  // datos concretos de la solicitud a la vista (no solo un texto genérico).
  const [confirmingAdvance, setConfirmingAdvance] = useState<{
    reqId: string;
    company: string;
    title: string;
    from: "nueva" | "en-experto";
  } | null>(null);

  const ADVANCE_META: Record<
    "nueva" | "en-experto",
    { nextLabel: string; nextStatus: RequestStatus; successMsg: string }
  > = {
    nueva: {
      nextLabel: "En proceso por experto",
      nextStatus: "en-experto",
      successMsg: "Solicitud avanzada a: En proceso por experto",
    },
    "en-experto": {
      nextLabel: "En proceso de costeo",
      nextStatus: "en-costeo",
      successMsg: "Solicitud avanzada a: En proceso de costeo",
    },
  };

  const handleConfirmAdvance = () => {
    if (!confirmingAdvance) return;
    const meta = ADVANCE_META[confirmingAdvance.from];
    updateStatus(confirmingAdvance.reqId, meta.nextStatus);
    toast.success(meta.successMsg);
    setConfirmingAdvance(null);
  };

  // El Líder de Producto solo trabaja sus propias solicitudes — sin toggle a "Todas".
  const activeDataset = requests.filter((r) => r.productLeader === user.name);

  const countNuevas = activeDataset.filter((r) => r.status === "nueva").length;
  const countEnExperto = activeDataset.filter((r) => r.status === "en-experto").length;
  const countEnCosteo = activeDataset.filter((r) => r.status === "en-costeo").length;
  const entregadasList = activeDataset.filter((r) => r.status === "entregada");
  const countEntregadas = entregadasList.length;
  const entregadasValue = entregadasList.reduce(
    (sum, r) => sum + (r.totalCostCop || r.costing?.totalOfferedCop || 0),
    0,
  );

  const sinDocenteCount = activeDataset.filter((r) => !r.professor && r.status !== "entregada").length;

  // Métricas agregadas (no son una etapa del pipeline) — mismo cálculo que ya
  // usa el KAM, para que ambos tableros hablen del pipeline en los mismos términos.
  const totalCount = activeDataset.length;
  const pipelineTotal = activeDataset
    .filter((r) => r.status === "en-costeo" || r.status === "entregada")
    .reduce((sum, r) => sum + (r.totalCostCop || r.costing?.totalOfferedCop || 0), 0);

  // Vista Tabla: el estado sí oculta filas — ahí aporta valor real (reduce una lista larga).
  const filteredRequests = useMemo(() => {
    return activeDataset.filter((r) => {
      if (activeStageFilter !== "todas" && r.status !== activeStageFilter) return false;
      if (onlyMissingProfessor && (r.professor || r.status === "entregada")) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          r.id.toLowerCase().includes(q) ||
          r.company.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          (r.professor && r.professor.toLowerCase().includes(q)) ||
          r.productLeader.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [activeDataset, activeStageFilter, onlyMissingProfessor, searchQuery]);

  // Vista Kanban: la columna ya ES el estado, así que el filtro de estado no debe vaciar el
  // contenido (no aporta nada nuevo) — solo aplican los filtros que sí cruzan información
  // que el tablero no muestra por sí solo (buscador, "sin docente"). El estado activo solo
  // se usa para el "spotlight" (resaltar + hacer scroll a la columna), no para ocultar nada.
  const kanbanRequests = useMemo(() => {
    return activeDataset.filter((r) => {
      if (onlyMissingProfessor && (r.professor || r.status === "entregada")) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          r.id.toLowerCase().includes(q) ||
          r.company.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          (r.professor && r.professor.toLowerCase().includes(q)) ||
          r.productLeader.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [activeDataset, onlyMissingProfessor, searchQuery]);

  // Group by status for the single unified Kanban
  const groupedRequests = useMemo(() => {
    const grouped: Record<RequestStatus, RequestItem[]> = {
      nueva: [],
      "en-experto": [],
      "en-costeo": [],
      entregada: [],
    };
    kanbanRequests.forEach((req) => {
      if (grouped[req.status]) {
        grouped[req.status].push(req);
      }
    });
    return grouped;
  }, [kanbanRequests]);

  const firstName = user.name ? user.name.split(" ")[0] : "";

  return (
    <div className="space-y-6">
      {/* 1. Header with clear context and zero noise */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Hola, {firstName}
            </h1>
            <RoleBadge label="Líder de Producto" />
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Gestión directa de tus solicitudes: asignación de docentes, avance técnico y costeo en un único lugar.
          </p>
        </div>
      </div>

      {/* Aviso contextual si hay solicitudes nuevas enviadas por los KAM,
          esperando revisión de alcance y asignación de docente. */}
      {countNuevas > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#5454e9]/30 bg-[#5454e9]/10 dark:bg-[#5454e9]/15 p-4 text-foreground shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5 sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5454e9] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                ¡Tienes {countNuevas}{" "}
                {countNuevas === 1 ? "solicitud nueva por revisar" : "solicitudes nuevas por revisar"}!
              </p>
              <p className="text-xs text-muted-foreground">
                Los KAM enviaron nuevas propuestas — revisa el alcance y asigna un docente de planta o externo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleStageKpiClick("nueva")}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 rounded-lg bg-[#5454e9] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#4343d3]"
          >
            Ver nuevas
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Dato agregado secundario — mismo formato que ya usa el KAM. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-0.5 text-xs text-muted-foreground">
        <span>
          <strong className="font-bold text-foreground">{totalCount}</strong> solicitudes en total
        </span>
        <span className="text-border dark:text-[#252838]">·</span>
        <span>
          <strong className="font-bold text-foreground">{formatCompactCop(pipelineTotal)}</strong> en pipeline cotizado
        </span>
      </div>

      {/* 2. Interactive Stages / KPIs Bar with Official Icesi Colors */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StageKpiCard
          stage="nueva"
          label="1. Nuevas"
          count={countNuevas}
          hint="Por asignar docente"
          activeHint={viewMode === "tabla" ? "✓ Filtro activo" : "✓ Aislada en el tablero"}
          active={viewMode === "tabla" ? activeStageFilter === "nueva" : isolatedStage === "nueva"}
          onClick={() => handleStageKpiClick("nueva")}
        />
        <StageKpiCard
          stage="en-experto"
          label="2. En Experto"
          count={countEnExperto}
          hint="En diseño académico"
          activeHint={viewMode === "tabla" ? "✓ Filtro activo" : "✓ Aislada en el tablero"}
          active={viewMode === "tabla" ? activeStageFilter === "en-experto" : isolatedStage === "en-experto"}
          onClick={() => handleStageKpiClick("en-experto")}
        />
        <StageKpiCard
          stage="en-costeo"
          label="3. En Costeo"
          count={countEnCosteo}
          hint="Simulación y márgenes"
          activeHint={viewMode === "tabla" ? "✓ Filtro activo" : "✓ Aislada en el tablero"}
          active={viewMode === "tabla" ? activeStageFilter === "en-costeo" : isolatedStage === "en-costeo"}
          onClick={() => handleStageKpiClick("en-costeo")}
        />
        <StageKpiCard
          stage="entregada"
          label="4. Entregadas"
          count={countEntregadas}
          hint="Sin propuestas entregadas aún"
          secondaryLine={
            <span className="font-semibold text-[#4cb979]">
              {formatCompactCop(entregadasValue)} en valor real aprobado
            </span>
          }
          active={viewMode === "tabla" ? activeStageFilter === "entregada" : isolatedStage === "entregada"}
          onClick={() => handleStageKpiClick("entregada")}
        />
      </div>

      {/* 3. Search Bar and Filter reset */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por empresa, código, docente..."
            className="pl-8 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setOnlyMissingProfessor((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors",
              onlyMissingProfessor
                ? "border-[#e9683b] bg-[#e9683b] text-white"
                : "border-border bg-secondary/50 text-foreground hover:bg-secondary",
            )}
            title="Mostrar solo solicitudes sin docente asignado"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Sin docente ({sinDocenteCount})
          </button>
          {viewMode === "tabla" && activeStageFilter !== "todas" && (
            <button
              type="button"
              onClick={() => setActiveStageFilter("todas")}
              className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary cursor-pointer"
            >
              Mostrar todas las fases
            </button>
          )}
          {viewMode === "kanban" && isolatedStage && (
            <button
              type="button"
              onClick={() => setIsolatedStage(null)}
              className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary cursor-pointer"
            >
              Ver las 4 fases
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            {viewMode === "kanban" ? kanbanRequests.length : filteredRequests.length} solicitudes visibles
          </span>

          <div className="flex items-center gap-0.5 rounded-lg border border-border dark:border-[#2b2d3d] p-0.5 bg-card dark:bg-[#141622]">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "kanban" ? "bg-[#5454e9] text-white" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Vista kanban"
              title="Vista kanban por estado"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tabla")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "tabla" ? "bg-[#5454e9] text-white" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Vista tabla"
              title="Vista tabla"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Unified Board: The 4 Columns for the Product Leader */}
      {viewMode === "kanban" && (
        <>
          {/* Si "Sin docente" o el buscador dejan las 4 columnas vacías, decirlo
          explícitamente — antes las 4 columnas se veían vacías sin ninguna
          pista de que había un filtro activo escondiéndolo todo. */}
          {kanbanRequests.length === 0 && activeDataset.length > 0 && (
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-6 text-center text-sm">
              <p className="font-medium text-foreground">
                {onlyMissingProfessor
                  ? "Ninguna de tus solicitudes activas está sin docente en este momento."
                  : "No se encontraron solicitudes con esta búsqueda."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {onlyMissingProfessor
                  ? 'El filtro "Sin docente" excluye además las que ya están Entregadas.'
                  : "Intenta con otro término de búsqueda."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOnlyMissingProfessor(false);
                  setSearchQuery("");
                }}
                className="mt-3 text-xs"
              >
                Quitar filtros
              </Button>
            </div>
          )}
          <div className={cn("grid gap-4 items-start", isolatedStage ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-4")}>
            {(isolatedStage ? KANBAN_STAGES.filter((s) => s.id === isolatedStage) : KANBAN_STAGES).map((stage) => {
              const stageItems = groupedRequests[stage.id];

              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage.id}
                  title={stage.title}
                  description={stage.description}
                  items={stageItems}
                  getKey={(req) => req.id}
                  isolated={!!isolatedStage}
                  onExitIsolation={() => setIsolatedStage(null)}
                  renderItem={(req) => {
                    const hasRealCosting = req.costing && req.costing.totalOfferedCop > 0;
                    const deadlineInfo = getDeadlineDisplay(req.deadline, req.status);
                    const stageAge = formatDistanceToNow(new Date(req.statusUpdatedAt ?? req.createdAt), {
                      addSuffix: true,
                      locale: es,
                    });

                    return (
                      <div className="group relative rounded-lg border border-border dark:border-[#252838] bg-card dark:bg-[#161824] shadow-2xs hover:shadow-md transition-all hover:border-[#5454e9]/40 overflow-hidden">
                        {/* Alerta prioritaria: el cliente pidió ajustes — es la señal
                      más urgente que puede tener una tarjeta, va antes que
                      cualquier otra cosa (docs/08, pregunta 13). */}
                        {req.clientObservations && (
                          <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/40 border-b border-amber-300/60 dark:border-amber-900/50 px-3 py-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              Cliente pidió ajustes
                            </span>
                          </div>
                        )}

                        {/* Área informativa: toda la tarjeta (menos los botones de acción) lleva al detalle */}
                        <Link to={`/solicitudes/${req.id}`} className="block p-3.5">
                          {/* Top: ID, Company & Urgency */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] font-bold text-foreground">{req.id}</span>
                                <span className="text-muted-foreground/60 text-[10px]">•</span>
                                <span className="text-[11px] font-medium text-foreground truncate max-w-[120px]">
                                  {req.company}
                                </span>
                              </div>
                              <p className="mt-1 font-sans font-bold text-xs leading-snug text-foreground group-hover:text-[#5454e9] transition-colors line-clamp-2">
                                {req.title}
                              </p>
                            </div>
                            <UrgencyBadge urgency={req.urgency} />
                          </div>

                          {/* Middle: Type + Valor cotizado (si ya hay costeo real) */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {req.type}
                            </span>
                            {hasRealCosting && (
                              <span className="font-mono text-[11px] font-bold text-[#4cb979]">
                                {formatCop(req.costing!.totalOfferedCop)}
                              </span>
                            )}
                          </div>

                          {/* Docente / Profesor status */}
                          <div className="mt-2.5 border-t border-border dark:border-[#222434] pt-2 flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground font-medium">Docente:</span>
                            {req.professor ? (
                              <span className="font-semibold text-foreground truncate max-w-[130px]">
                                {req.professor}
                              </span>
                            ) : (
                              <span className="rounded bg-[#e9683b]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#e9683b]">
                                Sin docente
                              </span>
                            )}
                          </div>

                          {/* Antigüedad en la fase actual — ayuda a detectar cuellos de botella */}
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>En esta fase {stageAge}</span>
                          </div>
                        </Link>

                        {/* Footer: Date & Direct Actions — fuera del área de navegación */}
                        <div className="px-3.5 pb-3.5">
                          <div className="mt-3 pt-2 border-t border-border dark:border-[#222434] flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground min-w-0">
                              <span className="flex items-center gap-1 shrink-0">
                                <Calendar className="h-3 w-3 shrink-0" />
                                {format(new Date(req.createdAt), "d MMM", { locale: es })}
                              </span>
                              {deadlineInfo && (
                                <span className={cn("truncate", deadlineInfo.className)}>{deadlineInfo.text}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Reasignar solo mientras nadie ha empezado a trabajar la solicitud */}
                              {req.status === "nueva" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReassign(req)}
                                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                  title="Reasignar a otro líder de producto"
                                >
                                  <ArrowLeftRight className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {/* Status Advancement Button — requiere docente asignado y confirmación */}
                              {stage.id === "nueva" && (
                                <Button
                                  size="sm"
                                  disabled={!req.professor}
                                  onClick={() =>
                                    setConfirmingAdvance({
                                      reqId: req.id,
                                      company: req.company,
                                      title: req.title,
                                      from: "nueva",
                                    })
                                  }
                                  className="h-7 px-2 text-[10px] font-bold bg-icesi-blue hover:bg-[#4343d0] text-white shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                                  title={req.professor ? "Avanzar a En Experto" : "Asigna un docente antes de avanzar"}
                                >
                                  Pasar a Experto
                                  <ChevronRight className="h-3 w-3 ml-0.5" />
                                </Button>
                              )}

                              {stage.id === "en-experto" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setConfirmingAdvance({
                                      reqId: req.id,
                                      company: req.company,
                                      title: req.title,
                                      from: "en-experto",
                                    })
                                  }
                                  className="h-7 px-2 text-[10px] font-bold bg-icesi-blue hover:bg-[#4343d0] text-white shadow-2xs"
                                  title="Avanzar a En Costeo"
                                >
                                  Pasar a Costeo
                                  <ChevronRight className="h-3 w-3 ml-0.5" />
                                </Button>
                              )}

                              {/* "Entregar" (enviar al cliente) es una acción exclusiva del KAM,
                            no del Líder de Producto — el trabajo del Líder termina en dejar
                            el costeo listo (docs/08, pregunta 13). Por eso aquí solo se
                            invita a completar el costeo, o se confirma que ya quedó listo. */}
                              {stage.id === "en-costeo" && !hasRealCosting && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-7 px-2 text-[10px] font-bold bg-icesi-blue hover:bg-[#4343d0] text-white shadow-2xs"
                                >
                                  <Link to={`/solicitudes/${req.id}`} title="Completar el costeo de esta propuesta">
                                    Completar costeo
                                    <ArrowRight className="h-3 w-3 ml-0.5" />
                                  </Link>
                                </Button>
                              )}
                              {stage.id === "en-costeo" && hasRealCosting && (
                                <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold text-[#4cb979]">
                                  <Check className="h-3 w-3" /> Listo para el KAM
                                </span>
                              )}

                              {/* Llegar a "Entregada" solo ocurre cuando el KAM la envía al
                            cliente (acción exclusiva suya, ver comentario arriba) — así
                            que toda tarjeta en esta columna ya cerró ese paso. */}
                              {stage.id === "entregada" && (
                                <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold text-[#4cb979]">
                                  <Check className="h-3 w-3" /> Enviado al cliente
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              );
            })}
          </div>
        </>
      )}

      {/* 4b. Vista de tabla: escaneo rápido de todas las solicitudes visibles */}
      {viewMode === "tabla" && (
        <div className="rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead className="border-b border-border dark:border-[#252838] bg-secondary/40 dark:bg-[#12131d] text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ID y Fecha</th>
                  <th className="px-4 py-3 font-medium">Propuesta y Empresa</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Docente</th>
                  <th className="px-4 py-3 font-medium">Valor Ofertado</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right min-w-[100px]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-[#252838]">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      <p>No se encontraron solicitudes con estos filtros.</p>
                      {(onlyMissingProfessor || searchQuery || activeStageFilter !== "todas") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOnlyMissingProfessor(false);
                            setSearchQuery("");
                            setActiveStageFilter("todas");
                          }}
                          className="mt-3 text-xs"
                        >
                          Quitar filtros
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => {
                    const hasRealCosting = r.costing && r.costing.totalOfferedCop > 0;
                    return (
                      <tr key={r.id} className="transition-colors hover:bg-secondary/30 dark:hover:bg-[#1a1c2a]">
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-foreground">{r.id}</span>
                            <span className="text-muted-foreground/60 text-xs">·</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(r.createdAt), "d MMM", { locale: es })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex flex-col gap-1 max-w-[320px]">
                            <Link
                              to={`/solicitudes/${r.id}`}
                              className="font-semibold text-sm text-foreground hover:text-[#5454e9] transition-colors leading-snug line-clamp-2"
                              title={r.title}
                            >
                              {r.title}
                            </Link>
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
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
                        <td className="px-4 py-3.5 align-middle hidden md:table-cell">
                          {r.professor ? (
                            <span className="text-xs font-semibold text-foreground">{r.professor}</span>
                          ) : (
                            <span className="inline-flex items-center rounded border border-[#e9683b]/30 bg-[#e9683b]/10 px-2 py-0.5 text-xs font-medium text-[#e9683b]">
                              Sin docente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          {hasRealCosting ? (
                            <span className="font-semibold text-foreground text-xs sm:text-sm tracking-tight">
                              {formatCop(r.costing!.totalOfferedCop)}
                            </span>
                          ) : (
                            <span className="inline-block rounded bg-muted/40 px-2 py-0.5 text-xs italic text-muted-foreground border border-border/50">
                              - Pendiente de costeo -
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                          <Link
                            to={`/solicitudes/${r.id}`}
                            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
                          >
                            <span>Ver detalle</span>
                            <ArrowRight className="ml-1 h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modal de Reasignación de Líder de Producto */}
      <Dialog
        open={!!reassigningRequest}
        onOpenChange={(open) => {
          if (!open) setReassigningRequest(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-foreground">{reassigningRequest?.id}</span>
              <span className="rounded bg-[#5454e9]/10 px-2 py-0.5 text-[10px] font-bold text-[#5454e9]">
                {reassigningRequest?.node}
              </span>
            </div>
            <DialogTitle className="text-base font-bold text-foreground mt-1">Reasignar Líder de Producto</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transfiere esta solicitud comercial a otro líder si no corresponde a tu área temática.
            </DialogDescription>
          </DialogHeader>

          {reassigningRequest && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Propuesta:</span>
                  <span className="font-semibold text-foreground text-right truncate">{reassigningRequest.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empresa:</span>
                  <span className="font-semibold text-foreground">{reassigningRequest.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Líder actual:</span>
                  <span className="font-semibold text-[#e9683b]">{reassigningRequest.productLeader}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-new-leader" className="text-xs font-semibold text-foreground">
                  Nuevo Líder de Producto destinatario *
                </Label>
                <Select
                  value={selectedNewLeader}
                  onValueChange={(val) => {
                    setSelectedNewLeader(val);
                    const foundNode = Object.entries(NODE_DEFAULT_LEADERS).find(([_, leader]) => leader === val);
                    if (foundNode) {
                      setSelectedNewNode(foundNode[0]);
                    }
                  }}
                >
                  <SelectTrigger id="modal-new-leader" className="text-xs h-9">
                    <SelectValue placeholder="Seleccionar nuevo líder de producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_LEADERS.map((leader) => {
                      const isCurrent = leader === reassigningRequest.productLeader;
                      const leaderNode = Object.entries(NODE_DEFAULT_LEADERS).find(([_, l]) => l === leader)?.[0];
                      return (
                        <SelectItem key={leader} value={leader} disabled={isCurrent}>
                          {leader}{" "}
                          {isCurrent ? "(Líder actual)" : leaderNode ? `· Nodo: ${leaderNode.split(",")[0]}` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-new-node" className="text-xs font-semibold text-foreground">
                  Nodo Temático
                </Label>
                <Select value={selectedNewNode} onValueChange={setSelectedNewNode}>
                  <SelectTrigger id="modal-new-node" className="text-xs h-9">
                    <SelectValue placeholder="Seleccionar nodo temático" />
                  </SelectTrigger>
                  <SelectContent>
                    {NODES.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-reassign-reason" className="text-xs font-semibold text-foreground">
                  Motivo de la reasignación
                </Label>
                <Select value={reassignReason} onValueChange={setReassignReason}>
                  <SelectTrigger id="modal-reassign-reason" className="text-xs h-9">
                    <SelectValue placeholder="Seleccionar motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Temática no afín / Corresponde a otro nodo">
                      Temática no afín / Corresponde a otro nodo
                    </SelectItem>
                    <SelectItem value="Asignada por error por el KAM">Asignada por error por el KAM</SelectItem>
                    <SelectItem value="Redistribución por sobrecarga operativa">
                      Redistribución por sobrecarga operativa
                    </SelectItem>
                    <SelectItem value="Especialidad técnica específica">Especialidad técnica específica</SelectItem>
                    <SelectItem value="Otro motivo">Otro motivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-reassign-notes" className="text-xs font-semibold text-muted-foreground">
                  Nota o mensaje para el nuevo líder (opcional)
                </Label>
                <Textarea
                  id="modal-reassign-notes"
                  rows={2}
                  placeholder="Ej. Esta solicitud corresponde al área de Inteligencia Artificial..."
                  value={reassignNotes}
                  onChange={(e) => setReassignNotes(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReassigningRequest(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedNewLeader || selectedNewLeader === reassigningRequest?.productLeader}
              onClick={handleConfirmReassign}
              className="text-xs bg-[#5454e9] hover:bg-[#4343d0] text-white"
            >
              Confirmar Reasignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Confirmación antes de avanzar de etapa desde el tablero — con los
          datos concretos de la solicitud, no un texto genérico, para que un
          vistazo rápido baste para confirmar que es la correcta. */}
      <Dialog open={!!confirmingAdvance} onOpenChange={(open) => !open && setConfirmingAdvance(null)}>
        <DialogContent className="max-w-sm">
          {confirmingAdvance && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-foreground">¿Avanzar esta solicitud?</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{confirmingAdvance.company}</span> —{" "}
                  {confirmingAdvance.title}
                  <br />
                  Pasará a{" "}
                  <span className="font-semibold text-foreground">
                    {ADVANCE_META[confirmingAdvance.from].nextLabel}
                  </span>
                  .
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingAdvance(null)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmAdvance}
                  className="text-xs bg-[#5454e9] hover:bg-[#4343d0] text-white"
                >
                  Sí, avanzar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
