import { useState, useEffect, useMemo } from "react";
import { Link } from "@/lib/app-router";
import {
  Calendar,
  Users,
  Layers,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Target,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Search,
  X,
} from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { useMonthlyTrends } from "@/hooks/use-monthly-trends";
import { MonthlySalesBarChart } from "./MonthlySalesBarChart";
import { YoySalesCurveChart } from "./YoySalesCurveChart";
import { AdminDashboardSkeleton } from "./AdminDashboardSkeleton";
import { formatCompactCop } from "@/lib/mock-data";
import { fuzzyScore, normalizeText } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";

interface AdminDashboardProps {
  user: {
    name: string;
    email: string;
    roleLabel: string;
  };
}

const QUARTERS = [
  { label: "Todo el año", value: undefined },
  { label: "Q1 (Ene - Mar)", value: 1 },
  { label: "Q2 (Abr - Jun)", value: 2 },
  { label: "Q3 (Jul - Sep)", value: 3 },
  { label: "Q4 (Oct - Dic)", value: 4 },
] as const;

const STAGE_COLORS: Record<string, { bg: string; fill: string; text: string; border: string }> = {
  NEW: {
    bg: "bg-amber-500/10",
    fill: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  IN_PROGRESS: {
    bg: "bg-sky-500/10",
    fill: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-500/30",
  },
  IN_COSTING: {
    bg: "bg-purple-500/10",
    fill: "bg-purple-500",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/30",
  },
  READY_FOR_DELIVERY: {
    bg: "bg-indigo-500/10",
    fill: "bg-indigo-500",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-500/30",
  },
  DELIVERED: {
    bg: "bg-emerald-500/10",
    fill: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
};

function getBudgetPacingTier(paceDeviationPct: number, diffToExpectedDateCop: number) {
  if (paceDeviationPct >= 20) {
    return {
      level: "strong-surplus" as const,
      label: "Superávit Destacado",
      detail: `+${paceDeviationPct}% (+${formatCompactCop(diffToExpectedDateCop)}) sobre la meta a la fecha`,
      badgeClass: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40",
      progressClass: "bg-emerald-600",
      icon: TrendingUp,
    };
  }
  if (paceDeviationPct >= 0) {
    return {
      level: "surplus" as const,
      label: "En Ritmo Esperado",
      detail: `+${paceDeviationPct}% (+${formatCompactCop(diffToExpectedDateCop)}) por encima de lo proyectado`,
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      progressClass: "bg-emerald-500",
      icon: CheckCircle2,
    };
  }
  if (paceDeviationPct >= -20) {
    return {
      level: "mild-deficit" as const,
      label: "Alerta Moderada",
      detail: `${paceDeviationPct}% (${formatCompactCop(diffToExpectedDateCop)}) frente al ritmo proyectado`,
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      progressClass: "bg-amber-500",
      icon: AlertTriangle,
    };
  }
  return {
    level: "critical-deficit" as const,
    label: "Déficit Crítico",
    detail: `${paceDeviationPct}% (${formatCompactCop(diffToExpectedDateCop)}) bajo el ritmo proyectado`,
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40",
    progressClass: "bg-rose-500",
    icon: TrendingDown,
  };
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>(undefined);
  const [kamPage, setKamPage] = useState<number>(1);
  const [kamPageSize, setKamPageSize] = useState<number>(10);
  const [kamSearch, setKamSearch] = useState<string>("");

  useEffect(() => {
    setKamPage(1);
  }, [selectedYear, selectedQuarter, kamSearch, kamPageSize]);

  const { data, isLoading, isFetching, isError, refetch } = useAdminDashboard({
    year: selectedYear,
    quarter: selectedQuarter,
  });

  const { data: trendsData, isLoading: isTrendsLoading } = useMonthlyTrends(selectedYear);

  const kamRanking = useMemo(() => (Array.isArray(data?.kamRanking) ? data.kamRanking : []), [data?.kamRanking]);

  const filteredKams = useMemo(() => {
    const q = kamSearch.trim();
    if (!q) return kamRanking;
    const normQ = normalizeText(q);
    return kamRanking.filter((kam) => {
      const normName = normalizeText(kam.name);
      const normEmail = normalizeText(kam.email);
      if (normName.includes(normQ) || normEmail.includes(normQ)) return true;
      return fuzzyScore(q, kam.name) > 0.45 || fuzzyScore(q, kam.email) > 0.45;
    });
  }, [kamRanking, kamSearch]);

  const totalKamPages = Math.max(1, Math.ceil(filteredKams.length / kamPageSize));
  const paginatedKams = useMemo(() => {
    const start = (kamPage - 1) * kamPageSize;
    return filteredKams.slice(start, start + kamPageSize);
  }, [filteredKams, kamPage, kamPageSize]);

  const firstName = user.name.split(" ")[0] || "Administrador";

  // Only show full skeleton on initial mount when there is no data yet
  if (isLoading && !data) {
    return <AdminDashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg font-bold text-foreground">No se pudo cargar el panel administrativo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ocurrió un error al consultar las métricas ejecutivas. Por favor intenta de nuevo.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-icesi-blue px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-icesi-blue/90 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  const { timeframe, macroKpis } = data;
  const conversionFunnel = Array.isArray(data.conversionFunnel) ? data.conversionFunnel : [];
  const nodeDistribution = Array.isArray(data.nodeDistribution) ? data.nodeDistribution : [];
  const availableYears = timeframe.availableYears.length > 0 ? timeframe.availableYears : [currentYear];

  const getKamInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const totalPortfolioCop = macroKpis.deliveredTotalCop + macroKpis.pipelineTotalCop;

  const centerTargetCop = macroKpis.targetCop ?? trendsData?.annualTargetCop ?? 2516000000;
  const budgetProgressPct =
    macroKpis.targetCompliancePercentage ??
    trendsData?.annualCompliancePercentage ??
    (centerTargetCop > 0
      ? Math.round(((macroKpis.wonTotalCop ?? macroKpis.deliveredTotalCop) / centerTargetCop) * 1000) / 10
      : 0);

  const currentMonthNumber = new Date().getMonth() + 1;
  const expectedToDateCop = Math.round((centerTargetCop / 12) * currentMonthNumber);
  const actualWonCop = macroKpis.wonTotalCop ?? macroKpis.deliveredTotalCop;
  const diffToExpectedDateCop = actualWonCop - expectedToDateCop;

  // Desviación porcentual frente a la cuota proyectada a la fecha
  const paceDeviationPct =
    expectedToDateCop > 0 ? Math.round((diffToExpectedDateCop / expectedToDateCop) * 1000) / 10 : 0;

  const budgetPacingTier = getBudgetPacingTier(paceDeviationPct, diffToExpectedDateCop);

  return (
    <div className="space-y-6">
      {/* 1. CABECERA EJECUTIVA */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Hola, {firstName}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Visión global del pipeline comercial, desempeño de ejecutivos y volumen de consultoría
        </p>
      </div>

      <div className="space-y-6">
        {/* Fila de Controles Temporales y Resumen Contextual */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/60 pb-4">
          {/* Resumen contextual superior */}
          <div className="flex flex-wrap items-center gap-6 px-0.5 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <span className="font-display text-base font-bold text-foreground">{macroKpis.totalProposals}</span>
              <span className="text-muted-foreground font-normal">solicitudes en total</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <span className="font-display text-base font-bold text-foreground">
                {formatCompactCop(totalPortfolioCop)}
              </span>
              <span className="text-muted-foreground font-normal">en cartera institucional</span>
            </div>
          </div>

          {/* Controles de Selección de Año y Trimestre */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Año con Radix UI Select */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Año:</span>
              </div>
              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger
                  aria-label="Seleccionar año"
                  className="h-8 w-24 rounded-lg border-border bg-card px-2.5 text-xs font-bold text-foreground shadow-xs focus:ring-1 focus:ring-icesi-blue cursor-pointer"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)} className="text-xs font-semibold cursor-pointer">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Trimestres (Pills) */}
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs shadow-xs">
              {QUARTERS.map((q) => {
                const active = selectedQuarter === q.value;
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setSelectedQuarter(q.value)}
                    className={cn(
                      "rounded-md px-3 py-1 font-semibold transition-all cursor-pointer",
                      active
                        ? "bg-card text-foreground shadow-xs border border-border/60"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>

            {/* Indicador de actualización sutil en segundo plano */}
            {isFetching && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin text-icesi-blue" />
              </div>
            )}
          </div>
        </div>

        {/* Banner Institucional de Metas Financieras y Semáforo de Cumplimiento a la Fecha */}
        <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-card to-muted/20 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-foreground">
                    Meta Anual Institucional: {formatCompactCop(centerTargetCop)}
                  </h3>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-bold inline-flex items-center gap-1.5 border",
                      budgetPacingTier.badgeClass,
                    )}
                  >
                    <budgetPacingTier.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {budgetPacingTier.label}: {budgetPacingTier.detail}
                    </span>
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cuota presupuestal fijada por Dirección Financiera ({selectedYear}) · Ritmo esperado acumulado (Mes{" "}
                  {currentMonthNumber}/12): {formatCompactCop(expectedToDateCop)}
                </p>
              </div>
            </div>

            {/* Indicador de Avance Presupuestal y Botón Directo a Metas */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex flex-col gap-1.5 min-w-[190px]">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Avance Presupuestal</span>
                  <span className="text-foreground">{budgetProgressPct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", budgetPacingTier.progressClass)}
                    style={{ width: `${Math.min(budgetProgressPct, 100)}%` }}
                  />
                </div>
              </div>

              <Link
                href="/admin/kams?tab=metas"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-xs hover:border-icesi-blue hover:text-icesi-blue transition-colors cursor-pointer shrink-0"
                title="Configurar y asignar metas de venta institucionales y por KAM"
              >
                <Target className="h-3.5 w-3.5 text-icesi-blue" />
                <span>Asignar Metas</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. TARJETAS DE MÉTRICAS MACRO (Diseño fiel al estándar de tarjetas de Icesi) */}
        <div
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-opacity duration-200",
            isFetching ? "opacity-85" : "opacity-100",
          )}
        >
          {/* KPI 1: Total Entregado al Cliente */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 text-left shadow-xs transition-all hover:shadow-sm">
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total entregado</span>
              <div className="mt-2.5">
                <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {formatCompactCop(macroKpis.deliveredTotalCop)}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {macroKpis.deliveredCount}{" "}
                    {macroKpis.deliveredCount === 1 ? "propuesta radicada" : "propuestas radicadas"}
                  </span>{" "}
                  • Total acumulado
                </p>
              </div>
            </div>
            <div className="mt-4 h-1 w-full rounded-full bg-emerald-500" />
          </div>

          {/* KPI 2: Tubería Activa (Pipeline) */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 text-left shadow-xs transition-all hover:shadow-sm">
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Tubería activa</span>
              <div className="mt-2.5">
                <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {formatCompactCop(macroKpis.pipelineTotalCop)}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-icesi-blue">{macroKpis.pipelineCount} en proceso</span> •
                  Negociación / Costeo
                </p>
              </div>
            </div>
            <div className="mt-4 h-1 w-full rounded-full bg-icesi-blue" />
          </div>

          {/* KPI 3: Volumen de Solicitudes y Tasa de Entrega */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 text-left shadow-xs transition-all hover:shadow-sm">
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Volumen total</span>
              <div className="mt-2.5">
                <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {macroKpis.totalProposals}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {macroKpis.winRatePercentage}% tasa de entrega
                  </span>{" "}
                  en este periodo
                </p>
              </div>
            </div>
            <div className="mt-4 h-1 w-full rounded-full bg-purple-500" />
          </div>

          {/* KPI 4: Ciclo Promedio de Venta */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 text-left shadow-xs transition-all hover:shadow-sm">
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Ciclo de cierre</span>
              <div className="mt-2.5">
                <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {macroKpis.averageCycleDays} días
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">Promedio desde creación hasta entrega</p>
              </div>
            </div>
            <div className="mt-4 h-1 w-full rounded-full bg-amber-500" />
          </div>
        </div>

        {/* 3. TENDENCIAS MENSUALES Y CURVA COMPARATIVA INTERANUAL (YOY) */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <MonthlySalesBarChart data={trendsData} isLoading={isTrendsLoading} />
          <YoySalesCurveChart data={trendsData} isLoading={isTrendsLoading} />
        </div>

        {/* 3. EMBUDO DE CONVERSIÓN COMERCIAL */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-foreground">Embudo de Conversión Comercial</h2>
              <p className="text-xs text-muted-foreground">
                Seguimiento del flujo de avance por etapa y capital acumulado en la tubería
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {macroKpis.totalProposals} solicitudes en el periodo
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {conversionFunnel.map((item, index) => {
              const colors = STAGE_COLORS[item.stage] || STAGE_COLORS.NEW;
              return (
                <div
                  key={item.stage}
                  className="group flex flex-col gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted font-bold text-xs text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="font-bold text-foreground">{item.label}</span>
                      <span
                        className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", colors.bg, colors.text)}
                      >
                        {item.count} {item.count === 1 ? "solicitud" : "solicitudes"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground">
                        {item.totalCop > 0 ? formatCompactCop(item.totalCop) : "Sin costeo"}
                      </span>
                      <span className="text-muted-foreground w-10 text-right font-medium">{item.percentage}%</span>
                    </div>
                  </div>

                  {/* Barra de Progreso Proporcional */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full transition-all duration-500", colors.fill)}
                      style={{ width: `${Math.max(item.percentage, item.count > 0 ? 5 : 0)}%` }}
                    />
                  </div>

                  {/* Desglose de Ramas en Entrega al Cliente (Ganadas vs Negociación vs Rechazadas) */}
                  {item.stage === "DELIVERED" && macroKpis.wonTotalCop !== undefined && (
                    <div className="mt-2 pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <span>Ganadas (Aprobadas)</span>
                        <span className="font-mono">
                          {macroKpis.wonCount ?? 0} ({formatCompactCop(macroKpis.wonTotalCop ?? 0)})
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-sky-500/10 px-2.5 py-1 text-sky-700 dark:text-sky-400 font-semibold">
                        <span>En Negociación</span>
                        <span className="font-mono">
                          {Math.max(
                            0,
                            (macroKpis.deliveredCount ?? 0) -
                              (macroKpis.wonCount ?? 0) -
                              (macroKpis.rejectedCount ?? 0),
                          )}{" "}
                          (
                          {formatCompactCop(
                            Math.max(
                              0,
                              (macroKpis.deliveredTotalCop ?? 0) -
                                (macroKpis.wonTotalCop ?? 0) -
                                (macroKpis.rejectedTotalCop ?? 0),
                            ),
                          )}
                          )
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-red-500/10 px-2.5 py-1 text-red-700 dark:text-red-400 font-semibold">
                        <span>Rechazadas</span>
                        <span className="font-mono">
                          {macroKpis.rejectedCount ?? 0} ({formatCompactCop(macroKpis.rejectedTotalCop ?? 0)})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. DOS COLUMNAS: RANKING DE KAMS Y DISTRIBUCIÓN POR NODO */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna Izquierda (2 cols): Ranking de Ejecutivos Comerciales (KAMs) */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">
                    Rendimiento por Ejecutivo Comercial (KAM)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Resumen comparativo de ventas entregadas y gestión de cartera activa
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Buscador Fuzzy en Tiempo Real */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={kamSearch}
                      onChange={(e) => {
                        setKamSearch(e.target.value);
                        setKamPage(1);
                      }}
                      placeholder="Buscar KAM por nombre o correo..."
                      className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-icesi-blue transition-colors"
                    />
                    {kamSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setKamSearch("");
                          setKamPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
                        aria-label="Limpiar búsqueda"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Ejecutivo Comercial</th>
                      <th className="py-2.5 px-3 text-center">Total Solicitudes</th>
                      <th className="py-2.5 px-3 text-right">En Tubería</th>
                      <th className="py-2.5 px-3 text-right">Total Entregado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {paginatedKams.map((kam) => (
                      <tr key={kam.kamId} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-icesi-blue/10 text-icesi-blue font-bold text-xs">
                              {getKamInitials(kam.name)}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{kam.name}</p>
                              <p className="text-[11px] text-muted-foreground">{kam.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="rounded-md bg-muted px-2 py-0.5 font-bold text-foreground">
                            {kam.totalProposals}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-foreground">
                            {kam.pipelineTotalCop > 0 ? formatCompactCop(kam.pipelineTotalCop) : "$ 0 COP"}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{kam.pipelineCount} en proceso</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            {kam.deliveredTotalCop > 0 ? formatCompactCop(kam.deliveredTotalCop) : "$ 0 COP"}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{kam.deliveredCount} entregadas</span>
                        </td>
                      </tr>
                    ))}
                    {filteredKams.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          {kamSearch ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <span>No se encontraron ejecutivos con el término &ldquo;{kamSearch}&rdquo;.</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setKamSearch("");
                                  setKamPage(1);
                                }}
                                className="text-xs font-semibold text-icesi-blue hover:underline cursor-pointer"
                              >
                                Limpiar filtro de búsqueda
                              </button>
                            </div>
                          ) : (
                            "No hay datos de ejecutivos comerciales en este periodo."
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación y Selector de Filas por Página */}
            {filteredKams.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border/60 pt-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    Mostrando <strong>{(kamPage - 1) * kamPageSize + 1}</strong> a{" "}
                    <strong>{Math.min(kamPage * kamPageSize, filteredKams.length)}</strong> de{" "}
                    <strong>{filteredKams.length}</strong> ejecutivos
                    {kamSearch && ` (filtrado de ${kamRanking.length})`}
                  </span>
                  <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
                    <span>Filas:</span>
                    <select
                      value={kamPageSize}
                      onChange={(e) => {
                        setKamPageSize(Number(e.target.value));
                        setKamPage(1);
                      }}
                      className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-icesi-blue"
                      aria-label="Filas por página"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={kamPage === 1}
                    onClick={() => setKamPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-2 font-semibold text-muted-foreground">
                    Página {kamPage} de {totalKamPages}
                  </span>
                  <button
                    type="button"
                    disabled={kamPage >= totalKamPages}
                    onClick={() => setKamPage((p) => Math.min(totalKamPages, p + 1))}
                    className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha (1 col): Distribución por Nodo Temático (Sin Scroll) */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-base font-bold text-foreground">Demanda por Nodo</h2>
                <p className="text-xs text-muted-foreground">Distribución por área académica</p>
              </div>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-2.5">
              {nodeDistribution.map((node) => (
                <div
                  key={node.nodeId}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3 text-xs hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="font-bold text-foreground line-clamp-1">{node.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {node.totalProposals} {node.totalProposals === 1 ? "propuesta" : "propuestas"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      {node.deliveredTotalCop > 0 ? formatCompactCop(node.deliveredTotalCop) : "$ 0"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Tub: {node.pipelineTotalCop > 0 ? formatCompactCop(node.pipelineTotalCop) : "$ 0"}
                    </p>
                  </div>
                </div>
              ))}
              {nodeDistribution.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  Sin datos de nodos en este periodo.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
