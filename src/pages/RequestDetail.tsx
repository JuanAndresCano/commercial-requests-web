import { useState, type ReactNode } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
  Trash2,
  RotateCcw,
  AlertCircle,
  Edit3,
  ClipboardList,
  History,
} from "@/components/icons";
import { format, formatDistanceToNow } from "date-fns";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  formatCop,
  RequestItem,
  ProposalCosting,
  ProposalDocument,
  ExternalProfessorData,
  calculateCosting,
  REQUEST_TYPES,
  URGENCY_META,
  type RequestType,
  type Urgency,
  type NegotiationRound,
} from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { AdvisorAssignmentModal } from "@/components/costing/AdvisorAssignmentModal";
import { ProposalCostingModule } from "@/components/costing/ProposalCostingModule";
import { ProposalDocumentsSection } from "@/components/costing/ProposalDocumentsSection";
import { ReassignLeaderDialog } from "@/components/ReassignLeaderDialog";
import { useReassignRequest } from "@/hooks/use-reassign-request";
import { toast } from "sonner";

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    requests,
    user,
    assignProfessorDetailed,
    updateCosting,
    addDocument,
    removeDocument,
    updateStatus,
    updateRequest,
    deleteRequest,
  } = useAuth();

  const role = user.role;
  const isKam = role === "kam";
  const isLeader = role === "lider-producto" || role === "lider-nodo";

  const req: RequestItem = requests.find((r) => r.id === id) ?? requests[0];

  // Se encontró que se podía marcar "Entregada" con costeo en $0 (nadie lo
  // había tocado, o se puso en $0 a propósito): ni "Marcar Entregada" ni
  // "Enviar a cliente" validaban que hubiera un valor real antes de cerrar
  // el ciclo comercial. Este es el único punto de verdad para esa regla.
  const hasValidCosting = !!req.costing && req.costing.totalOfferedCop > 0;

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isContactAdvisorModalOpen, setIsContactAdvisorModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnObservations, setReturnObservations] = useState("");
  // Diálogo dedicado para "Enviar a KAM" (docs/12): a partir de la ronda 2
  // exige una nota del motivo del ajuste, algo que el diálogo genérico
  // CONFIRM_ACTION_META no puede expresar (no admite campos condicionales).
  const [isSendToKamModalOpen, setIsSendToKamModalOpen] = useState(false);
  const [sendToKamNote, setSendToKamNote] = useState("");
  const [showFullInfo, setShowFullInfo] = useState(false);

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

  // El KAM es dueño de la información de su solicitud (empresa, contacto,
  // diagnóstico, formación previa) y puede corregirla mientras nadie la haya
  // empezado a trabajar — Dianis confirmó esto en docs/08, preguntas 4 y 8.
  // El Líder de Producto, además, puede corregir el alcance (sobre todo
  // `necesidad`) mientras está costeando — es el punto natural para ajustar
  // la solicitud tras un rechazo del cliente (docs/13).
  const canEditFullInfo =
    (isKam && req.kam === user.name && req.status === "nueva") ||
    (role === "lider-producto" && req.productLeader === user.name && req.status === "en-costeo");
  const fullInfoCompleteness = getFullInfoCompleteness(req);
  const [isEditingFullInfo, setIsEditingFullInfo] = useState(false);
  const emptyFullInfoDraft = {
    title: "",
    urgency: "media" as Urgency,
    companyNit: "",
    companyDireccion: "",
    companyTelefono: "",
    companyCorreo: "",
    companyCiiuPrincipal: "",
    companyCiiuPrincipalDesc: "",
    companyTipo: "",
    companyWeb: "",
    companyDescripcion: "",
    applicant: "",
    contactCargo: "",
    contactArea: "",
    contactTelefono: "",
    contactTelefonoSecundario: "",
    contactCorreo: "",
    contactCorreoAlternativo: "",
    necesidad: "",
    competencias: "",
    exito: "",
    resultados: "",
    areaParticipantes: "",
    alimentacion: "",
    formacionPrevia: "" as "Sí" | "No" | "No sé" | "",
    descFormacion: "",
    empresaPrevia: "",
    fechaPrevia: "",
    observaciones: "",
  };
  const [fullInfoDraft, setFullInfoDraft] = useState(emptyFullInfoDraft);
  // Copia de referencia tomada al abrir el modal — permite detectar cambios
  // sin guardar y advertir antes de cerrar (mejora de UX pedida en el ciclo
  // de retroalimentación).
  const [fullInfoSnapshot, setFullInfoSnapshot] = useState(emptyFullInfoDraft);
  const isFullInfoDirty = JSON.stringify(fullInfoDraft) !== JSON.stringify(fullInfoSnapshot);

  const handleStartEditFullInfo = () => {
    const initial: typeof emptyFullInfoDraft = {
      title: req.title,
      urgency: req.urgency,
      companyNit: req.companyNit ?? "",
      companyDireccion: req.companyDireccion ?? "",
      companyTelefono: req.companyTelefono ?? "",
      companyCorreo: req.companyCorreo ?? "",
      companyCiiuPrincipal: req.companyCiiuPrincipal ?? "",
      companyCiiuPrincipalDesc: req.companyCiiuPrincipalDesc ?? "",
      companyTipo: req.companyTipo ?? "",
      companyWeb: req.companyWeb ?? "",
      companyDescripcion: req.companyDescripcion ?? "",
      applicant: req.applicant ?? "",
      contactCargo: req.contactCargo ?? "",
      contactArea: req.contactArea ?? "",
      contactTelefono: req.contactTelefono ?? "",
      contactTelefonoSecundario: req.contactTelefonoSecundario ?? "",
      contactCorreo: req.contactCorreo ?? "",
      contactCorreoAlternativo: req.contactCorreoAlternativo ?? "",
      necesidad: req.necesidad ?? "",
      competencias: req.competencias ?? "",
      exito: req.exito ?? "",
      resultados: req.resultados ?? "",
      areaParticipantes: req.areaParticipantes ?? "",
      alimentacion: req.alimentacion ?? "",
      formacionPrevia: req.formacionPrevia ?? "",
      descFormacion: req.descFormacion ?? "",
      empresaPrevia: req.empresaPrevia ?? "",
      fechaPrevia: req.fechaPrevia ?? "",
      observaciones: req.observaciones ?? "",
    };
    setFullInfoDraft(initial);
    setFullInfoSnapshot(initial);
    setShowFullInfo(true);
    setIsEditingFullInfo(true);
  };

  // Validación de formato para correos y teléfonos — son campos opcionales,
  // así que solo se marcan como error si traen algo y ese algo no cumple el
  // formato mínimo esperado.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[0-9+()\-\s]{7,}$/;
  const fullInfoErrors: Partial<Record<keyof typeof fullInfoDraft, string>> = {};
  if (fullInfoDraft.companyCorreo.trim() && !EMAIL_RE.test(fullInfoDraft.companyCorreo.trim())) {
    fullInfoErrors.companyCorreo = "Correo con formato inválido";
  }
  if (fullInfoDraft.contactCorreo.trim() && !EMAIL_RE.test(fullInfoDraft.contactCorreo.trim())) {
    fullInfoErrors.contactCorreo = "Correo con formato inválido";
  }
  if (fullInfoDraft.contactCorreoAlternativo.trim() && !EMAIL_RE.test(fullInfoDraft.contactCorreoAlternativo.trim())) {
    fullInfoErrors.contactCorreoAlternativo = "Correo con formato inválido";
  }
  if (fullInfoDraft.companyTelefono.trim() && !PHONE_RE.test(fullInfoDraft.companyTelefono.trim())) {
    fullInfoErrors.companyTelefono = "Teléfono con formato inválido";
  }
  if (fullInfoDraft.contactTelefono.trim() && !PHONE_RE.test(fullInfoDraft.contactTelefono.trim())) {
    fullInfoErrors.contactTelefono = "Teléfono con formato inválido";
  }
  if (fullInfoDraft.contactTelefonoSecundario.trim() && !PHONE_RE.test(fullInfoDraft.contactTelefonoSecundario.trim())) {
    fullInfoErrors.contactTelefonoSecundario = "Teléfono con formato inválido";
  }
  const hasFullInfoErrors = Object.keys(fullInfoErrors).length > 0;

  const handleSaveFullInfo = () => {
    if (!fullInfoDraft.title.trim()) {
      toast.error("El título de la propuesta no puede quedar vacío");
      return;
    }
    if (hasFullInfoErrors) {
      toast.error("Corrige los campos marcados antes de guardar");
      return;
    }
    updateRequest(req.id, {
      ...fullInfoDraft,
      title: fullInfoDraft.title.trim(),
      formacionPrevia: fullInfoDraft.formacionPrevia || undefined,
      fullInfoUpdatedAt: new Date().toISOString(),
    });
    setIsEditingFullInfo(false);
    toast.success("Información de la solicitud actualizada");
  };

  // Si hay cambios sin guardar, confirma antes de cerrar el modal (clic
  // afuera, Esc, o botón Cancelar) para no perderlos por accidente.
  const handleCloseFullInfoModal = () => {
    if (isFullInfoDirty && !window.confirm("Tienes cambios sin guardar en esta solicitud. ¿Descartarlos?")) {
      return;
    }
    setIsEditingFullInfo(false);
  };

  const reassignRequest = useReassignRequest(updateRequest);

  const handleConfirmReassign = ({ newLeader, newNode }: { newLeader: string; newNode: string }) => {
    reassignRequest(req, { newLeader, newNode });
    toast.success(`Solicitud ${req.id} reasignada a ${newLeader} exitosamente.`);
    setIsReassignModalOpen(false);
  };

  // Borrador vacío solo para alimentar el formulario de costeo del Líder de
  // Producto — nunca se muestra como si fuera un valor ya definido.
  const currentCosting: ProposalCosting =
    req.costing ?? calculateCosting(req.type, 0, 30);

  const clientKamDocs: ProposalDocument[] = req.clientKamDocuments ?? [];
  const internalCostingDocs: ProposalDocument[] = req.internalCostingDocuments ?? [];

  // Historial de negociación (docs/12): la ronda que se abriría al confirmar
  // "Enviar a KAM" y la última devolución del cliente, para dar contexto en
  // el diálogo sin que el Líder tenga que ir a buscarla al historial.
  const negotiationRounds: NegotiationRound[] = req.negotiationRounds ?? [];
  // Si ya hay una ronda "pendiente" que nunca llegó a entregarse al cliente
  // (el Líder la invalidó editando el costeo antes de que el KAM alcanzara a
  // enviarla — ver ProposalCostingModule), reenviar debe actualizar esa misma
  // ronda, no abrir una nueva: el cliente nunca llegó a ver ese número, así
  // que no cuenta como una renegociación adicional.
  const unsentPendingRound = negotiationRounds.find(
    (round) => round.clientResponse === "pendiente" && !round.sentToClientAt
  );
  const nextRoundNumber = unsentPendingRound?.roundNumber ?? negotiationRounds.length + 1;
  const lastRejectedRound = [...negotiationRounds]
    .reverse()
    .find((round) => round.clientResponse === "rechazada");

  const handleSaveAssignment = (
    professorName: string,
    type: "planta" | "externo",
    externalData?: ExternalProfessorData
  ) => {
    // El indicador de "asesor externo" del costeo ya no es un campo propio:
    // se deriva de `professorType`/`professor`/`externalProfessorData` (docs/13,
    // gap #11), así que asignar el docente/asesor aquí ya deja todo consistente
    // sin tocar `req.costing`.
    assignProfessorDetailed(req.id, professorName, type, externalData);
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

  // Gate explícito del Líder de Producto antes de que el KAM pueda actuar
  // (docs/11, Requisito 2): marca el costeo como enviado al KAM. Se
  // construye a partir del costeo ya persistido (`req.costing`) para no
  // pisar ningún campo — solo se cambia `readyForKam`.
  // Además (docs/12) abre una nueva ronda de negociación con un snapshot del
  // valor final vigente — `leaderNote` es obligatoria desde la ronda 2 y se
  // valida en la UI del diálogo dedicado antes de poder confirmar.
  const handleMarkReadyForKam = (leaderNote?: string) => {
    if (!req.costing) return;
    const now = new Date().toISOString();
    let updatedRounds: NegotiationRound[];
    if (unsentPendingRound) {
      // Se actualiza en el mismo lugar del arreglo, conservando su id y
      // roundNumber — sigue siendo la misma ronda, solo con el valor y la
      // fecha de envío refrescados (y la nota, si el Líder escribió una nueva).
      updatedRounds = negotiationRounds.map((round) =>
        round.id === unsentPendingRound.id
          ? {
              ...round,
              totalOfferedCop: req.costing!.totalOfferedCop,
              marginAmountCop: req.costing!.marginAmountCop,
              expectedMarginPercent: req.costing!.expectedMarginPercent,
              leaderNote: leaderNote?.trim() || round.leaderNote,
              sentToKamAt: now,
              // Snapshot de alcance (docs/13): se toma de `req`, no de
              // `req.costing`, y se refresca aunque la ronda ya existiera —
              // el Líder pudo haber corregido el alcance antes de reenviar.
              participantes: req.participantes,
              modalidad: req.modalidad,
              horas: req.horas,
              type: req.type,
              necesidad: req.necesidad,
            }
          : round
      );
    } else {
      const roundNumber = negotiationRounds.length + 1;
      const newRound: NegotiationRound = {
        id: `${req.id}-r${roundNumber}`,
        roundNumber,
        totalOfferedCop: req.costing.totalOfferedCop,
        marginAmountCop: req.costing.marginAmountCop,
        expectedMarginPercent: req.costing.expectedMarginPercent,
        leaderNote: leaderNote?.trim() || undefined,
        sentToKamAt: now,
        clientResponse: "pendiente",
        // Snapshot de alcance vigente al momento del envío (docs/13).
        participantes: req.participantes,
        modalidad: req.modalidad,
        horas: req.horas,
        type: req.type,
        necesidad: req.necesidad,
      };
      updatedRounds = [...negotiationRounds, newRound];
    }
    updateRequest(req.id, {
      costing: { ...req.costing, readyForKam: true, costingSentAt: now },
      negotiationRounds: updatedRounds,
    });
    toast.success("Costeo enviado al KAM");
  };

  const handleSendToClient = () => {
    // Defensa adicional además del `disabled` del botón — por si el estado
    // cambia entre que se abre el diálogo de confirmación y se confirma.
    if (!hasValidCosting) {
      toast.error("No se puede entregar sin un valor ofertado mayor a $0");
      setConfirmingAction(null);
      return;
    }
    if (!req.costing?.readyForKam) {
      toast.error("El Líder de Producto aún no ha confirmado el envío del costeo");
      setConfirmingAction(null);
      return;
    }
    const now = new Date().toISOString();
    // Cierra el envío de la ronda pendiente (debería ser la última) con la
    // fecha de entrega efectiva al cliente (docs/12).
    const updatedRounds = negotiationRounds.map((round) =>
      round.clientResponse === "pendiente" ? { ...round, sentToClientAt: now } : round
    );
    // Al reentregar (por ejemplo tras una devolución con observaciones) se
    // limpia la nota anterior — ya quedó resuelta en la nueva versión.
    updateRequest(req.id, {
      status: "entregada",
      clientObservations: undefined,
      negotiationRounds: updatedRounds,
    });
    toast.success("Propuesta enviada al cliente y marcada como Entregada");
    setConfirmingAction(null);
  };

  // El KAM puede cancelar su propia solicitud mientras nadie la haya
  // empezado a trabajar (docs/08, pregunta 14).
  const handleCancelRequest = () => {
    deleteRequest(req.id);
    toast.success(`Solicitud ${req.id} cancelada`);
    setIsCancelModalOpen(false);
    navigate("/dashboard");
  };

  // Si el cliente pide ajustes tras la entrega, el KAM la devuelve a costeo
  // con una nota de observaciones para el Líder de Producto (docs/08, pregunta 13).
  const handleReturnWithObservations = () => {
    const now = new Date().toISOString();
    const trimmedObservations = returnObservations.trim() || undefined;
    // Marca la ronda pendiente (debería ser la última) como rechazada con la
    // observación del cliente (docs/12).
    const updatedRounds = negotiationRounds.map((round) =>
      round.clientResponse === "pendiente"
        ? {
            ...round,
            clientResponse: "rechazada" as const,
            clientObservation: trimmedObservations,
            clientRespondedAt: now,
          }
        : round
    );
    updateRequest(req.id, {
      status: "en-costeo",
      clientObservations: trimmedObservations,
      negotiationRounds: updatedRounds,
      // Bug encontrado en docs/12: al volver a "en-costeo" el gate del Líder
      // (docs/11, Requisito 2) quedaba con `readyForKam`/`costingSentAt` del
      // ciclo anterior, así que el botón "Enviar a cliente" del KAM se
      // re-habilitaba antes de que el Líder tocara nada. Se resetea aquí.
      costing: req.costing
        ? { ...req.costing, readyForKam: false, costingSentAt: undefined }
        : req.costing,
    });
    toast.success("Propuesta devuelta a costeo con las observaciones del cliente");
    setIsReturnModalOpen(false);
    setReturnObservations("");
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
                      className="h-9 px-4 text-xs font-bold bg-icesi-blue hover:bg-[#4343d0] text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
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
                      className="h-9 px-4 text-xs font-bold bg-icesi-blue hover:bg-[#4343d0] text-white shadow-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Avanzar a En Costeo
                    </Button>
                  )}

                  {/* El Líder de Producto ya no puede marcar "Entregada" directamente:
                      esa es la acción del KAM (envía al cliente). El trabajo del Líder
                      termina en confirmar explícitamente que el costeo está listo para
                      que el KAM pueda actuar (docs/11, Requisito 2). */}
                  {req.status === "en-costeo" && hasValidCosting && !req.costing?.readyForKam && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSendToKamNote("");
                        setIsSendToKamModalOpen(true);
                      }}
                      className="h-9 px-4 text-xs font-bold bg-icesi-blue hover:bg-[#4343d0] text-white shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Enviar a KAM
                    </Button>
                  )}

                  {req.status === "en-costeo" && hasValidCosting && req.costing?.readyForKam && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#4cb979]/30 bg-[#4cb979]/10 px-3 py-1.5 text-xs font-bold text-[#4cb979]">
                      <Check className="h-3.5 w-3.5" />
                      Enviado al KAM — a la espera de envío al cliente
                      {req.costing.costingSentAt && (
                        <span className="font-medium text-muted-foreground">
                          (hace {formatDistanceToNow(new Date(req.costing.costingSentAt), { locale: es })})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Insignia sólida y propia — es el cierre del flujo, no un paso
                      intermedio, así que no debe verse igual que "Enviado al KAM". */}
                  {req.status === "entregada" && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#4cb979] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
                      <CheckCircle2 className="h-4 w-4" /> Propuesta Entregada
                    </div>
                  )}
                </>
              ) : isKam && req.status === "en-costeo" ? (
                <Button
                  size="sm"
                  disabled={!hasValidCosting || !req.costing?.readyForKam}
                  onClick={() => setConfirmingAction("entregada")}
                  className="h-9 px-4 text-xs font-bold bg-[#5454e9] hover:bg-[#4343d3] text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  title={
                    !hasValidCosting
                      ? "El Líder de Producto aún no ha definido un valor real para esta propuesta"
                      : !req.costing?.readyForKam
                      ? "El Líder de Producto aún no ha confirmado el envío del costeo"
                      : undefined
                  }
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Enviar a cliente
                </Button>
              ) : isKam && req.status === "entregada" ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#4cb979]/30 bg-[#4cb979]/10 px-3 py-1.5 text-xs font-bold text-[#4cb979]">
                    <Check className="h-3.5 w-3.5" /> Propuesta Entregada
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReturnModalOpen(true)}
                    className="h-9 px-3 text-xs font-medium border-border hover:bg-secondary text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    Devolver con observaciones
                  </Button>
                </>
              ) : isKam && req.status === "nueva" && req.kam === user.name ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="h-9 px-3 text-xs font-medium border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Cancelar solicitud
                </Button>
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
            {/* Observaciones del cliente tras una devolución — visibles para
                ambos roles hasta que el Líder reentregue una versión corregida. */}
            {req.clientObservations && req.clientObservations.trim() && (
              <div className="rounded-xl border border-amber-300/60 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    El cliente pidió ajustes — propuesta devuelta a costeo
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed whitespace-pre-wrap">
                    {req.clientObservations}
                  </p>
                </div>
              </div>
            )}

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

                {/* El KAM solo ve el valor total y el desglose que efectivamente se le
                    presenta al cliente (valor + estampilla). El costo base y el margen
                    de contribución son información interna del costeo, exclusiva del
                    Líder de Producto — ver docs/08, pregunta 3. */}
                {req.type === "Capacitación" && (
                  <div className="grid grid-cols-1 gap-2.5 pt-1 text-xs sm:max-w-[220px]">
                    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-border dark:bg-secondary/20">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                        Estampilla Pro-Cultura ({req.costing.proCulturaTaxPercent}%)
                      </span>
                      <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                        +{formatCop(req.costing.proCulturaTaxAmount)}
                      </span>
                    </div>
                  </div>
                )}

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

            {/* 3. HISTORIAL DE NEGOCIACIÓN (docs/12) — solo si ya hay más de un
                envío al KAM; con una sola ronda en curso no hace falta mostrar
                "historial". Visible para Líder y KAM. */}
            {negotiationRounds.length > 0 && (
              <div className="rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] p-5 sm:p-6 shadow-xs space-y-4">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border dark:border-[#252838] pb-3">
                  <History className="h-3.5 w-3.5" />
                  Historial de Negociación
                </h2>

                <div className="space-y-3">
                  {negotiationRounds.map((round, idx) => {
                    const isCurrentRound =
                      round.clientResponse === "pendiente" && idx === negotiationRounds.length - 1;
                    const scopeDiffs = getScopeDiffs(round, negotiationRounds[idx - 1]);
                    return (
                      <div
                        key={round.id}
                        className={cn(
                          "rounded-lg border p-3.5 text-xs space-y-2",
                          isCurrentRound
                            ? "border-[#5454e9]/40 bg-[#5454e9]/5 dark:bg-[#5454e9]/10"
                            : "border-border dark:border-[#252838] bg-secondary/20 dark:bg-secondary/10"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">
                              Ronda {round.roundNumber}
                            </span>
                            <span className="font-mono font-semibold text-foreground">
                              {formatCop(round.totalOfferedCop)}
                            </span>
                          </div>
                          {isCurrentRound && (
                            <span className="rounded-full bg-[#5454e9] px-2 py-0.5 text-[10px] font-bold text-white">
                              Ronda vigente
                            </span>
                          )}
                        </div>

                        <p className="text-muted-foreground">
                          Enviada a KAM el {format(new Date(round.sentToKamAt), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>

                        {round.sentToClientAt && (
                          <p className="flex items-center gap-1.5 text-[#5454e9] dark:text-[#865cf0] font-medium">
                            <Send className="h-3 w-3" />
                            → entregada al cliente el {format(new Date(round.sentToClientAt), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        )}

                        {round.clientResponse === "rechazada" && (
                          <div className="rounded-lg border border-amber-300/60 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-2.5 space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              <RotateCcw className="h-3 w-3" /> Devuelta por el cliente
                            </span>
                            {round.clientObservation && (
                              <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
                                Cliente: "{round.clientObservation}"
                              </p>
                            )}
                            {round.clientRespondedAt && (
                              <p className="text-[11px] text-amber-600/80 dark:text-amber-500/70">
                                Devuelta el {format(new Date(round.clientRespondedAt), "d 'de' MMMM, yyyy", { locale: es })}
                              </p>
                            )}
                          </div>
                        )}

                        {round.leaderNote && (
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            <span className="font-semibold text-foreground">Motivo del ajuste: </span>
                            "{round.leaderNote}"
                          </p>
                        )}

                        {scopeDiffs.length > 0 && (
                          <div className="rounded-lg border border-border dark:border-[#252838] bg-secondary/30 dark:bg-secondary/10 p-2.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Cambios de alcance frente a la ronda anterior
                            </span>
                            <ul className="space-y-0.5">
                              {scopeDiffs.map((diff) => (
                                <li key={diff} className="text-foreground leading-relaxed break-words">
                                  {diff}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                    {role === "lider-producto" && (req.status === "nueva" || req.status === "en-experto") && (
                      <button
                        type="button"
                        onClick={() => setIsReassignModalOpen(true)}
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
      <div className="pt-1">
        <h2 className="mb-2.5 px-0.5 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Detalle completo de la solicitud
        </h2>

        <div className="rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] shadow-xs overflow-hidden">
          <div
            className={cn(
              "flex items-center justify-between gap-3 p-5",
              showFullInfo && "border-b border-border dark:border-[#252838]"
            )}
          >
            <button
              type="button"
              onClick={() => setShowFullInfo((v) => !v)}
              className="flex flex-1 min-w-0 items-center gap-3 text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/70 dark:bg-secondary/20">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground">
                  Información completa de la solicitud
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {fullInfoCompleteness.filled} de {fullInfoCompleteness.total} campos diligenciados
                  {req.fullInfoUpdatedAt &&
                    ` · Editado ${formatDistanceToNow(new Date(req.fullInfoUpdatedAt), { addSuffix: true, locale: es })}`}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              {canEditFullInfo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleStartEditFullInfo}
                  className="h-8 px-3 text-xs font-semibold border-[#5454e9]/30 text-[#5454e9] dark:text-[#865cf0] hover:bg-[#5454e9]/10"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  Editar información
                </Button>
              )}
              <button
                type="button"
                onClick={() => setShowFullInfo((v) => !v)}
                aria-label={showFullInfo ? "Contraer sección" : "Expandir sección"}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary/70 dark:hover:bg-secondary/20 transition-colors"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", showFullInfo && "rotate-180")} />
              </button>
            </div>
          </div>

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
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR INFORMACIÓN COMPLETA (KAM, solo mientras "Nueva") */}
      {/* ========================================================================= */}
      <Dialog open={isEditingFullInfo} onOpenChange={(open) => !open && handleCloseFullInfoModal()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Editar información de la solicitud
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isKam
                ? 'Corrige los datos que diligenciaste al crear la solicitud. Disponible solo mientras esté en estado "Nueva".'
                : 'Corrige el alcance de la solicitud (por ejemplo la necesidad del cliente) mientras esté "En proceso de costeo".'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-2">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
              <TabsTrigger value="general" className="text-[11px] py-1.5">General</TabsTrigger>
              <TabsTrigger value="empresa" className="text-[11px] py-1.5">Empresa</TabsTrigger>
              <TabsTrigger value="contacto" className="text-[11px] py-1.5">Contacto</TabsTrigger>
              <TabsTrigger value="diagnostico" className="text-[11px] py-1.5">Diagnóstico</TabsTrigger>
              <TabsTrigger value="formacion" className="text-[11px] py-1.5">Formación</TabsTrigger>
              <TabsTrigger value="observaciones" className="text-[11px] py-1.5">Otros</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-2.5 pt-4">
              <EditableField label="Título de la propuesta" value={fullInfoDraft.title} onChange={(v) => setFullInfoDraft((d) => ({ ...d, title: v }))} />
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Urgencia</Label>
                <Select
                  value={fullInfoDraft.urgency}
                  onValueChange={(v) => setFullInfoDraft((d) => ({ ...d, urgency: v as Urgency }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Seleccionar urgencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(URGENCY_META) as Urgency[]).map((u) => (
                      <SelectItem key={u} value={u}>{URGENCY_META[u].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="empresa" className="space-y-2.5 pt-4">
              <EditableField label="NIT" value={fullInfoDraft.companyNit} onChange={(v) => setFullInfoDraft((d) => ({ ...d, companyNit: v }))} />
              <EditableField label="Dirección" value={fullInfoDraft.companyDireccion} onChange={(v) => setFullInfoDraft((d) => ({ ...d, companyDireccion: v }))} />
              <EditableField label="Teléfono" value={fullInfoDraft.companyTelefono} onChange={(v) => setFullInfoDraft((d) => ({ ...d, companyTelefono: v }))} error={fullInfoErrors.companyTelefono} />
              <EditableField label="Correo" value={fullInfoDraft.companyCorreo} onChange={(v) => setFullInfoDraft((d) => ({ ...d, companyCorreo: v }))} error={fullInfoErrors.companyCorreo} />
              <EditableField label="CIIU principal" value={fullInfoDraft.companyCiiuPrincipal} onChange={(v) => setFullInfoDraft((d) => ({ ...d, companyCiiuPrincipal: v }))} />
              <EditableField label="Descripción CIIU" value={fullInfoDraft.companyCiiuPrincipalDesc} onChange={(v) => setFullInfoDraft((d) => ({ ...d, companyCiiuPrincipalDesc: v }))} />
              <EditableField label="Naturaleza jurídica" value={fullInfoDraft.companyTipo} onChange={(v) => setFullInfoDraft((d) => ({ ...d, companyTipo: v }))} />
              <EditableField label="Sitio web" value={fullInfoDraft.companyWeb} onChange={(v) => setFullInfoDraft((d) => ({ ...d, companyWeb: v }))} />
              <EditableField label="Descripción" value={fullInfoDraft.companyDescripcion} onChange={(v) => setFullInfoDraft((d) => ({ ...d, companyDescripcion: v }))} block />
            </TabsContent>

            <TabsContent value="contacto" className="space-y-2.5 pt-4">
              <EditableField label="Nombre" value={fullInfoDraft.applicant} onChange={(v) => setFullInfoDraft((d) => ({ ...d, applicant: v }))} />
              <EditableField label="Cargo" value={fullInfoDraft.contactCargo} onChange={(v) => setFullInfoDraft((d) => ({ ...d, contactCargo: v }))} />
              <EditableField label="Área o dependencia" value={fullInfoDraft.contactArea} onChange={(v) => setFullInfoDraft((d) => ({ ...d, contactArea: v }))} />
              <EditableField label="Teléfono" value={fullInfoDraft.contactTelefono} onChange={(v) => setFullInfoDraft((d) => ({ ...d, contactTelefono: v }))} error={fullInfoErrors.contactTelefono} />
              <EditableField label="Teléfono secundario" value={fullInfoDraft.contactTelefonoSecundario} onChange={(v) => setFullInfoDraft((d) => ({ ...d, contactTelefonoSecundario: v }))} error={fullInfoErrors.contactTelefonoSecundario} />
              <EditableField label="Correo" value={fullInfoDraft.contactCorreo} onChange={(v) => setFullInfoDraft((d) => ({ ...d, contactCorreo: v }))} error={fullInfoErrors.contactCorreo} />
              <EditableField label="Correo alternativo" value={fullInfoDraft.contactCorreoAlternativo} onChange={(v) => setFullInfoDraft((d) => ({ ...d, contactCorreoAlternativo: v }))} error={fullInfoErrors.contactCorreoAlternativo} />
              {req.additionalContacts && req.additionalContacts.length > 0 && (
                <p className="text-[11px] italic text-muted-foreground pt-1">
                  Los contactos adicionales no son editables aquí todavía — vuelve al wizard si necesitas corregirlos.
                </p>
              )}
            </TabsContent>

            <TabsContent value="diagnostico" className="space-y-2.5 pt-4">
              <EditableField label="Necesidad o problema a resolver" value={fullInfoDraft.necesidad} onChange={(v) => setFullInfoDraft((d) => ({ ...d, necesidad: v }))} block />
              <EditableField label="Competencias a fortalecer" value={fullInfoDraft.competencias} onChange={(v) => setFullInfoDraft((d) => ({ ...d, competencias: v }))} block />
              <EditableField label="Cómo se medirá el éxito" value={fullInfoDraft.exito} onChange={(v) => setFullInfoDraft((d) => ({ ...d, exito: v }))} block />
              <EditableField label="Resultados esperados" value={fullInfoDraft.resultados} onChange={(v) => setFullInfoDraft((d) => ({ ...d, resultados: v }))} block />
              <EditableField label="Perfil o área de los participantes" value={fullInfoDraft.areaParticipantes} onChange={(v) => setFullInfoDraft((d) => ({ ...d, areaParticipantes: v }))} />
              <EditableField label="Servicio de alimentación y logística" value={fullInfoDraft.alimentacion} onChange={(v) => setFullInfoDraft((d) => ({ ...d, alimentacion: v }))} block />
            </TabsContent>

            <TabsContent value="formacion" className="space-y-2.5 pt-4">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">¿Han tenido formación previa con Icesi?</Label>
                <Select
                  value={fullInfoDraft.formacionPrevia || undefined}
                  onValueChange={(v) => setFullInfoDraft((d) => ({ ...d, formacionPrevia: v as "Sí" | "No" | "No sé" }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sí">Sí</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="No sé">No sé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {fullInfoDraft.formacionPrevia === "Sí" && (
                <>
                  <EditableField label="Descripción" value={fullInfoDraft.descFormacion} onChange={(v) => setFullInfoDraft((d) => ({ ...d, descFormacion: v }))} block />
                  <EditableField label="Empresa que la dictó" value={fullInfoDraft.empresaPrevia} onChange={(v) => setFullInfoDraft((d) => ({ ...d, empresaPrevia: v }))} />
                  <EditableField label="Fecha aproximada" value={fullInfoDraft.fechaPrevia} onChange={(v) => setFullInfoDraft((d) => ({ ...d, fechaPrevia: v }))} />
                </>
              )}
            </TabsContent>

            <TabsContent value="observaciones" className="space-y-2.5 pt-4">
              <EditableField label="Observaciones del KAM" value={fullInfoDraft.observaciones} onChange={(v) => setFullInfoDraft((d) => ({ ...d, observaciones: v }))} block />
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCloseFullInfoModal} className="text-xs">
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveFullInfo}
              disabled={hasFullInfoErrors}
              className="text-xs bg-[#5454e9] hover:bg-[#4343d3] text-white disabled:opacity-50"
            >
              Guardar información
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      <ReassignLeaderDialog
        request={isReassignModalOpen ? req : null}
        onOpenChange={setIsReassignModalOpen}
        onConfirm={handleConfirmReassign}
      />

      {/* Modal: Cancelar solicitud (KAM, solo mientras está "Nueva") */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              ¿Cancelar esta solicitud?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Se eliminará permanentemente la solicitud {req.id} ({req.company}). Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)} className="text-xs">
              Volver
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCancelRequest}
              className="text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, cancelar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Devolver con observaciones (KAM, desde "Entregada") */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Devolver propuesta con observaciones
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              La solicitud vuelve a "En proceso de costeo" para que el Líder de Producto ajuste la propuesta según lo que pidió el cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="return-observations" className="text-xs font-semibold text-foreground">
              Observaciones del cliente
            </Label>
            <Textarea
              id="return-observations"
              rows={4}
              placeholder="Ej. El cliente pidió reducir el alcance a 40 horas y ajustar el valor..."
              value={returnObservations}
              onChange={(e) => setReturnObservations(e.target.value)}
              className="text-xs resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsReturnModalOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!returnObservations.trim()}
              onClick={handleReturnWithObservations}
              className="text-xs bg-[#5454e9] hover:bg-[#4343d3] text-white"
            >
              Devolver a costeo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal dedicado: Enviar a KAM (docs/12) — el diálogo genérico
          CONFIRM_ACTION_META no admite un campo de texto condicional, así
          que esta acción se sacó de ese patrón. Desde la ronda 2 exige una
          nota del motivo del ajuste y muestra la observación del cliente de
          la ronda anterior como contexto. */}
      <Dialog
        open={isSendToKamModalOpen}
        onOpenChange={(open) => {
          setIsSendToKamModalOpen(open);
          if (!open) setSendToKamNote("");
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {nextRoundNumber === 1
                ? '¿Enviar el costeo al KAM?'
                : `¿Enviar el ajuste al KAM? (Ronda ${nextRoundNumber})`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Confirma que el valor final de la propuesta ya está listo. El KAM podrá enviarla al cliente a partir de este momento.
            </DialogDescription>
          </DialogHeader>

          {nextRoundNumber > 1 && (
            <div className="space-y-3 py-1">
              {lastRejectedRound?.clientObservation && (
                <div className="rounded-lg border border-amber-300/60 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-3 flex items-start gap-2.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      El cliente devolvió la ronda {lastRejectedRound.roundNumber} con esta observación:
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed whitespace-pre-wrap">
                      "{lastRejectedRound.clientObservation}"
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="send-to-kam-note" className="text-xs font-semibold text-foreground">
                  Motivo del ajuste *
                </Label>
                <Textarea
                  id="send-to-kam-note"
                  rows={3}
                  placeholder="Explica qué cambió frente a la propuesta anterior..."
                  value={sendToKamNote}
                  onChange={(e) => setSendToKamNote(e.target.value)}
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
              onClick={() => setIsSendToKamModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={nextRoundNumber > 1 && !sendToKamNote.trim()}
              onClick={() => {
                handleMarkReadyForKam(nextRoundNumber > 1 ? sendToKamNote : undefined);
                setIsSendToKamModalOpen(false);
                setSendToKamNote("");
              }}
              className="text-xs bg-[#5454e9] hover:bg-[#4343d0] text-white disabled:opacity-50"
            >
              Sí, enviar al KAM
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

// Campos que cuentan para el indicador de completitud de "Información
// completa de la solicitud" — le da al KAM una idea rápida de qué tan
// diligenciada está la solicitud, sin tener que expandir la sección.
const FULL_INFO_BASE_FIELDS: (keyof RequestItem)[] = [
  "companyNit", "companyDireccion", "companyTelefono", "companyCorreo",
  "companyCiiuPrincipal", "companyCiiuPrincipalDesc", "companyTipo", "companyWeb", "companyDescripcion",
  "applicant", "contactCargo", "contactArea", "contactTelefono", "contactTelefonoSecundario", "contactCorreo", "contactCorreoAlternativo",
  "necesidad", "competencias", "exito", "resultados", "areaParticipantes", "alimentacion",
  "formacionPrevia", "observaciones",
];

function isFilledString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function getFullInfoCompleteness(req: RequestItem): { filled: number; total: number } {
  let total = FULL_INFO_BASE_FIELDS.length;
  let filled = FULL_INFO_BASE_FIELDS.filter((k) => isFilledString(req[k])).length;

  // La formación previa detallada solo cuenta si aplica (el KAM respondió "Sí").
  if (req.formacionPrevia === "Sí") {
    const extraFields: (keyof RequestItem)[] = ["descFormacion", "empresaPrevia", "fechaPrevia"];
    total += extraFields.length;
    filled += extraFields.filter((k) => isFilledString(req[k])).length;
  }

  return { filled, total };
}

// Campos de alcance que cada ronda de negociación congela (docs/13) — si
// alguno cambió respecto a la ronda anterior, el historial lo muestra como
// parte del resumen de la ronda ("Participantes: 15-20 → 9-12"). La ronda 1
// nunca tiene con qué compararse, así que no muestra diffs.
const SCOPE_DIFF_FIELDS: { key: keyof NegotiationRound; label: string }[] = [
  { key: "participantes", label: "Participantes" },
  { key: "modalidad", label: "Modalidad" },
  { key: "horas", label: "Horas" },
  { key: "type", label: "Tipo de servicio" },
  { key: "necesidad", label: "Necesidad" },
];

function getScopeDiffs(round: NegotiationRound, previousRound?: NegotiationRound): string[] {
  if (!previousRound) return [];
  const diffs: string[] = [];
  for (const { key, label } of SCOPE_DIFF_FIELDS) {
    const prevValue = previousRound[key];
    const newValue = round[key];
    if (prevValue !== undefined && newValue !== undefined && prevValue !== newValue) {
      diffs.push(`${label}: ${prevValue} → ${newValue}`);
    }
  }
  return diffs;
}

function EditableField({
  label,
  value,
  onChange,
  block = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  block?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      {label && <Label className="text-[11px] text-muted-foreground">{label}</Label>}
      {block ? (
        <Textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("text-xs resize-none", error && "border-red-400 focus-visible:ring-red-400")}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("h-8 text-xs", error && "border-red-400 focus-visible:ring-red-400")}
        />
      )}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
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
