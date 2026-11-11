import React, { useState } from "react";
import type { MonthlyTrendsData, MonthlyDataPoint } from "@/lib/api/requests";
import { formatCompactCop, formatCop, getNiceScale } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface MonthlySalesBarChartProps {
  data?: MonthlyTrendsData;
  isLoading?: boolean;
}

export function MonthlySalesBarChart({ data, isLoading }: MonthlySalesBarChartProps) {
  const [activeMonthIndex, setActiveMonthIndex] = useState<number | null>(null);

  if (isLoading || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs animate-pulse">
        <div className="h-5 w-60 rounded-md bg-muted mb-2" />
        <div className="h-3 w-80 rounded-md bg-muted/70 mb-6" />
        <div className="h-64 w-full rounded-xl bg-muted/40" />
      </div>
    );
  }

  const monthlyData = Array.isArray(data.monthlyData) ? data.monthlyData : [];
  const totalQuotedCop = data.totalQuotedCop ?? 0;
  const totalWonCop = data.totalWonCop ?? 0;
  const totalWonCount = data.totalWonCount ?? 0;
  const annualCompliancePercentage = data.annualCompliancePercentage ?? 0;

  const monthlyTargetCop = Math.round((data.annualTargetCop || 0) / 12);

  // Find max value to normalize bar heights
  const rawMaxMonthlyVal = Math.max(
    ...(monthlyData.length > 0 ? monthlyData.map((d) => Math.max(d.quotedCop, d.wonCop, d.targetCop || 0)) : [0]),
    monthlyTargetCop,
    1,
  );
  const { max: maxMonthlyVal, ticks: monthlyTicks } = getNiceScale(rawMaxMonthlyVal, 4);

  const targetPct =
    maxMonthlyVal > 0 && monthlyTargetCop > 0 ? Math.min(Math.round((monthlyTargetCop / maxMonthlyVal) * 100), 92) : 0;

  const activePoint: MonthlyDataPoint | null =
    activeMonthIndex !== null ? (monthlyData[activeMonthIndex] ?? null) : null;

  const annualConversionRate = totalQuotedCop > 0 ? Math.round((totalWonCop / totalQuotedCop) * 1000) / 10 : 0;

  return (
    <div
      data-testid="monthly-sales-bar-chart"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs transition-all"
    >
      {/* 1. Cabecera y Leyenda */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Cotizado vs. Vendido por Mes
            </h2>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary shrink-0">
              {data.year}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Estacionalidad de la tubería comercial: propuestas radicadas en el mercado vs. propuestas efectivamente
            cerradas
          </p>
        </div>

        {/* Leyenda de Colores */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-primary" />
            <span className="text-foreground">Cotizado ($)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-emerald-500" />
            <span className="text-foreground">Vendido ($)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-3 border-t-2 border-dashed border-zinc-400" />
            <span className="text-muted-foreground">Meta Base</span>
          </div>
        </div>
      </div>

      {/* 2. Área del Gráfico de Barras Agrupadas con Eje Y */}
      <div className="mt-6 flex items-stretch gap-2">
        {/* Eje Y: Índices de Valor Sincronizados con la Escala Redondeada */}
        <div className="flex flex-col justify-between py-2 text-[10px] font-mono text-muted-foreground select-none shrink-0 text-right w-11 sm:w-14">
          {monthlyTicks.map((val) => (
            <span key={val} className="leading-none">
              {val === 0 ? "$ 0" : formatCompactCop(val)}
            </span>
          ))}
        </div>

        {/* Contenedor del Gráfico */}
        <div className="relative h-64 flex-1 flex items-end gap-1.5 sm:gap-3 pt-6 pb-2 border-b border-l border-border/80">
          {/* Líneas guía de fondo coincidentes con los 5 ticks */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2">
            <div className="w-full border-b border-foreground/10 border-dashed" />
            <div className="w-full border-b border-foreground/10 border-dashed" />
            <div className="w-full border-b border-foreground/10 border-dashed" />
            <div className="w-full border-b border-foreground/10 border-dashed" />
            <div className="w-full border-b border-border" />
          </div>

          {/* Línea horizontal de Meta Base mensual */}
          {targetPct > 0 && (
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-zinc-400 dark:border-zinc-500 z-10 pointer-events-none transition-all"
              style={{ bottom: `calc(${targetPct}% + 14px)` }}
            >
              <span className="absolute right-1 -top-4 rounded bg-zinc-700/80 dark:bg-zinc-800 text-white px-2 py-0.5 text-[10px] font-mono font-bold shadow-xs whitespace-nowrap">
                Meta Mensual: {formatCompactCop(monthlyTargetCop)}
              </span>
            </div>
          )}

          {monthlyData.map((d, index) => {
            const isHovered = activeMonthIndex === index;
            const quotedHeight = d.quotedCop > 0 ? Math.max(Math.round((d.quotedCop / maxMonthlyVal) * 100), 4) : 0;
            const wonHeight = d.wonCop > 0 ? Math.max(Math.round((d.wonCop / maxMonthlyVal) * 100), 4) : 0;

            return (
              <div
                key={d.month}
                className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                onMouseEnter={() => setActiveMonthIndex(index)}
                onMouseLeave={() => setActiveMonthIndex(null)}
                onClick={() => setActiveMonthIndex(isHovered ? null : index)}
                tabIndex={0}
                role="button"
                aria-label={`Mes ${d.monthName}: Cotizado ${formatCompactCop(d.quotedCop)}, Vendido ${formatCompactCop(d.wonCop)}`}
              >
                {/* Par de Barras: Cotizado y Vendido */}
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1.5 h-full px-0.5">
                  {/* Barra Cotizado (Azul Icesi) */}
                  <div
                    className={cn(
                      "w-1/2 rounded-t-sm bg-primary transition-all duration-300",
                      quotedHeight > 0
                        ? isHovered
                          ? "opacity-100 ring-2 ring-primary/40 shadow-md"
                          : "opacity-85 group-hover:opacity-100"
                        : "h-0 opacity-0 pointer-events-none",
                    )}
                    style={{ height: `${quotedHeight}%` }}
                    title={d.quotedCop > 0 ? `Cotizado: ${formatCop(d.quotedCop)}` : "Sin cotizaciones"}
                  />

                  {/* Barra Vendido (Verde Esmeralda) */}
                  <div
                    className={cn(
                      "w-1/2 rounded-t-sm bg-emerald-500 transition-all duration-300",
                      wonHeight > 0
                        ? isHovered
                          ? "opacity-100 ring-2 ring-emerald-500/40 shadow-md"
                          : "opacity-85 group-hover:opacity-100"
                        : "h-0 opacity-0 pointer-events-none",
                    )}
                    style={{ height: `${wonHeight}%` }}
                    title={d.wonCop > 0 ? `Vendido: ${formatCop(d.wonCop)}` : "Sin ventas"}
                  />
                </div>

                {/* Etiqueta del Mes en el Eje X */}
                <span
                  className={cn(
                    "mt-2 text-[10px] sm:text-xs font-bold transition-colors select-none",
                    isHovered ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {d.monthName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Panel de Detalle del Mes Seleccionado (o resumen por defecto) */}
      <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-3.5 sm:p-4">
        {/* Fila Superior: Título de Contexto y Progreso */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-bold text-sm sm:text-base text-foreground">
              {activePoint ? `Mes de ${activePoint.monthName} (${data.year})` : `Resumen Anual (${data.year})`}
            </span>
            {activePoint ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {activePoint.compliancePercentage}% meta del mes
              </span>
            ) : (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                Acumulado {data.year}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {activePoint
              ? `${activePoint.proposalsWonCount} de ${activePoint.proposalsQuotedCount} propuestas cerradas exitosamente`
              : `${totalWonCount} propuestas cerradas exitosamente`}
          </span>
        </div>

        {/* Fila Inferior: Cuadrícula fija de 4 columnas (sin saltos ni movimientos) */}
        {activePoint ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left animate-in fade-in-50 duration-150">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">
                Cotizado {activePoint.monthName}
              </span>
              <p className="font-display text-sm sm:text-base font-bold text-primary mt-1">
                {formatCompactCop(activePoint.quotedCop)}
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                {activePoint.proposalsQuotedCount} {activePoint.proposalsQuotedCount === 1 ? "propuesta" : "propuestas"}
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">
                Vendido {activePoint.monthName}
              </span>
              <p className="font-display text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCompactCop(activePoint.wonCop)}
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                {activePoint.proposalsWonCount} {activePoint.proposalsWonCount === 1 ? "cerrada" : "cerradas"}
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">
                Efectividad {activePoint.monthName}
              </span>
              <p className="font-display text-sm sm:text-base font-bold text-foreground mt-1">
                {activePoint.quotedCop > 0
                  ? `${Math.round((activePoint.wonCop / activePoint.quotedCop) * 1000) / 10}%`
                  : "0%"}
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Tasa del mes</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">Cumplimiento Meta</span>
              <p className="font-display text-sm sm:text-base font-bold text-foreground mt-1">
                {activePoint.compliancePercentage}%
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Meta: {formatCompactCop(activePoint.targetCop)}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">
                Total Cotizado {data.year}
              </span>
              <p className="font-display text-sm sm:text-base font-bold text-primary mt-1">
                {formatCompactCop(totalQuotedCop)}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">
                Total Vendido {data.year}
              </span>
              <p className="font-display text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCompactCop(totalWonCop)}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">
                Efectividad Global (Win Rate)
              </span>
              <p className="font-display text-sm sm:text-base font-bold text-foreground mt-1">
                {annualConversionRate}%
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">{totalWonCount} ganadas</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">
                Avance sobre Meta Anual
              </span>
              <p className="font-display text-sm sm:text-base font-bold text-foreground mt-1">
                {annualCompliancePercentage}%
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Meta: {formatCompactCop(data.annualTargetCop)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
