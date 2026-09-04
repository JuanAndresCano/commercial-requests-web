import { useState } from "react";
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
  Edit3,
  Check,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
} from "@/components/ui/dialog";
import {
  formatCop,
  RequestItem,
  ProposalCosting,
  ProposalDocument,
  ExternalProfessorData,
  calculateCosting,
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
    switchRole,
    assignProfessorDetailed,
    updateCosting,
    addDocument,
    removeDocument,
    updateStatus,
  } = useAuth();

  const role = user.role;
  const isKam = role === "kam";
  const isLeader = role === "lider-producto" || role === "lider-nodo";

  const req: RequestItem = requests.find((r) => r.id === id) ?? requests[0];

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isContactAdvisorModalOpen, setIsContactAdvisorModalOpen] = useState(false);

  // Guarantee costing structure exists
  const currentCosting: ProposalCosting =
    req.costing ??
    calculateCosting(
      req.type,
      14_000_000,
      30,
      req.totalCostCop
    );

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

  const handleMarkAsReady = () => {
    updateStatus(req.id, "lista");
    toast.success("Propuesta marcada como Lista para KAM");
  };

  const handleSendToClient = () => {
    updateStatus(req.id, "entregada");
    toast.success("Propuesta enviada al cliente y marcada como Entregada");
  };

  const formattedDeadline = req?.deadline
    ? format(new Date(req.deadline), "d 'de' MMMM, yyyy", { locale: es })
    : "15 de noviembre, 2024";

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* ========================================================================= */}
        {/* TOP BAR: BACK NAVIGATION & CLEAN ROLE SIMULATOR PILL */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            to="/solicitudes"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a solicitudes
          </Link>

          {/* Quick simulator switch */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400">Vista:</span>
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs dark:border-border dark:bg-card">
              <button
                type="button"
                onClick={() => {
                  switchRole("lider-producto");
                  toast.info("Vista Líder de Producto");
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  role === "lider-producto"
                    ? "bg-slate-900 text-white shadow-xs dark:bg-primary dark:text-primary-foreground font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground"
                }`}
              >
                Líder de Producto
              </button>
              <button
                type="button"
                onClick={() => {
                  switchRole("kam");
                  toast.info("Vista KAM (Comercial)");
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  role === "kam"
                    ? "bg-slate-900 text-white shadow-xs dark:bg-primary dark:text-primary-foreground font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground"
                }`}
              >
                KAM (Comercial)
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. CABECERA MINIMALISTA */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-border dark:bg-card">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              {/* Título de la propuesta en h1 elegante (text-xl o 2xl, font-semibold) */}
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {req.title}
              </h1>

              {/* Fila de metadatos inline sutiles: Empresa, Contacto, Código REQ y Badges discretos */}
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-500 dark:text-muted-foreground">
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  #{req.id}
                </span>

                <span className="text-slate-300 dark:text-slate-700">·</span>

                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <strong className="font-medium text-slate-900 dark:text-slate-100">{req.company}</strong>
                </span>

                <span className="text-slate-300 dark:text-slate-700">·</span>

                <span>
                  Contacto: <strong className="font-medium text-slate-700 dark:text-slate-300">{req.applicant}</strong>
                </span>

                <span className="text-slate-300 dark:text-slate-700">·</span>

                <StatusBadge status={req.status} className="border-slate-200/80" />

                <Badge
                  variant="outline"
                  className="text-xs font-normal border-slate-200 text-slate-600 bg-slate-50/80 dark:border-border dark:bg-secondary/40 dark:text-slate-300"
                >
                  {req.type}
                </Badge>

                {req.productLeader === user.name && role === "lider-producto" && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300">
                    Asignada a ti
                  </span>
                )}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN ARRIBA A LA DERECHA */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 lg:pt-0 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-border dark:text-slate-200"
                asChild
              >
                <Link to={`/solicitudes/${req.id}/resumen`}>
                  <Edit3 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  Resumen
                </Link>
              </Button>

              {role === "lider-producto" ? (
                <>
                  {/* Botón secundario "Guardar Cambios" */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveChanges}
                    className="h-9 px-3 text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-border dark:text-slate-200"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    Guardar Cambios
                  </Button>

                  {/* Botón primario destacado "[✔ Marcar lista para KAM]" */}
                  {req.status !== "lista" && req.status !== "entregada" ? (
                    <Button
                      size="sm"
                      onClick={handleMarkAsReady}
                      className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Marcar lista para KAM
                    </Button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Check className="h-3.5 w-3.5" /> Lista para KAM
                    </div>
                  )}
                </>
              ) : isKam ? (
                <Button
                  size="sm"
                  onClick={handleSendToClient}
                  disabled={req.status === "entregada"}
                  className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {req.status === "entregada" ? "Propuesta entregada" : "Enviar a cliente"}
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
            {/* 1. SECCIÓN COSTEO FINANCIERO */}
            {role === "lider-producto" ? (
              <ProposalCostingModule
                request={req}
                onUpdateCosting={handleUpdateCosting}
                onOpenAdvisorModal={() => setIsAssignModalOpen(true)}
              />
            ) : (
              /* Vista comercial para KAM */
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
                      {formatCop(currentCosting.totalOfferedCop || currentCosting.suggestedTotalCop || req.totalCostCop || 18_410_000)}
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
                      {formatCop(currentCosting.baseCostCop || 14_000_000)}
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-border dark:bg-secondary/20">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                      Margen de Contribución ({currentCosting.expectedMarginPercent ?? 30}%)
                    </span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatCop(Math.round((currentCosting.baseCostCop || 14_000_000) * ((currentCosting.expectedMarginPercent ?? 30) / 100)))}
                    </span>
                  </div>

                  {req.type === "Capacitación" && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-border dark:bg-secondary/20">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                        Estampilla Pro-Cultura (1.5%)
                      </span>
                      <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                        +{formatCop(currentCosting.proCulturaTaxAmount || Math.round((currentCosting.baseCostCop || 14_000_000) * 0.015))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Nota de alcance o acuerdo comercial en tiempo real */}
                {currentCosting.negotiationNotes && currentCosting.negotiationNotes.trim() && (
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/90 p-3.5 text-xs text-slate-700 dark:border-border dark:bg-secondary/20 dark:text-slate-300 flex items-start gap-2.5">
                    <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                        Nota de alcance comercial agregada por el Líder:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                        {currentCosting.negotiationNotes}
                      </p>
                    </div>
                  </div>
                )}
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
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-border dark:bg-card">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground border-b border-slate-100 pb-3 dark:border-border">
                Especificaciones del Servicio
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-border text-xs mt-1">
                {/* Dedicación */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Dedicación estimada
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    60 horas
                  </span>
                </div>

                {/* Modalidad */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    Modalidad
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    Híbrida
                  </span>
                </div>

                {/* Participantes */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    Participantes
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    15 - 20 personas
                  </span>
                </div>

                {/* Tipo de servicio */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    Tipo de servicio
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {req.type}
                  </span>
                </div>

                {/* Fecha límite */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Entrega esperada
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formattedDeadline}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. TARJETA EQUIPO ASIGNADO */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-border dark:bg-card space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground border-b border-slate-100 pb-3 dark:border-border">
                Equipo Asignado
              </h3>

              <div className="space-y-3.5 text-xs">
                {/* Nodo Temático */}
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-slate-400">Nodo Temático</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100 leading-snug">
                    {req.node}
                  </p>
                </div>

                {/* Líder de Producto */}
                <div className="space-y-0.5 pt-2 border-t border-slate-100 dark:border-border">
                  <span className="text-[11px] font-medium text-slate-400">Líder de Producto</span>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {req.productLeader}
                    </p>
                    {req.productLeader === user.name && (
                      <span className="text-[10px] text-slate-400">(Tú)</span>
                    )}
                  </div>
                </div>

                {/* KAM asignado */}
                <div className="space-y-0.5 pt-2 border-t border-slate-100 dark:border-border">
                  <span className="text-[11px] font-medium text-slate-400">KAM Responsable</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {req.kam}
                  </p>
                </div>

                {/* Docente / Asesor asignado */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">Docente / Asesor</span>
                    {role === "lider-producto" && (
                      <button
                        type="button"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        {req.professor ? "Cambiar" : "Asignar"}
                      </button>
                    )}
                  </div>

                  {req.professor ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {req.professor}
                          </span>
                          {req.professorType === "externo" ? (
                            <span className="rounded px-1.5 py-0.2 text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300">
                              Externo
                            </span>
                          ) : (
                            <span className="rounded px-1.5 py-0.2 text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-secondary dark:text-slate-300">
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
                            className="h-6 px-2 text-[11px] text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-secondary"
                            title="Ver datos de contacto del asesor externo"
                          >
                            Contacto
                          </Button>
                        )}
                      </div>

                      {/* Subtítulo si tiene empresa */}
                      {req.professorType === "externo" && req.externalProfessorData?.empresaConsultora && (
                        <p className="text-[11px] text-slate-500">
                          {req.externalProfessorData.empresaConsultora}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400">
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
    </AppShell>
  );
}
