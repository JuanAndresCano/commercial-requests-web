import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "@/lib/app-router";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Layers,
  Mail,
  MapPin,
  Network,
  Phone,
  User,
  Users,
  Briefcase,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "@/components/icons";
import { CompanySelectCombobox } from "./CompanySelectCombobox";
import { useAdminCompanies, useAdminCompany360 } from "@/hooks/use-admin-company-360";
import { Company360Skeleton } from "./Company360Skeleton";
import { formatCop } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface Company360ViewProps {
  initialCompanyId?: string;
  onBackToDirectory?: () => void;
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

export function Company360View({ initialCompanyId, onBackToDirectory }: Company360ViewProps) {
  const {
    data: companies = [],
    isLoading: isLoadingCompanies,
    isError: isCompaniesError,
    refetch: refetchCompanies,
  } = useAdminCompanies();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(initialCompanyId ?? null);
  const [selectedYear, setSelectedYear] = useState<string>("ALL");

  // Sync selected company when list is loaded
  useEffect(() => {
    if (!selectedCompanyId && companies.length > 0) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const {
    data: company360,
    isLoading: isLoadingDetails,
    isError: isDetailsError,
    refetch: refetchDetails,
  } = useAdminCompany360(selectedCompanyId);

  const timeline = useMemo(() => company360?.timeline ?? [], [company360?.timeline]);
  const metrics = company360?.metrics;

  // Extract distinct years present in the company's timeline
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const ev of timeline) {
      if (ev.year) set.add(ev.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [timeline]);

  // Filter timeline by selected year
  const displayTimeline = useMemo(() => {
    if (selectedYear === "ALL") return timeline;
    const y = Number(selectedYear);
    return timeline.filter((ev) => ev.year === y);
  }, [timeline, selectedYear]);

  // Timeline pagination (10 initiatives per page)
  const [timelinePage, setTimelinePage] = useState<number>(1);
  const TIMELINE_PAGE_SIZE = 10;
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimelinePage(1);
  }, [selectedCompanyId, selectedYear]);

  const handleTimelinePageChange = (newPage: number) => {
    setTimelinePage(newPage);
    if (typeof window !== "undefined") {
      setTimeout(() => {
        if (typeof timelineRef.current?.scrollIntoView === "function") {
          timelineRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);
    }
  };

  const totalTimelinePages = Math.max(1, Math.ceil(displayTimeline.length / TIMELINE_PAGE_SIZE));
  const paginatedTimeline = useMemo(() => {
    const start = (timelinePage - 1) * TIMELINE_PAGE_SIZE;
    return displayTimeline.slice(start, start + TIMELINE_PAGE_SIZE);
  }, [displayTimeline, timelinePage]);

  // Retention health and months since last engagement
  const monthsSinceLastEngagement = useMemo(() => {
    if (!metrics?.lastEngagementDate) return null;
    const diffMs = new Date().getTime() - new Date(metrics.lastEngagementDate).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
  }, [metrics?.lastEngagementDate]);

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

  if (isDetailsError || !company360 || !metrics) {
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

  const { company, impact, nodeBreakdown = [] } = company360;
  const contacts = company?.contacts && Array.isArray(company.contacts) ? company.contacts : [];

  // Recalculate metrics for displayTimeline (or use all-time metrics when ALL is selected)
  const isAllYears = selectedYear === "ALL";
  const displayDeliveredCount = isAllYears
    ? metrics.deliveredCount
    : displayTimeline.filter((ev) => ev.statusCode === "DELIVERED").length;
  const displayDeliveredTotalCop = isAllYears
    ? metrics.deliveredTotalCop
    : displayTimeline
        .filter((ev) => ev.statusCode === "DELIVERED")
        .reduce((acc, ev) => acc + (ev.grossValue ?? ev.estimatedValueCop ?? 0), 0);
  const displayPipelineCount = isAllYears
    ? metrics.pipelineCount
    : displayTimeline.filter(
        (ev) => ev.statusCode !== "DELIVERED" && ev.statusCode !== "REJECTED" && ev.statusCode !== "CANCELLED",
      ).length;
  const displayPipelineTotalCop = isAllYears
    ? metrics.pipelineTotalCop
    : displayTimeline
        .filter((ev) => ev.statusCode !== "DELIVERED" && ev.statusCode !== "REJECTED" && ev.statusCode !== "CANCELLED")
        .reduce((acc, ev) => acc + (ev.grossValue ?? ev.estimatedValueCop ?? 0), 0);
  const hoursTotal = isAllYears
    ? (metrics?.totalHours ?? impact?.totalHours ?? 0)
    : displayTimeline.reduce((acc, ev) => acc + (ev.totalHours ?? 0), 0);
  const participantsTotal = isAllYears
    ? (metrics?.impactedParticipants ?? impact?.totalParticipants ?? 0)
    : displayTimeline.reduce((acc, ev) => acc + (ev.participants ?? 0), 0);

  // 1. Desglose analítico por línea de servicio
  const serviceTypeMap = new Map<string, { count: number; totalCop: number }>();
  for (const ev of displayTimeline) {
    const rawType = ev.serviceType || ev.programType || "Consultoría Especializada";
    const val = ev.grossValue ?? ev.estimatedValueCop ?? 0;
    const curr = serviceTypeMap.get(rawType) ?? { count: 0, totalCop: 0 };
    curr.count += 1;
    curr.totalCop += val;
    serviceTypeMap.set(rawType, curr);
  }

  const serviceBreakdown = Array.from(serviceTypeMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      totalCop: data.totalCop,
      percentage: displayTimeline.length > 0 ? Math.round((data.count / displayTimeline.length) * 100) : 0,
    }))
    .sort((a, b) => b.totalCop - a.totalCop);

  // 2. Salud comercial y gestión de la cuenta
  const averageTicket =
    displayDeliveredCount > 0
      ? Math.round(displayDeliveredTotalCop / displayDeliveredCount)
      : displayTimeline.length > 0
        ? Math.round((displayDeliveredTotalCop + displayPipelineTotalCop) / displayTimeline.length)
        : 0;

  // KAMs involucrados
  const kamMap = new Map<string, number>();
  for (const ev of displayTimeline) {
    const kam = ev.kamName || (typeof ev.kam === "object" ? ev.kam?.name : null) || "Sin asignar";
    kamMap.set(kam, (kamMap.get(kam) ?? 0) + 1);
  }
  const kamsList = Array.from(kamMap.entries()).sort((a, b) => b[1] - a[1]);

  // Formateo de fechas de vinculación
  const formatEngagement = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("es-CO", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };
  const firstEngagementFormatted = formatEngagement(metrics.firstEngagementDate);
  const lastEngagementFormatted = formatEngagement(metrics.lastEngagementDate);

  return (
    <div className="space-y-6" data-testid="company-360-view">
      {/* 1. BARRA DE SELECCIÓN Y CONTROLES SUPERIORES */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          {onBackToDirectory && (
            <button
              type="button"
              onClick={onBackToDirectory}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-xs hover:border-icesi-blue hover:text-icesi-blue transition-colors cursor-pointer shrink-0"
              title="Volver al directorio maestro de cuentas"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver al Ranking</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Inteligencia de Cuenta y Trayectoria (360°)
              </h2>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              Línea de tiempo histórica, impacto tangible de negocio y penetración por nodos académicos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector Temporal de Año */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Año:</span>
            </div>
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setSelectedYear("ALL")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer",
                  selectedYear === "ALL"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Histórico
              </button>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(String(yr))}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer",
                    selectedYear === String(yr)
                      ? "bg-card text-foreground shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Empresa con Buscador Difuso y NIT integrado */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Empresa:</span>
            </div>
            <CompanySelectCombobox
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onSelect={(val) => setSelectedCompanyId(val)}
            />
          </div>
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
                NIT: {company.nit || "Sin NIT"}
              </span>
              {company.sector ? (
                <span className="inline-flex items-center rounded-md border border-icesi-blue/30 bg-icesi-blue/10 px-2 py-0.5 text-xs font-semibold text-icesi-blue">
                  {company.sector}
                </span>
              ) : null}
              {company.type ? (
                <span className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {company.type}
                </span>
              ) : null}
              {company.ciiuCode ? (
                <span className="text-xs text-muted-foreground">(CIIU {company.ciiuCode})</span>
              ) : null}
            </div>

            {/* Badges de Totales Consolidados de la Cuenta (reubicados desde el selector) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-semibold text-foreground shadow-2xs">
                <Layers className="h-3.5 w-3.5 text-icesi-blue" />
                <span>
                  Total Iniciativas: <strong className="text-foreground">{metrics.totalProposals} propuestas</strong>
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-400 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Cartera Institucional Acumulada:{" "}
                  <strong>{formatCop(metrics.deliveredTotalCop + metrics.pipelineTotalCop)}</strong>
                </span>
              </span>
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

            {/* Alerta de Retención (Únicamente en caso de riesgo de abandono > 12 meses) */}
            {monthsSinceLastEngagement !== null && monthsSinceLastEngagement > 12 && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Riesgo de abandono: Sin nuevas solicitudes hace {monthsSinceLastEngagement} meses</span>
                </span>
              </div>
            )}
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
              {formatCop(displayDeliveredTotalCop)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{displayDeliveredCount}</span>{" "}
              {displayDeliveredCount === 1 ? "propuesta finalizada" : "propuestas finalizadas"}
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
              {formatCop(displayPipelineTotalCop)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-amber-600 dark:text-amber-400">{displayPipelineCount}</span>{" "}
              {displayPipelineCount === 1 ? "solicitud en proceso" : "solicitudes en proceso"}
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
          <div ref={timelineRef} className="scroll-mt-24 rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">Línea de Tiempo de Intervenciones</h3>
                <p className="text-xs text-muted-foreground">
                  Historial cronológico de propuestas, estados y equipos involucrados
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                {displayTimeline.length} {displayTimeline.length === 1 ? "iniciativa" : "iniciativas"}
              </span>
            </div>

            {displayTimeline.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No hay iniciativas registradas para esta empresa.
              </div>
            ) : (
              <div className="relative mt-6 pl-4">
                {/* Línea vertical conectora continua */}
                <div className="absolute left-[23px] top-3 bottom-4 w-0.5 bg-border" aria-hidden="true" />

                <div className="space-y-6">
                  {paginatedTimeline.map((event) => {
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
                              <Link
                                href={`/solicitudes/${event.proposalId}`}
                                className="font-mono text-xs font-bold text-icesi-blue hover:underline hover:text-icesi-blue/80 inline-flex items-center gap-1 transition-colors"
                                title={`Ver detalle de la solicitud ${event.code}`}
                              >
                                <span>{event.code}</span>
                                <ExternalLink className="h-3 w-3 opacity-70" />
                              </Link>
                            </div>

                            <div className="flex items-center gap-1.5">
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

                              {event.commercialStatusLabel && (
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold",
                                    event.commercialStatus === "REJECTED"
                                      ? "bg-red-500/10 text-red-600 border-red-500/30"
                                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                                  )}
                                >
                                  {event.commercialStatusLabel}
                                </span>
                              )}
                            </div>
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

            {/* Paginación de la Línea de Tiempo (10 iniciativas por página) */}
            {totalTimelinePages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4 text-xs">
                <span className="text-muted-foreground">
                  Mostrando <strong>{(timelinePage - 1) * TIMELINE_PAGE_SIZE + 1}</strong> a{" "}
                  <strong>{Math.min(timelinePage * TIMELINE_PAGE_SIZE, displayTimeline.length)}</strong> de{" "}
                  <strong>{displayTimeline.length}</strong> iniciativas
                </span>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={timelinePage === 1}
                    onClick={() => handleTimelinePageChange(Math.max(1, timelinePage - 1))}
                    className="rounded-lg border border-border bg-card px-3 py-1 font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-2 font-semibold text-muted-foreground">
                    {timelinePage} de {totalTimelinePages}
                  </span>
                  <button
                    type="button"
                    disabled={timelinePage >= totalTimelinePages}
                    onClick={() => handleTimelinePageChange(Math.min(totalTimelinePages, timelinePage + 1))}
                    className="rounded-lg border border-border bg-card px-3 py-1 font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: MIX DE SERVICIOS, GESTIÓN Y PENETRACIÓN POR NODO (5 COLS) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Card: Mix de Portafolio por Servicio */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">Mix de Portafolio por Servicio</h4>
                <p className="text-[11px] text-muted-foreground">
                  Distribución del volumen e inversión por línea contratada
                </p>
              </div>
            </div>

            {serviceBreakdown.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground italic">Sin líneas de servicio registradas aún.</p>
            ) : (
              <div className="space-y-3.5">
                {serviceBreakdown.map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground line-clamp-1 pr-2">{item.name}</span>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-muted-foreground">
                        {item.count} {item.count === 1 ? "propuesta" : "propuestas"} ({item.percentage}%)
                      </span>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-sky-600 dark:bg-sky-500 transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-end text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{formatCop(item.totalCop)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Salud y Gestión de la Cuenta */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">Salud y Gestión de la Cuenta</h4>
                <p className="text-[11px] text-muted-foreground">Indicadores de relación comercial y ticket medio</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground block">Ticket promedio</span>
                <span className="font-mono text-sm font-bold text-foreground block">
                  {averageTicket > 0 ? formatCop(averageTicket) : "N/D"}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {metrics.deliveredCount > 0 ? "en propuestas entregadas" : "en portafolio activo"}
                </span>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground block">Vigencia comercial</span>
                <span className="text-xs font-bold text-foreground block">
                  {firstEngagementFormatted && lastEngagementFormatted
                    ? `${firstEngagementFormatted} – ${lastEngagementFormatted}`
                    : firstEngagementFormatted || "Sin registro"}
                </span>
                <span className="text-[10px] text-muted-foreground block">Primer y último contacto</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-medium text-muted-foreground block">Gestores comerciales (KAM)</span>
              {kamsList.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Sin gestores comerciales vinculados aún.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {kamsList.map(([kam, count]) => (
                    <span
                      key={kam}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs"
                    >
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>{kam}</span>
                      <span className="font-mono text-[10px] text-muted-foreground font-bold">({count})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
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
                  const deliveredCount = item.deliveredCount ?? ((item.deliveredCop ?? 0) > 0 ? 1 : 0);

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
