import { useState, useEffect } from "react";
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Network,
  Phone,
  RefreshCw,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Zap,
  Briefcase,
  AlertCircle,
} from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminCompanies, useAdminCompany360 } from "@/hooks/use-admin-company-360";
import { Company360Skeleton } from "./Company360Skeleton";
import { formatCop, formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Company360ViewProps {
  initialCompanyId?: string;
}

const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  NEW: {
    label: "Nueva solicitud",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
  },
  IN_PROGRESS: {
    label: "En experto",
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-500/30",
    dot: "bg-sky-500",
  },
  IN_COSTING: {
    label: "En costeo",
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/30",
    dot: "bg-purple-500",
  },
  READY_FOR_DELIVERY: {
    label: "Lista para entrega",
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-500/30",
    dot: "bg-indigo-500",
  },
  DELIVERED: {
    label: "Entregada / Cerrada",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rechazada",
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-500/30",
    dot: "bg-red-500",
  },
  CANCELLED: {
    label: "Cancelada",
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-400",
    border: "border-slate-500/30",
    dot: "bg-slate-500",
  },
};

export function Company360View({ initialCompanyId }: Company360ViewProps) {
  const {
    data: companies = [],
    isLoading: isLoadingCompanies,
    isError: isCompaniesError,
    refetch: refetchCompanies,
  } = useAdminCompanies();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(initialCompanyId ?? null);

  // Sync selected company when list is loaded
  useEffect(() => {
    if (!selectedCompanyId && companies.length > 0) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const {
    data: company360,
    isLoading: isLoadingDetails,
    isFetching: isFetchingDetails,
    isError: isDetailsError,
    refetch: refetchDetails,
  } = useAdminCompany360(selectedCompanyId);

  // Initial loading state
  if (isLoadingCompanies && companies.length === 0) {
    return <Company360Skeleton />;
  }

  // Error loading company catalog
  if (isCompaniesError) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center" data-testid="company-360-error">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg font-bold text-foreground">No se pudo cargar el listado de empresas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ocurrió un error al consultar las empresas aliadas. Por favor intenta nuevamente.
        </p>
        <button
          type="button"
          onClick={() => void refetchCompanies()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-icesi-blue px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-icesi-blue/90 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  // Empty state if no companies exist
  if (!isLoadingCompanies && companies.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center" data-testid="company-360-empty">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
          <Building2 className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg font-bold text-foreground">No hay empresas registradas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuando se registren solicitudes asociadas a clientes empresariales, aparecerá aquí el historial 360°.
        </p>
      </div>
    );
  }

  if (isLoadingDetails && !company360) {
    return <Company360Skeleton />;
  }

  if (isDetailsError || !company360) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center" data-testid="company-details-error">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg font-bold text-foreground">No se pudo cargar el detalle 360°</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No fue posible consultar el historial y los indicadores de impacto para la empresa seleccionada.
        </p>
        <button
          type="button"
          onClick={() => void refetchDetails()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-icesi-blue px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-icesi-blue/90 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  const { company, metrics, timeline = [], nodeBreakdown = [] } = company360;
  const contacts = company?.contacts && Array.isArray(company.contacts) ? company.contacts : [];

  const impact = company360.impact ||
    metrics?.impact || {
      totalHours: metrics?.totalHours ?? 0,
      totalParticipants: metrics?.impactedParticipants ?? 0,
      successMetrics: [],
      expectedResults: [],
      competencies: [],
    };

  const hoursTotal = metrics?.totalHours ?? impact?.totalHours ?? 0;
  const participantsTotal = metrics?.impactedParticipants ?? impact?.totalParticipants ?? 0;
  const successMetrics = impact?.successMetrics ?? [];
  const expectedResults = impact?.expectedResults ?? [];
  const competencies = impact?.competencies ?? [];

  return (
    <div className="space-y-6" data-testid="company-360-view">
      {/* 1. BARRA DE SELECCIÓN Y CONTROLES SUPERIORES */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Inteligencia de Cuenta y Trayectoria (360°)
            </h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Línea de tiempo histórica, impacto tangible de negocio y penetración por nodos académicos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Empresa con Radix UI Select */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Empresa:</span>
            </div>
            <Select value={selectedCompanyId ?? ""} onValueChange={(val) => setSelectedCompanyId(val)}>
              <SelectTrigger
                aria-label="Seleccionar empresa aliada"
                className="h-9 w-64 sm:w-80 rounded-lg border-border bg-card px-3 text-xs font-bold text-foreground shadow-xs focus:ring-1 focus:ring-icesi-blue cursor-pointer"
              >
                <SelectValue placeholder="Seleccionar empresa..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-72">
                {companies.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id} className="text-xs font-medium cursor-pointer py-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{comp.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        NIT: {comp.nit} • {comp.totalProposals} propuestas •{" "}
                        {formatCompactCop(comp.deliveredTotalCop + comp.pipelineTotalCop)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botón de Refresco con indicador de actualización en background */}
          <button
            type="button"
            onClick={() => void refetchDetails()}
            aria-label="Actualizar datos de la empresa"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground shadow-xs transition-colors cursor-pointer"
            title="Refrescar métricas"
          >
            <RefreshCw className={cn("h-4 w-4", isFetchingDetails && "animate-spin text-icesi-blue")} />
          </button>
        </div>
      </div>

      {/* 2. FICHA DE IDENTIDAD Y DATOS CORPORATIVOS */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Columna Izquierda: Información Institucional de la Empresa */}
          <div className="space-y-3 lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-bold text-foreground">{company.name}</h3>
              <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                NIT: {company.nit}
              </span>
              {company.sector && (
                <span className="inline-flex items-center rounded-md border border-icesi-blue/30 bg-icesi-blue/10 px-2 py-0.5 text-xs font-semibold text-icesi-blue">
                  {company.sector}
                </span>
              )}
              {company.type && (
                <span className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {company.type}
                </span>
              )}
              {company.ciiuCode && <span className="text-xs text-muted-foreground">(CIIU {company.ciiuCode})</span>}
            </div>

            {company.description && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{company.description}</p>
            )}

            {/* Metadatos de contacto corporativo */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-muted-foreground">
              {company.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{company.address}</span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{company.phone}</span>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <a href={`mailto:${company.email}`} className="hover:text-icesi-blue hover:underline">
                    {company.email}
                  </a>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  <a
                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-icesi-blue hover:underline"
                  >
                    {company.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Contactos / Interlocutores Registrados */}
          <div className="space-y-2 lg:col-span-4 lg:border-l lg:border-border lg:pl-6">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Interlocutores Registrados ({contacts.length})
            </h4>
            {contacts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sin contactos adicionales vinculados a la cuenta.</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {contacts.map((contact, idx) => (
                  <div
                    key={contact.email || idx}
                    className="rounded-lg border border-border/80 bg-muted/20 p-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-foreground">{contact.name || "Contacto"}</span>
                      {contact.role && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {contact.role}
                        </span>
                      )}
                    </div>
                    {(contact.email || contact.phone) && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
                        {contact.email && <span>{contact.email}</span>}
                        {contact.phone && <span>{contact.phone}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. TARJETAS DE MÉTRICAS CLAVE DE LA CUENTA */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Facturación Entregada */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm border-b-4 border-b-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Facturación Entregada</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {formatCop(metrics.deliveredTotalCop)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{metrics.deliveredCount}</span>{" "}
              {metrics.deliveredCount === 1 ? "propuesta finalizada" : "propuestas finalizadas"}
            </p>
          </div>
        </div>

        {/* KPI 2: Tubería Activa */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm border-b-4 border-b-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Tubería Activa</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {formatCop(metrics.pipelineTotalCop)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-amber-600 dark:text-amber-400">{metrics.pipelineCount}</span>{" "}
              {metrics.pipelineCount === 1 ? "solicitud en proceso" : "solicitudes en proceso"}
            </p>
          </div>
        </div>

        {/* KPI 3: Horas de Intervención */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm border-b-4 border-b-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Horas de Intervención</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {hoursTotal.toLocaleString("es-CO")}{" "}
              <span className="text-base font-medium text-muted-foreground">hrs</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Formación y asesoría estratégica</p>
          </div>
        </div>

        {/* KPI 4: Personas Impactadas */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm border-b-4 border-b-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Personas Impactadas</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {participantsTotal.toLocaleString("es-CO")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Colaboradores y líderes beneficiados</p>
          </div>
        </div>
      </div>

      {/* 4. DOS COLUMNAS PRINCIPALES: LÍNEA DE TIEMPO VS MURO DE IMPACTO */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* COLUMNA IZQUIERDA: LÍNEA DE TIEMPO (7 COLS) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">Línea de Tiempo de Intervenciones</h3>
                <p className="text-xs text-muted-foreground">
                  Historial cronológico de propuestas, estados y equipos involucrados
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                {timeline.length} {timeline.length === 1 ? "iniciativa" : "iniciativas"}
              </span>
            </div>

            {timeline.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No hay iniciativas registradas para esta empresa.
              </div>
            ) : (
              <div className="relative mt-6 pl-4">
                {/* Línea vertical conectora continua */}
                <div className="absolute left-[23px] top-3 bottom-4 w-0.5 bg-border" aria-hidden="true" />

                <div className="space-y-6">
                  {timeline.map((event) => {
                    const stageKey = event.statusCode || event.status || "NEW";
                    const stage = STAGE_CONFIG[stageKey] || {
                      label: event.statusLabel || stageKey,
                      bg: "bg-muted",
                      text: "text-muted-foreground",
                      border: "border-border",
                      dot: "bg-muted-foreground",
                    };

                    const eventDate = event.date || event.createdAt;
                    const formattedDate = eventDate
                      ? new Date(eventDate).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "";

                    const quarterLabel = typeof event.quarter === "number" ? `Q${event.quarter}` : event.quarter || "";
                    const valueCop = event.grossValue ?? event.estimatedValueCop ?? 0;
                    const serviceType = event.serviceType || event.programType || "Consultoría";
                    const kam = event.kamName || (typeof event.kam === "object" ? event.kam?.name : event.kam);
                    const leader = event.leaderName || event.academicLeaderName;
                    const docente = event.professorName || event.assignedDocenteName;

                    return (
                      <div key={event.proposalId} className="relative flex items-start gap-4">
                        {/* Indicador de punto en la línea */}
                        <div
                          className={cn(
                            "relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-card mt-1 shadow-xs",
                            stage.dot,
                          )}
                          title={stage.label}
                        />

                        {/* Contenedor de la tarjeta del evento */}
                        <div className="w-full rounded-lg border border-border bg-card/60 p-4 shadow-xs transition-colors hover:bg-muted/10">
                          {/* Fila superior: Periodo, Código y Estado */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-0.5 text-[11px] font-bold text-foreground">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {quarterLabel ? `${quarterLabel} ` : ""}
                                {event.year} • {formattedDate}
                              </span>
                              <span className="font-mono text-xs font-bold text-icesi-blue">{event.code}</span>
                            </div>

                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                                stage.bg,
                                stage.text,
                                stage.border,
                              )}
                            >
                              {stage.label}
                            </span>
                          </div>

                          {/* Título de la propuesta */}
                          <h4 className="mt-2 font-display text-sm font-bold text-foreground">{event.title}</h4>

                          {/* Valor Económico y Tipo de Servicio */}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                            <div className="font-bold text-foreground">{formatCop(valueCop)}</div>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-medium text-muted-foreground">{serviceType}</span>
                            {event.nodeName && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                  <Network className="h-3 w-3 text-icesi-blue" />
                                  {event.nodeName}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Chips de Equipo Involucrado */}
                          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2 text-[11px]">
                            {kam && (
                              <div className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-muted-foreground">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  KAM: <strong className="text-foreground">{kam}</strong>
                                </span>
                              </div>
                            )}
                            {leader && (
                              <div className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-muted-foreground">
                                <GraduationCap className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  Líder: <strong className="text-foreground">{leader}</strong>
                                </span>
                              </div>
                            )}
                            {docente && (
                              <div className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-muted-foreground">
                                <Briefcase className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  Docente: <strong className="text-foreground">{docente}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: IMPACTO, LOGROS Y PENETRACIÓN (5 COLS) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Card A: Logros y Métricas de Éxito */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">Logros y Métricas de Éxito</h4>
                <p className="text-[11px] text-muted-foreground">
                  Indicadores tangibles generados en las intervenciones
                </p>
              </div>
            </div>

            {successMetrics.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground italic">
                No se han registrado métricas cuantitativas adicionales aún.
              </p>
            ) : (
              <ul className="space-y-2.5 pt-1">
                {successMetrics.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Card B: Resultados Esperados */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">Resultados Esperados</h4>
                <p className="text-[11px] text-muted-foreground">Transformaciones de negocio acordadas</p>
              </div>
            </div>

            {expectedResults.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground italic">
                No hay resultados cualitativos adicionales documentados.
              </p>
            ) : (
              <ul className="space-y-2.5 pt-1">
                {expectedResults.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Card C: Habilidades y Competencias Instaladas */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">
                  Habilidades y Competencias Instaladas
                </h4>
                <p className="text-[11px] text-muted-foreground">Capacidades desarrolladas en la organización</p>
              </div>
            </div>

            {competencies.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground italic">
                No se han registrado etiquetas de competencias para esta cuenta.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {competencies.map((comp, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Card D: Penetración por Nodo Académico */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Network className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">Penetración por Nodo Académico</h4>
                <p className="text-[11px] text-muted-foreground">
                  Diversificación institucional en los centros de conocimiento
                </p>
              </div>
            </div>

            {nodeBreakdown.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground italic">Sin vinculación a nodos académicos aún.</p>
            ) : (
              <div className="space-y-3.5">
                {nodeBreakdown.map((item) => {
                  const percentage =
                    metrics.totalProposals > 0 ? Math.round((item.proposalsCount / metrics.totalProposals) * 100) : 0;
                  const totalValue = item.totalValueCop ?? (item.deliveredCop ?? 0) + (item.pipelineCop ?? 0);
                  const deliveredCount = item.deliveredCount ?? (item.deliveredCop > 0 ? 1 : 0);

                  return (
                    <div key={item.nodeId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground line-clamp-1 pr-2">{item.nodeName}</span>
                        <span className="shrink-0 font-mono text-[11px] font-bold text-muted-foreground">
                          {item.proposalsCount} {item.proposalsCount === 1 ? "propuesta" : "propuestas"} ({percentage}%)
                        </span>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-icesi-blue transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>
                          {deliveredCount} {deliveredCount === 1 ? "entregada" : "entregadas"}
                        </span>
                        <span className="font-semibold text-foreground">{formatCop(totalValue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
