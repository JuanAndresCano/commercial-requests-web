import { useState } from "react";
import { Calendar, Users, Layers, AlertCircle, RefreshCw } from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleBadge } from "@/components/RoleBadge";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { AdminDashboardSkeleton } from "./AdminDashboardSkeleton";
import { formatCompactCop } from "@/lib/mock-data";
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

export function AdminDashboard({ user }: AdminDashboardProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>(undefined);

  const { data, isLoading, isFetching, isError, refetch } = useAdminDashboard({
    year: selectedYear,
    quarter: selectedQuarter,
  });

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

  const { timeframe, macroKpis, conversionFunnel, kamRanking, nodeDistribution } = data;
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

  return (
    <div className="space-y-6">
      {/* 1. CABECERA EJECUTIVA Y CONTROLES TEMPORALES */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Hola, {firstName}
            </h1>
            <RoleBadge label="Administrador Icesi" />
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Visión global del pipeline comercial, desempeño de ejecutivos y volumen de consultoría
          </p>
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

      {/* Resumen contextual superior (Rhythm igual al diseño de referencia) */}
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
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", colors.bg, colors.text)}>
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
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DOS COLUMNAS: RANKING DE KAMS Y DISTRIBUCIÓN POR NODO */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna Izquierda (2 cols): Ranking de Ejecutivos Comerciales (KAMs) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Rendimiento por Ejecutivo Comercial (KAM)
              </h2>
              <p className="text-xs text-muted-foreground">
                Resumen comparativo de ventas entregadas y gestión de cartera activa
              </p>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
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
                {kamRanking.map((kam) => (
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
                {kamRanking.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No hay datos de ejecutivos comerciales en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna Derecha (1 col): Distribución por Nodo Temático */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-foreground">Demanda por Nodo</h2>
              <p className="text-xs text-muted-foreground">Distribución por área académica</p>
            </div>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
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
              <div className="py-8 text-center text-muted-foreground text-xs">Sin datos de nodos en este periodo.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
