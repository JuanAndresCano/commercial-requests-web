import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Building2,
  Users,
  MapPin,
  Clock,
  Layers,
  Calendar,
  Save,
  Send,
  Phone,
  Mail,
  User,
  Check,
  ChevronRight,
  MessageSquare,
  ArrowLeftRight,
  UserCheck,
  ChevronDown,
} from "@/components/icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import {
  formatCop,
  RequestItem,
  ProposalCosting,
  ProposalDocument,
  ExternalProfessorData,
  calculateCosting,
  PRODUCT_LEADERS,
  NODES,
  NODE_DEFAULT_LEADERS,
  REQUEST_TYPES,
  type RequestType,
} from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { AdvisorAssignmentModal } from "@/components/costing/AdvisorAssignmentModal";
import { ProposalCostingModule } from "@/components/costing/ProposalCostingModule";
import { ProposalDocumentsSection } from "@/components/costing/ProposalDocumentsSection";
import { toast } from "sonner";

export default function RequestDetail() {
  const { id } = useParams();
  const {
    requests,
    user,
    assignProfessorDetailed,
    updateCosting,
    addDocument,
    removeDocument,
    updateStatus,
    updateRequest,
  } = useAuth();

  const role = user.role;
  const isKam = role === "kam";
  const isLeader = role === "lider-producto" || role === "lider-nodo";

  const req: RequestItem = requests.find((r) => r.id === id) ?? requests[0];

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isContactAdvisorModalOpen, setIsContactAdvisorModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState("");
  const [selectedNewNode, setSelectedNewNode] = useState("");
  const [reassignReason, setReassignReason] = useState("Temática no afín / Corresponde a otro nodo");
  const [reassignNotes, setReassignNotes] = useState("");

  // Edición de "Especificaciones del Servicio" por el Líder de Producto,
  // para corregir datos que el KAM haya diligenciado de forma incorrecta.
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [specsDraft, setSpecsDraft] = useState({
    horas: "",
    modalidad: "",
    participantes: "",
    type: "" as RequestType | "",
    tipoOtro: "",
    deadline: "",
  });

  const handleStartEditSpecs = () => {
    setSpecsDraft({
      horas: req.horas ?? "",
      modalidad: req.modalidad ?? "",
      participantes: req.participantes ?? "",
      type: req.type,
      tipoOtro: req.tipoOtro ?? "",
      deadline: req.deadline ?? "",
    });
    setIsEditingSpecs(true);
  };

  const handleSaveSpecs = () => {
    updateRequest(req.id, {
      horas: specsDraft.horas || undefined,
      modalidad: specsDraft.modalidad || undefined,
      participantes: specsDraft.participantes || undefined,
      type: (specsDraft.type || req.type) as RequestType,
      tipoOtro: specsDraft.type === "Otro" ? specsDraft.tipoOtro.trim() || undefined : undefined,
      deadline: specsDraft.deadline || undefined,
    });
    setIsEditingSpecs(false);
    toast.success("Especificaciones del servicio actualizadas");
  };

  const handleConfirmReassign = () => {
    if (!selectedNewLeader) return;
    updateRequest(req.id, {
      productLeader: selectedNewLeader,
      node: selectedNewNode || req.node,
    });
    toast.success(`Solicitud ${req.id} reasignada a ${selectedNewLeader} exitosamente.`);
    setIsReassignModalOpen(false);
  };

  // Borrador vacío solo para alimentar el formulario de costeo del Líder de
  // Producto — nunca se muestra como si fuera un valor ya definido.
  const currentCosting: ProposalCosting =
    req.costing ?? calculateCosting(req.type, 0, 30);

  const clientKamDocs: ProposalDocument[] = req.clientKamDocuments ?? [];
  const internalCostingDocs: ProposalDocument[] = req.internalCostingDocuments ?? [];

  const handleSaveAssignment = (
    professorName: string,
    type: "planta" | "externo",
    externalData?: ExternalProfessorData
  ) => {
    assignProfessorDetailed(req.id, professorName, type, externalData);
    if (type === "externo") {
      updateCosting(req.id, {
        ...currentCosting,
        requiresExternalAdvisor: true,
        externalAdvisorDetails: externalData?.empresaConsultora
          ? `${externalData.nombre} (${externalData.empresaConsultora})`
          : externalData?.nombre,
      });
    }
  };

  const handleUpdateCosting = (newCosting: ProposalCosting) => {
    updateCosting(req.id, newCosting);
  };

  const handleAddDocument = (doc: ProposalDocument) => {
    addDocument(req.id, doc);
  };

  const handleRemoveDocument = (docId: string, category: "client_kam" | "internal_costing") => {
    removeDocument(req.id, docId, category);
  };

  const handleSaveChanges = () => {
    updateCosting(req.id, currentCosting);
    toast.success("Cambios guardados correctamente");
  };

  // Avanzar de estado (y sobre todo "marcar entregada") es una acción con
  // consecuencias reales — se confirma explícitamente en vez de ejecutarse
  // directo desde el botón, para que un clic accidental o varios clics
  // seguidos no manden la propuesta al cliente sin querer.
  const [confirmingAction, setConfirmingAction] = useState<"experto" | "costeo" | "entregada" | null>(null);

  const handleMoveToExperto = () => {
    updateStatus(req.id, "en-experto");
    toast.success("Propuesta pasada a: En proceso por experto");
    setConfirmingAction(null);
  };

  const handleMoveToCosteo = () => {
    updateStatus(req.id, "en-costeo");
    toast.success("Propuesta pasada a: En proceso de costeo");
    setConfirmingAction(null);
  };

  const handleSendToClient = () => {
    updateStatus(req.id, "entregada");
    toast.success("Propuesta enviada al cliente y marcada como Entregada");
    setConfirmingAction(null);
  };

  const CONFIRM_ACTION_META = {
    experto: {
      title: "¿Avanzar a \"En proceso por experto\"?",
      description: "El docente asignado queda como responsable de formular la temática y el cronograma antes del costeo.",
      confirmLabel: "Sí, avanzar",
      onConfirm: handleMoveToExperto,
    },
    costeo: {
      title: "¿Avanzar a \"En proceso de costeo\"?",
      description: "A partir de aquí se estructura el valor final de la propuesta.",
      confirmLabel: "Sí, avanzar",
      onConfirm: handleMoveToCosteo,
    },
    entregada: {
      title: "¿Marcar como Entregada?",
      description: "Confirma que la propuesta ya fue remitida al cliente con el costeo definido. Esta acción cierra el flujo de la solicitud.",
      confirmLabel: "Sí, marcar entregada",
      onConfirm: handleSendToClient,
    },
  } as const;

  const formattedDeadline = req?.deadline
    ? format(new Date(req.deadline), "d 'de' MMMM, yyyy", { locale: es })
    : "Sin fecha definida";

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* ========================================================================= */}
        {/* TOP BAR: BACK NAVIGATION & CLEAN ROLE SIMULATOR PILL */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            to={role === "kam" || role === "lider-producto" ? "/dashboard" : "/solicitudes"}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a solicitudes
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 1. CABECERA MINIMALISTA */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
                {req.title}
              </h1>

              {/* Fila de metadatos inline sutiles: Empresa, Contacto, Código REQ y Badges discretos */}
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-muted-foreground">
                <span className="font-mono font-bold text-[#5454e9] dark:text-[#865cf0]">
                  #{req.id}
                </span>

                <span className="text-border dark:text-[#252838]">·</span>

                <span className="flex items-center gap-1 text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <strong className="font-semibold text-foreground">{req.company}</strong>
                </span>

                <span className="text-border dark:text-[#252838]">·</span>

                <span>
                  Contacto: <strong className="font-medium text-foreground">{req.applicant}</strong>
                </span>

                <span className="text-border dark:text-[#252838]">·</span>

                <StatusBadge status={req.status} />

                <Badge
                  variant="outline"
                  className="text-xs font-semibold border-border bg-secondary/50 text-foreground"
                >
                  {req.type}
                </Badge>

                {req.productLeader === user.name && role === "lider-producto" && (
                  <span className="rounded-full bg-[#5454e9]/10 px-2 py-0.5 text-[10px] font-bold text-[#5454e9] border border-[#5454e9]/30">
                    Asignada a ti
                  </span>
                )}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN ARRIBA A LA DERECHA */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 lg:pt-0 shrink-0">
              {role === "lider-producto" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveChanges}
                    className="h-9 px-3 text-xs font-medium border-border hover:bg-secondary text-foreground"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    Guardar Cambios
                  </Button>

                  {req.status === "nueva" && (
                    <Button
                      size="sm"
                      disabled={!req.professor}
                      onClick={() => setConfirmingAction("experto")}
                      className="h-9 px-4 text-xs font-bold bg-[#e9683b] hover:bg-[#d8582d] text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      title={req.professor ? undefined : "Asigna un docente antes de avanzar"}
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                      Avanzar a En Experto
                    </Button>
                  )}

                  {req.status === "en-experto" && (
                    <Button
                      size="sm"
                      onClick={() => setConfirmingAction("costeo")}
                      className="h-9 px-4 text-xs font-bold bg-[#865cf0] hover:bg-[#7344e8] text-white shadow-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Avanzar a En Costeo
                    </Button>
                  )}

                  {req.status === "en-costeo" && (
                    <Button
                      size="sm"
                      onClick={() => setConfirmingAction("entregada")}
                      className="h-9 px-4 text-xs font-bold bg-[#4cb979] hover:bg-[#3ea569] text-white shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Marcar Entregada
                    </Button>
                  )}

                  {req.status === "entregada" && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#4cb979]/30 bg-[#4cb979]/10 px-3 py-1.5 text-xs font-bold text-[#4cb979]">
                      <Check className="h-3.5 w-3.5" /> Propuesta Entregada
                    </div>
                  )}
                </>
              ) : isKam && req.status === "en-costeo" ? (
                <Button
                  size="sm"
                  onClick={() => setConfirmingAction("entregada")}
                  className="h-9 px-4 text-xs font-bold bg-[#5454e9] hover:bg-[#4343d3] text-white shadow-xs"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Enviar a cliente
                </Button>
              ) : isKam && req.status === "entregada" ? (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#4cb979]/30 bg-[#4cb979]/10 px-3 py-1.5 text-xs font-bold text-[#4cb979]">
                  <Check className="h-3.5 w-3.5" /> Propuesta Entregada
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LAYOUT Y JERARQUÍA ESTRUCTURAL (2 Columnas Limpias 65% | 35%) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================================= */}
          {/* 🅰️ COLUMNA PRINCIPAL (Izquierda ~65% - Flujo de Trabajo) */}
          {/* ======================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. SECCIÓN COSTEO FINANCIERO */}
            {role === "lider-producto" ? (
              <ProposalCostingModule
                request={req}
                onUpdateCosting={handleUpdateCosting}
                onOpenAdvisorModal={() => setIsAssignModalOpen(true)}
              />
            ) : req.costing && req.costing.totalOfferedCop > 0 ? (
              /* Vista comercial para KAM — solo cuando el Líder ya guardó un costeo real */
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-border dark:bg-card space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-border">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Propuesta Económica para Cliente
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-muted-foreground">
                      Presupuesto oficial validado por el Líder de Producto para oferta comercial
                    </p>
                  </div>
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs font-medium">
                    Aprobado por Líder
                  </Badge>
                </div>

                <div className="pt-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Valor Total Ofertado (COP)
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      {formatCop(req.costing.totalOfferedCop)}
                    </p>
                    <span className="text-xs font-medium text-slate-400">COP</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Monto total autorizado para la presentación y cotización oficial al cliente.
                  </p>
                </div>

                {/* Resumen de estructura financiera de respaldo para el KAM */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-border dark:bg-secondary/20">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                      Costo Base Directo
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatCop(req.costing.baseCostCop)}
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-border dark:bg-secondary/20">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                      Margen de Contribución ({req.costing.expectedMarginPercent}%)
                    </span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatCop(Math.round(req.costing.baseCostCop * (req.costing.expectedMarginPercent / 100)))}
                    </span>
                  </div>

                  {req.type === "Capacitación" && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-border dark:bg-secondary/20">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                        Estampilla Pro-Cultura (1.5%)
                      </span>
                      <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                        +{formatCop(req.costing.proCulturaTaxAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Nota de alcance o acuerdo comercial en tiempo real */}
                {req.costing.negotiationNotes && req.costing.negotiationNotes.trim() && (
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/90 p-3.5 text-xs text-slate-700 dark:border-border dark:bg-secondary/20 dark:text-slate-300 flex items-start gap-2.5">
                    <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                        Nota de alcance comercial agregada por el Líder:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                        {req.costing.negotiationNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Vista comercial para KAM — el Líder de Producto aún no ha costeado */
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 dark:border-border bg-slate-50/60 dark:bg-secondary/10 p-8 text-center">
                <Clock className="h-6 w-6 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Costeo en proceso
                </p>
                <p className="max-w-sm text-xs text-slate-500 dark:text-muted-foreground">
                  El Líder de Producto todavía no ha estructurado el valor de esta propuesta.
                  Aquí verás el valor oficial en cuanto quede definido.
                </p>
              </div>
            )}

            {/* 2. SECCIÓN GESTIÓN DE DOCUMENTOS */}
            <ProposalDocumentsSection
              clientKamDocuments={clientKamDocs}
              internalCostingDocuments={internalCostingDocs}
              onAddDocument={handleAddDocument}
              onRemoveDocument={handleRemoveDocument}
              userRole={role}
              userName={user.name}
            />
          </div>

          {/* ======================================================================= */}
          {/* 🅱️ COLUMNA LATERAL (Derecha ~35% - Contexto y Especificaciones) */}
          {/* ======================================================================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. TARJETA ESPECIFICACIONES DEL SERVICIO */}
            <div className="rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border dark:border-[#252838] pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Especificaciones del Servicio
                </h3>
                {role === "lider-producto" && !isEditingSpecs && (
                  <button
                    type="button"
                    onClick={handleStartEditSpecs}
                    className="text-[11px] font-semibold text-[#5454e9] dark:text-[#865cf0] hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>

              {!isEditingSpecs ? (
                <div className="divide-y divide-border dark:divide-[#252838] text-xs mt-1">
                  {/* Dedicación */}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      Dedicación estimada
                    </span>
                    <span className="font-semibold text-foreground">
                      {req.horas ? `${req.horas} horas` : "Sin especificar"}
                    </span>
                  </div>

                  {/* Modalidad */}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Modalidad
                    </span>
                    <span className="font-semibold text-foreground">
                      {req.modalidad || "Sin especificar"}
                    </span>
                  </div>

                  {/* Participantes */}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      Participantes
                    </span>
                    <span className="font-semibold text-foreground">
                      {req.participantes ? `${req.participantes} personas` : "Sin especificar"}
                    </span>
                  </div>

                  {/* Tipo de servicio */}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      Tipo de servicio
                    </span>
                    <span className="font-semibold text-foreground">
                      {req.type === "Otro" && req.tipoOtro ? `Otro (${req.tipoOtro})` : req.type}
                    </span>
                  </div>

                  {/* Fecha límite */}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Entrega esperada
                    </span>
                    <span className="font-semibold text-foreground">
                      {formattedDeadline}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="specs-horas" className="text-[11px] text-muted-foreground">Dedicación estimada (horas)</Label>
                    <Input
                      id="specs-horas"
                      value={specsDraft.horas}
                      onChange={(e) => setSpecsDraft((d) => ({ ...d, horas: e.target.value }))}
                      placeholder="Ej. 40"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="specs-modalidad" className="text-[11px] text-muted-foreground">Modalidad</Label>
                    <Select value={specsDraft.modalidad} onValueChange={(v) => setSpecsDraft((d) => ({ ...d, modalidad: v }))}>
                      <SelectTrigger id="specs-modalidad" className="h-8 text-xs">
                        <SelectValue placeholder="Seleccionar modalidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Presencial en campus Icesi">Presencial en campus Icesi</SelectItem>
                        <SelectItem value="Presencial en sede cliente">Presencial en sede cliente</SelectItem>
                        <SelectItem value="Virtual sincrónica">Virtual sincrónica</SelectItem>
                        <SelectItem value="Híbrida">Híbrida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="specs-participantes" className="text-[11px] text-muted-foreground">Participantes</Label>
                    <Select value={specsDraft.participantes} onValueChange={(v) => setSpecsDraft((d) => ({ ...d, participantes: v }))}>
                      <SelectTrigger id="specs-participantes" className="h-8 text-xs">
                        <SelectValue placeholder="Seleccionar rango" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1 - 5">1 a 5 participantes</SelectItem>
                        <SelectItem value="6 - 10">6 a 10 participantes</SelectItem>
                        <SelectItem value="11 - 15">11 a 15 participantes</SelectItem>
                        <SelectItem value="15 - 20">15 a 20 participantes</SelectItem>
                        <SelectItem value="20 - 25">20 a 25 participantes</SelectItem>
                        <SelectItem value="Más de 25">Más de 25 participantes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="specs-tipo" className="text-[11px] text-muted-foreground">Tipo de servicio</Label>
                    <Select value={specsDraft.type} onValueChange={(v) => setSpecsDraft((d) => ({ ...d, type: v as RequestType }))}>
                      <SelectTrigger id="specs-tipo" className="h-8 text-xs">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {REQUEST_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {specsDraft.type === "Otro" && (
                    <div className="space-y-1">
                      <Label htmlFor="specs-tipo-otro" className="text-[11px] text-muted-foreground">Especifica el tipo</Label>
                      <Input
                        id="specs-tipo-otro"
                        value={specsDraft.tipoOtro}
                        onChange={(e) => setSpecsDraft((d) => ({ ...d, tipoOtro: e.target.value }))}
                        placeholder="Ej. Diseño de assessment center"
                        className="h-8 text-xs"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="specs-deadline" className="text-[11px] text-muted-foreground">Entrega esperada</Label>
                    <Input
                      id="specs-deadline"
                      type="date"
                      value={specsDraft.deadline}
                      onChange={(e) => setSpecsDraft((d) => ({ ...d, deadline: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsEditingSpecs(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" className="h-7 text-xs bg-[#5454e9] hover:bg-[#4343d3] text-white" onClick={handleSaveSpecs}>
                      Guardar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. TARJETA EQUIPO ASIGNADO */}
            <div className="rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border dark:border-[#252838] pb-3">
                Equipo Asignado
              </h3>

              <div className="space-y-3.5 text-xs">
                {/* Nodo Temático */}
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Nodo Temático</span>
                  <p className="font-semibold text-foreground leading-snug">
                    {req.node}
                  </p>
                </div>

                {/* Líder de Producto */}
                <div className="space-y-0.5 pt-2 border-t border-border dark:border-[#252838]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">Líder de Producto</span>
                    {role === "lider-producto" && req.status === "nueva" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNewLeader("");
                          setSelectedNewNode(req.node);
                          setReassignReason("Temática no afín / Corresponde a otro nodo");
                          setReassignNotes("");
                          setIsReassignModalOpen(true);
                        }}
                        className="text-[11px] font-semibold text-[#5454e9] dark:text-[#865cf0] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeftRight className="h-3 w-3" /> Reasignar
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">
                      {req.productLeader}
                    </p>
                    {req.productLeader === user.name && (
                      <span className="text-[10px] text-muted-foreground">(Tú)</span>
                    )}
                  </div>
                </div>

                {/* KAM asignado */}
                <div className="space-y-0.5 pt-2 border-t border-border dark:border-[#252838]">
                  <span className="text-[11px] font-medium text-muted-foreground">KAM Responsable</span>
                  <p className="font-semibold text-foreground">
                    {req.kam}
                  </p>
                </div>

                {/* Docente / Asesor asignado */}
                <div className="space-y-1.5 pt-2 border-t border-border dark:border-[#252838]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">Docente / Asesor</span>
                    {role === "lider-producto" && (
                      <button
                        type="button"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="text-[11px] font-semibold text-[#5454e9] dark:text-[#865cf0] hover:underline"
                      >
                        {req.professor ? "Cambiar" : "Asignar"}
                      </button>
                    )}
                  </div>

                  {req.professor ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-foreground truncate">
                            {req.professor}
                          </span>
                          {req.professorType === "externo" ? (
                            <span className="rounded px-1.5 py-0.2 text-[10px] font-bold bg-[#e9683b]/10 text-[#e9683b] border border-[#e9683b]/30">
                              Externo
                            </span>
                          ) : (
                            <span className="rounded px-1.5 py-0.2 text-[10px] font-bold bg-[#5454e9]/10 text-[#5454e9] dark:text-[#865cf0] border border-[#5454e9]/30">
                              Planta
                            </span>
                          )}
                        </div>

                        {/* Botón rápido de contacto para asesor externo */}
                        {req.professorType === "externo" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsContactAdvisorModalOpen(true)}
                            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                            title="Ver datos de contacto del asesor externo"
                          >
                            Contacto
                          </Button>
                        )}
                      </div>

                      {/* Subtítulo si tiene empresa */}
                      {req.professorType === "externo" && req.externalProfessorData?.empresaConsultora && (
                        <p className="text-[11px] text-muted-foreground">
                          {req.externalProfessorData.empresaConsultora}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">
                      Sin docente o asesor asignado
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INFORMACIÓN COMPLETA DE LA SOLICITUD (todo lo que diligenció el KAM) */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFullInfo((v) => !v)}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Información completa de la solicitud
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Todo lo que el KAM diligenció en el formulario: empresa, contacto, diagnóstico y formación previa.
            </p>
          </div>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", showFullInfo && "rotate-180")} />
        </button>

        {showFullInfo && (
          <div className="grid grid-cols-1 gap-5 border-t border-border dark:border-[#252838] p-5 lg:grid-cols-2">
            {/* Empresa */}
            <InfoSection title="Empresa">
              <InfoRow label="NIT" value={req.companyNit} />
              <InfoRow label="Dirección" value={req.companyDireccion} />
              <InfoRow label="Teléfono" value={req.companyTelefono} />
              <InfoRow label="Correo" value={req.companyCorreo} />
              <InfoRow
                label="CIIU principal"
                value={req.companyCiiuPrincipal ? `${req.companyCiiuPrincipal}${req.companyCiiuPrincipalDesc ? ` — ${req.companyCiiuPrincipalDesc}` : ""}` : undefined}
              />
              <InfoRow label="CIIU secundarios" value={req.companyCiiusSecundarios?.join(", ")} />
              <InfoRow label="Naturaleza jurídica" value={req.companyTipo} />
              <InfoRow label="Sitio web" value={req.companyWeb} />
              <InfoRow label="Descripción" value={req.companyDescripcion} block />
            </InfoSection>

            {/* Contacto */}
            <InfoSection title="Contacto del cliente">
              <InfoRow label="Nombre" value={req.applicant} />
              <InfoRow label="Cargo" value={req.contactCargo} />
              <InfoRow label="Área o dependencia" value={req.contactArea} />
              <InfoRow label="Teléfono" value={req.contactTelefono} />
              <InfoRow label="Teléfono secundario" value={req.contactTelefonoSecundario} />
              <InfoRow label="Correo" value={req.contactCorreo} />
              <InfoRow label="Correo alternativo" value={req.contactCorreoAlternativo} />

              {req.additionalContacts && req.additionalContacts.length > 0 && (
                <div className="pt-2 mt-2 border-t border-border dark:border-[#252838] space-y-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Contactos adicionales
                  </span>
                  {req.additionalContacts.map((c) => (
                    <div key={c.id} className="rounded-lg bg-secondary/30 dark:bg-secondary/10 p-2.5 text-xs space-y-0.5">
                      <p className="font-semibold text-foreground">{c.nombre || "Sin nombre"}</p>
                      {c.cargo && <p className="text-muted-foreground">{c.cargo}</p>}
                      {(c.telefono || c.correo) && (
                        <p className="text-muted-foreground">{[c.telefono, c.correo].filter(Boolean).join(" · ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </InfoSection>

            {/* Diagnóstico del requerimiento */}
            <InfoSection title="Diagnóstico del requerimiento">
              <InfoRow label="Necesidad o problema a resolver" value={req.necesidad} block />
              <InfoRow label="Competencias a fortalecer" value={req.competencias} block />
              <InfoRow label="Cómo se medirá el éxito" value={req.exito} block />
              <InfoRow label="Resultados esperados" value={req.resultados} block />
              <InfoRow label="Perfil o área de los participantes" value={req.areaParticipantes} />
              <InfoRow label="Servicio de alimentación y logística" value={req.alimentacion} block />
            </InfoSection>

            {/* Formación previa */}
            <InfoSection title="Formación previa">
              <InfoRow label="¿Han tenido formación previa con Icesi?" value={req.formacionPrevia} />
              {req.formacionPrevia === "Sí" && (
                <>
                  <InfoRow label="Descripción" value={req.descFormacion} block />
                  <InfoRow label="Empresa que la dictó" value={req.empresaPrevia} />
                  <InfoRow label="Fecha aproximada" value={req.fechaPrevia} />
                </>
              )}
            </InfoSection>

            {/* Observaciones */}
            <div className="lg:col-span-2">
              <InfoSection title="Observaciones del KAM">
                <InfoRow label="" value={req.observaciones} block hideLabelWhenEmpty />
              </InfoSection>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ASIGNACIÓN DE DOCENTE / ASESOR */}
      {/* ========================================================================= */}
      <AdvisorAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        request={req}
        onSaveAssignment={handleSaveAssignment}
      />

      {/* ========================================================================= */}
      {/* MODAL RÁPIDO DE CONTACTO: ASESOR EXTERNO */}
      {/* ========================================================================= */}
      <Dialog
        open={isContactAdvisorModalOpen}
        onOpenChange={setIsContactAdvisorModalOpen}
      >
        <DialogContent className="sm:max-w-md rounded-xl border border-slate-200/80 p-6 shadow-lg dark:border-border dark:bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Contacto del Asesor Externo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {isLeader
                ? "Datos de contacto rápido para coordinación académica y administrativa."
                : "Datos de contacto del asesor externo en modo solo lectura."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 space-y-2.5 dark:border-border dark:bg-secondary/20">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                  Nombre Completo
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {req.externalProfessorData?.nombre || req.professor}
                </p>
              </div>

              {req.externalProfessorData?.empresaConsultora && (
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                    Empresa / Consultora
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {req.externalProfessorData.empresaConsultora}
                  </p>
                </div>
              )}

              {req.externalProfessorData?.correo && (
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                      Correo Electrónico
                    </span>
                    <a
                      href={`mailto:${req.externalProfessorData.correo}`}
                      className="text-primary hover:underline font-medium flex items-center gap-1.5"
                    >
                      <Mail className="h-3 w-3" />
                      {req.externalProfessorData.correo}
                    </a>
                  </div>
                </div>
              )}

              {req.externalProfessorData?.telefono && (
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                      Teléfono de Contacto
                    </span>
                    <a
                      href={`tel:${req.externalProfessorData.telefono}`}
                      className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 hover:text-primary"
                    >
                      <Phone className="h-3 w-3" />
                      {req.externalProfessorData.telefono}
                    </a>
                  </div>
                </div>
              )}

              {req.externalProfessorData?.perfil && (
                <div className="pt-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                    Perfil Profesional
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {req.externalProfessorData.perfil}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {isLeader && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium"
                  onClick={() => {
                    setIsContactAdvisorModalOpen(false);
                    setIsAssignModalOpen(true);
                  }}
                >
                  Editar datos
                </Button>
              )}
              <Button
                size="sm"
                className="h-8 text-xs font-medium"
                onClick={() => setIsContactAdvisorModalOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Reasignar Líder de Producto */}
      <Dialog
        open={isReassignModalOpen}
        onOpenChange={setIsReassignModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-foreground">
                {req.id}
              </span>
              <span className="rounded bg-[#5454e9]/10 px-2 py-0.5 text-[10px] font-bold text-[#5454e9] dark:text-[#865cf0]">
                {req.node}
              </span>
            </div>
            <DialogTitle className="text-base font-bold text-foreground mt-1">
              Reasignar Líder de Producto
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transfiere la gestión técnica de esta propuesta a otro líder académico si no corresponde a tu área temática o fue asignada por error.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1.5">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Propuesta:</span>
                <span className="font-semibold text-foreground text-right truncate">
                  {req.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Empresa:</span>
                <span className="font-semibold text-foreground">{req.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Líder asignado actualmente:</span>
                <span className="font-semibold text-[#e9683b]">
                  {req.productLeader}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="detail-new-leader" className="text-xs font-semibold text-foreground">
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
                <SelectTrigger id="detail-new-leader" className="text-xs h-9">
                  <SelectValue placeholder="Seleccionar nuevo líder de producto" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_LEADERS.map((leader) => {
                    const isCurrent = leader === req.productLeader;
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
              <Label htmlFor="detail-reassign-node" className="text-xs font-semibold text-foreground">
                Nodo Temático sugerido
              </Label>
              <Select value={selectedNewNode} onValueChange={setSelectedNewNode}>
                <SelectTrigger id="detail-reassign-node" className="text-xs h-9">
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
              <Label htmlFor="detail-reassign-reason" className="text-xs font-semibold text-foreground">
                Motivo de la reasignación
              </Label>
              <Select value={reassignReason} onValueChange={setReassignReason}>
                <SelectTrigger id="detail-reassign-reason" className="text-xs h-9">
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
              <Label htmlFor="detail-reassign-notes" className="text-xs font-semibold text-muted-foreground">
                Nota o mensaje para el nuevo líder (opcional)
              </Label>
              <Textarea
                id="detail-reassign-notes"
                rows={2}
                placeholder="Ej. Reasignado para ajuste pedagógico según línea de especialidad..."
                value={reassignNotes}
                onChange={(e) => setReassignNotes(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReassignModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedNewLeader || selectedNewLeader === req.productLeader}
              onClick={handleConfirmReassign}
              className="text-xs bg-[#5454e9] hover:bg-[#4343d0] text-white"
            >
              Confirmar Reasignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de avance de estado — evita que un clic accidental
          (o varios seguidos) cambie el estado o mande la propuesta al cliente. */}
      <Dialog open={!!confirmingAction} onOpenChange={(open) => !open && setConfirmingAction(null)}>
        <DialogContent className="max-w-sm">
          {confirmingAction && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-foreground">
                  {CONFIRM_ACTION_META[confirmingAction].title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {CONFIRM_ACTION_META[confirmingAction].description}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingAction(null)} className="text-xs">
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={CONFIRM_ACTION_META[confirmingAction].onConfirm}
                  className="text-xs bg-[#5454e9] hover:bg-[#4343d0] text-white"
                >
                  {CONFIRM_ACTION_META[confirmingAction].confirmLabel}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border dark:border-[#252838] p-4 space-y-2.5">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-2 text-xs">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  block = false,
  hideLabelWhenEmpty = false,
}: {
  label: string;
  value?: string;
  block?: boolean;
  hideLabelWhenEmpty?: boolean;
}) {
  if (!value || !value.trim()) {
    if (hideLabelWhenEmpty) {
      return <p className="italic text-muted-foreground">Sin observaciones diligenciadas.</p>;
    }
    return null;
  }

  if (block) {
    return (
      <div className="space-y-0.5">
        {label && <span className="block text-muted-foreground">{label}</span>}
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{value}</p>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
