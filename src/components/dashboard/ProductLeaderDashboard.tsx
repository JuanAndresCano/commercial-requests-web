import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  UserCheck,
  Layers,
  Sparkles,
  ArrowLeftRight,
  Building2,
  Check,
  Search,
  Filter,
  User,
  AlertCircle,
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, UrgencyBadge } from "@/components/StatusBadge";
import { IcesiCenefa } from "@/components/IcesiLogo";
import {
  PRODUCT_LEADERS,
  NODES,
  NODE_DEFAULT_LEADERS,
  STATUS_META,
  formatCop,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProductLeaderDashboardProps {
  requests: RequestItem[];
  user: { name: string; email: string; roleLabel: string };
  updateRequest: (id: string, patch: Partial<RequestItem>) => void;
  updateStatus: (id: string, status: RequestStatus) => void;
}

const KANBAN_STAGES: {
  id: RequestStatus;
  title: string;
  badgeLabel: string;
  colorHex: string;
  tone: string;
  bgLight: string;
  borderClass: string;
  description: string;
  actionText: string;
}[] = [
  {
    id: "nueva",
    title: "Nuevas",
    badgeLabel: "Fase 1: Asignar Docente",
    colorHex: "#5454e9",
    tone: "text-[#5454e9]",
    bgLight: "bg-[#5454e9]/10",
    borderClass: "border-t-4 border-t-[#5454e9]",
    description: "Pendientes por revisar alcance y asignar docente de planta o externo",
    actionText: "Asignar docente",
  },
  {
    id: "en-experto",
    title: "En Experto",
    badgeLabel: "Fase 2: Diseño Académico",
    colorHex: "#e9683b",
    tone: "text-[#e9683b]",
    bgLight: "bg-[#e9683b]/10",
    borderClass: "border-t-4 border-t-[#e9683b]",
    description: "Docente formulando temática, cronograma y propuesta técnica",
    actionText: "Revisar avance",
  },
  {
    id: "en-costeo",
    title: "En Costeo",
    badgeLabel: "Fase 3: Estructuración Financiera",
    colorHex: "#865cf0",
    tone: "text-[#865cf0]",
    bgLight: "bg-[#865cf0]/10",
    borderClass: "border-t-4 border-t-[#865cf0]",
    description: "Simulación financiera, tarifas y cálculo de margen antes de entrega",
    actionText: "Validar costeo",
  },
  {
    id: "entregada",
    title: "Entregadas",
    badgeLabel: "Fase 4: Concretada a KAM / Cliente",
    colorHex: "#4cb979",
    tone: "text-[#4cb979]",
    bgLight: "bg-[#4cb979]/10",
    borderClass: "border-t-4 border-t-[#4cb979]",
    description: "Propuestas culminadas y entregadas a la empresa o KAM comercial",
    actionText: "Ver detalle",
  },
];

export function ProductLeaderDashboard({
  requests,
  user,
  updateRequest,
  updateStatus,
}: ProductLeaderDashboardProps) {
  // Filter states
  const [scopeFilter, setScopeFilter] = useState<"mis" | "todas">("mis");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStageFilter, setActiveStageFilter] = useState<RequestStatus | "todas">("todas");

  // Reassignment Modal State
  const [reassigningRequest, setReassigningRequest] = useState<RequestItem | null>(null);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string>("");
  const [selectedNewNode, setSelectedNewNode] = useState<string>("");
  const [reassignReason, setReassignReason] = useState<string>(
    "Temática no afín / Corresponde a otro nodo"
  );
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

    toast.success(
      `Solicitud ${reassigningRequest.id} transferida a ${targetLeader}.`
    );
    setReassigningRequest(null);
  };

  // Status transitions
  const handleAdvanceStatus = (reqId: string, currentStatus: RequestStatus) => {
    if (currentStatus === "nueva") {
      updateStatus(reqId, "en-experto");
      toast.success("Solicitud avanzada a: En proceso por experto");
    } else if (currentStatus === "en-experto") {
      updateStatus(reqId, "en-costeo");
      toast.success("Solicitud avanzada a: En proceso de costeo");
    } else if (currentStatus === "en-costeo") {
      updateStatus(reqId, "entregada");
      toast.success("Solicitud completada y marcada como Entregada");
    }
  };

  // Compute counts
  const myRequests = requests.filter((r) => r.productLeader === user.name);
  const activeDataset = scopeFilter === "mis" ? myRequests : requests;

  const countNuevas = activeDataset.filter((r) => r.status === "nueva").length;
  const countEnExperto = activeDataset.filter((r) => r.status === "en-experto").length;
  const countEnCosteo = activeDataset.filter((r) => r.status === "en-costeo").length;
  const countEntregadas = activeDataset.filter((r) => r.status === "entregada").length;

  // Filter requests
  const filteredRequests = useMemo(() => {
    return activeDataset.filter((r) => {
      if (activeStageFilter !== "todas" && r.status !== activeStageFilter) return false;
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
  }, [activeDataset, activeStageFilter, searchQuery]);

  // Group by status for the single unified Kanban
  const groupedRequests = useMemo(() => {
    const grouped: Record<RequestStatus, RequestItem[]> = {
      nueva: [],
      "en-experto": [],
      "en-costeo": [],
      entregada: [],
    };
    filteredRequests.forEach((req) => {
      if (grouped[req.status]) {
        grouped[req.status].push(req);
      }
    });
    return grouped;
  }, [filteredRequests]);

  return (
    <div className="space-y-6">
      {/* 1. Header with clear context and zero noise */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-sans">
              Tablero de Solicitudes · Líder de Producto
            </h1>
            <span className="rounded bg-[#5454e9]/10 dark:bg-[#5454e9]/20 px-2.5 py-0.5 text-xs font-bold text-[#5454e9]">
              {user.name.split(" ")[0]}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Gestión directa del flujo operativo: asignación de docentes, avance técnico y costeo en un único lugar.
          </p>
        </div>

        {/* Action button & scope toggle */}
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
        </div>
      </div>

      {/* 2. Interactive Stages / KPIs Bar with Official Icesi Colors */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Nueva: Azul Icesi #5454e9 */}
        <button
          type="button"
          onClick={() => setActiveStageFilter((prev) => (prev === "nueva" ? "todas" : "nueva"))}
          className={cn(
            "relative flex flex-col justify-between rounded-xl border p-4 text-left shadow-xs transition-all cursor-pointer",
            activeStageFilter === "nueva"
              ? "border-[#5454e9] ring-2 ring-[#5454e9]/30 bg-[#5454e9]/5 dark:bg-[#5454e9]/10"
              : "border-border dark:border-[#252838] bg-card dark:bg-[#141622] hover:border-[#5454e9]/50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">1. Nuevas</span>
            <span className="inline-flex items-center rounded-md border border-[#5454e9]/30 bg-[#5454e9]/10 px-2 py-0.5 text-[11px] font-bold text-[#5454e9]">
              Azul Icesi
            </span>
          </div>
          <div className="mt-2.5">
            <p className="font-display text-2xl font-bold tracking-tight text-[#5454e9] sm:text-3xl">
              {countNuevas}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {activeStageFilter === "nueva" ? "✓ Filtrando esta columna" : "Por asignar docente"}
            </p>
          </div>
          <div className="mt-2.5 h-1 w-full rounded-full bg-[#5454e9]" />
        </button>

        {/* En Experto: Naranja Icesi #e9683b */}
        <button
          type="button"
          onClick={() => setActiveStageFilter((prev) => (prev === "en-experto" ? "todas" : "en-experto"))}
          className={cn(
            "relative flex flex-col justify-between rounded-xl border p-4 text-left shadow-xs transition-all cursor-pointer",
            activeStageFilter === "en-experto"
              ? "border-[#e9683b] ring-2 ring-[#e9683b]/30 bg-[#e9683b]/5 dark:bg-[#e9683b]/10"
              : "border-border dark:border-[#252838] bg-card dark:bg-[#141622] hover:border-[#e9683b]/50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">2. En Experto</span>
            <span className="inline-flex items-center rounded-md border border-[#e9683b]/30 bg-[#e9683b]/10 px-2 py-0.5 text-[11px] font-bold text-[#e9683b]">
              Naranja Icesi
            </span>
          </div>
          <div className="mt-2.5">
            <p className="font-display text-2xl font-bold tracking-tight text-[#e9683b] sm:text-3xl">
              {countEnExperto}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {activeStageFilter === "en-experto" ? "✓ Filtrando esta columna" : "En diseño académico"}
            </p>
          </div>
          <div className="mt-2.5 h-1 w-full rounded-full bg-[#e9683b]" />
        </button>

        {/* En Costeo: Morado Icesi #865cf0 */}
        <button
          type="button"
          onClick={() => setActiveStageFilter((prev) => (prev === "en-costeo" ? "todas" : "en-costeo"))}
          className={cn(
            "relative flex flex-col justify-between rounded-xl border p-4 text-left shadow-xs transition-all cursor-pointer",
            activeStageFilter === "en-costeo"
              ? "border-[#865cf0] ring-2 ring-[#865cf0]/30 bg-[#865cf0]/5 dark:bg-[#865cf0]/10"
              : "border-border dark:border-[#252838] bg-card dark:bg-[#141622] hover:border-[#865cf0]/50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">3. En Costeo</span>
            <span className="inline-flex items-center rounded-md border border-[#865cf0]/30 bg-[#865cf0]/10 px-2 py-0.5 text-[11px] font-bold text-[#865cf0]">
              Morado Icesi
            </span>
          </div>
          <div className="mt-2.5">
            <p className="font-display text-2xl font-bold tracking-tight text-[#865cf0] sm:text-3xl">
              {countEnCosteo}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {activeStageFilter === "en-costeo" ? "✓ Filtrando esta columna" : "Simulación y márgenes"}
            </p>
          </div>
          <div className="mt-2.5 h-1 w-full rounded-full bg-[#865cf0]" />
        </button>

        {/* Entregada: Verde Icesi #4cb979 */}
        <button
          type="button"
          onClick={() => setActiveStageFilter((prev) => (prev === "entregada" ? "todas" : "entregada"))}
          className={cn(
            "relative flex flex-col justify-between rounded-xl border p-4 text-left shadow-xs transition-all cursor-pointer",
            activeStageFilter === "entregada"
              ? "border-[#4cb979] ring-2 ring-[#4cb979]/30 bg-[#4cb979]/5 dark:bg-[#4cb979]/10"
              : "border-border dark:border-[#252838] bg-card dark:bg-[#141622] hover:border-[#4cb979]/50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">4. Entregadas</span>
            <span className="inline-flex items-center rounded-md border border-[#4cb979]/30 bg-[#4cb979]/10 px-2 py-0.5 text-[11px] font-bold text-[#4cb979]">
              Verde Icesi
            </span>
          </div>
          <div className="mt-2.5">
            <p className="font-display text-2xl font-bold tracking-tight text-[#4cb979] sm:text-3xl">
              {countEntregadas}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {activeStageFilter === "entregada" ? "✓ Filtrando esta columna" : "Culminadas exitosamente"}
            </p>
          </div>
          <div className="mt-2.5 h-1 w-full rounded-full bg-[#4cb979]" />
        </button>
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
          {activeStageFilter !== "todas" && (
            <button
              type="button"
              onClick={() => setActiveStageFilter("todas")}
              className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary cursor-pointer"
            >
              Mostrar todas las fases
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            {filteredRequests.length} solicitudes visibles
          </span>
        </div>
      </div>

      {/* 4. Unified Board: The 4 Columns for the Product Leader */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 items-start">
        {KANBAN_STAGES.map((stage) => {
          const stageItems = groupedRequests[stage.id];
          const isHighlighted = activeStageFilter === "todas" || activeStageFilter === stage.id;

          if (!isHighlighted) {
            return null;
          }

          return (
            <div
              key={stage.id}
              className={cn(
                "flex flex-col rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#121420] shadow-xs overflow-hidden",
                stage.borderClass
              )}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-border dark:border-[#202230] bg-secondary/30 dark:bg-[#161826]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stage.colorHex }}
                    />
                    <h3 className="font-bold text-sm text-foreground font-sans">
                      {stage.title}
                    </h3>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundColor: stage.colorHex }}
                  >
                    {stageItems.length}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                  {stage.description}
                </p>
              </div>

              {/* Column Body / Cards */}
              <div className="p-3 space-y-3 min-h-[300px]">
                {stageItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border dark:border-[#252838] p-6 text-center text-muted-foreground">
                    <p className="text-xs font-medium">Sin solicitudes en esta fase</p>
                  </div>
                ) : (
                  stageItems.map((req) => {
                    const isAssignedToMe = req.productLeader === user.name;
                    return (
                      <div
                        key={req.id}
                        className="group relative rounded-lg border border-border dark:border-[#252838] bg-card dark:bg-[#161824] p-3.5 shadow-2xs hover:shadow-md transition-all hover:border-[#5454e9]/40"
                      >
                        {/* Top: ID, Company & Urgency */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-foreground">
                                {req.id}
                              </span>
                              <span className="text-muted-foreground/60 text-[10px]">•</span>
                              <span className="text-[11px] font-medium text-foreground truncate max-w-[120px]">
                                {req.company}
                              </span>
                            </div>
                            <Link
                              to={`/solicitudes/${req.id}`}
                              className="mt-1 block font-sans font-bold text-xs leading-snug text-foreground hover:text-[#5454e9] transition-colors line-clamp-2"
                            >
                              {req.title}
                            </Link>
                          </div>
                          <UrgencyBadge urgency={req.urgency} />
                        </div>

                        {/* Middle: Type, Leader badge & Docente */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {req.type}
                          </span>
                          {isAssignedToMe && (
                            <span className="rounded bg-[#5454e9]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#5454e9]">
                              Mi producto
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

                        {/* Footer: Date & Direct Actions */}
                        <div className="mt-3 pt-2 border-t border-border dark:border-[#222434] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{format(new Date(req.createdAt), "d MMM", { locale: es })}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Reassign quick button */}
                            <button
                              type="button"
                              onClick={() => handleOpenReassign(req)}
                              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              title="Reasignar a otro líder de producto"
                            >
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                            </button>

                            {/* Status Advancement Button */}
                            {stage.id === "nueva" && (
                              <Button
                                size="sm"
                                onClick={() => handleAdvanceStatus(req.id, "nueva")}
                                className="h-7 px-2 text-[10px] font-bold bg-[#e9683b] hover:bg-[#d8582d] text-white shadow-2xs"
                                title="Avanzar a En Experto tras asignar docente"
                              >
                                Pasar a Experto
                                <ChevronRight className="h-3 w-3 ml-0.5" />
                              </Button>
                            )}

                            {stage.id === "en-experto" && (
                              <Button
                                size="sm"
                                onClick={() => handleAdvanceStatus(req.id, "en-experto")}
                                className="h-7 px-2 text-[10px] font-bold bg-[#865cf0] hover:bg-[#7344e8] text-white shadow-2xs"
                                title="Avanzar a En Costeo"
                              >
                                Pasar a Costeo
                                <ChevronRight className="h-3 w-3 ml-0.5" />
                              </Button>
                            )}

                            {stage.id === "en-costeo" && (
                              <Button
                                size="sm"
                                onClick={() => handleAdvanceStatus(req.id, "en-costeo")}
                                className="h-7 px-2 text-[10px] font-bold bg-[#4cb979] hover:bg-[#3ea569] text-white shadow-2xs"
                                title="Finalizar propuesta y marcar como Entregada"
                              >
                                Entregar
                                <Check className="h-3 w-3 ml-0.5" />
                              </Button>
                            )}

                            {stage.id === "entregada" && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-7 px-2 text-[10px] font-semibold border-border hover:bg-secondary"
                              >
                                <Link to={`/solicitudes/${req.id}`}>
                                  Detalle
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

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
              <span className="font-mono text-xs font-bold text-foreground">
                {reassigningRequest?.id}
              </span>
              <span className="rounded bg-[#5454e9]/10 px-2 py-0.5 text-[10px] font-bold text-[#5454e9]">
                {reassigningRequest?.node}
              </span>
            </div>
            <DialogTitle className="text-base font-bold text-foreground mt-1">
              Reasignar Líder de Producto
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transfiere esta solicitud comercial a otro líder si no corresponde a tu área temática.
            </DialogDescription>
          </DialogHeader>

          {reassigningRequest && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Propuesta:</span>
                  <span className="font-semibold text-foreground text-right truncate">
                    {reassigningRequest.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empresa:</span>
                  <span className="font-semibold text-foreground">{reassigningRequest.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Líder actual:</span>
                  <span className="font-semibold text-[#e9683b]">
                    {reassigningRequest.productLeader}
                  </span>
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
                          {leader} {isCurrent ? "(Líder actual)" : leaderNode ? `· Nodo: ${leaderNode.split(",")[0]}` : ""}
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
                    <SelectItem value="Asignada por error por el KAM">
                      Asignada por error por el KAM
                    </SelectItem>
                    <SelectItem value="Redistribución por sobrecarga operativa">
                      Redistribución por sobrecarga operativa
                    </SelectItem>
                    <SelectItem value="Especialidad técnica específica">
                      Especialidad técnica específica
                    </SelectItem>
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
    </div>
  );
}
