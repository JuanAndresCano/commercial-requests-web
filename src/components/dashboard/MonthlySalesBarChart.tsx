import React, { useState } from "react";
import type { MonthlyTrendsData, MonthlyDataPoint } from "@/lib/api/requests";
import { formatCompactCop, formatCop } from "@/lib/mock-data";
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

  // Find max value to normalize bar heights
  const maxMonthlyVal = Math.max(
    ...(monthlyData.length > 0 ? monthlyData.map((d) => Math.max(d.quotedCop, d.wonCop, d.targetCop || 0)) : [0]),
    1,
  );

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
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Valores Cotizados vs. Vendidos Mes a Mes
            </h2>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{data.year}</span>
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

      {/* 2. Área del Gráfico de Barras Agrupadas */}
      <div className="mt-6">
        <div className="relative h-64 w-full flex items-end gap-1.5 sm:gap-3 pt-6 pb-2 border-b border-border">
          {/* Líneas guía de fondo */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="w-full border-b border-border border-dashed" />
            <div className="w-full border-b border-border border-dashed" />
            <div className="w-full border-b border-border border-dashed" />
            <div className="w-full border-b border-border" />
          </div>

          {monthlyData.map((d, index) => {
            const isHovered = activeMonthIndex === index;
            const quotedHeight = Math.max(Math.round((d.quotedCop / maxMonthlyVal) * 100), d.quotedCop > 0 ? 6 : 2);
            const wonHeight = Math.max(Math.round((d.wonCop / maxMonthlyVal) * 100), d.wonCop > 0 ? 6 : 2);

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
                      isHovered ? "opacity-100 ring-2 ring-primary/40 shadow-md" : "opacity-85 group-hover:opacity-100",
                    )}
                    style={{ height: `${quotedHeight}%` }}
                    title={`Cotizado: ${formatCop(d.quotedCop)}`}
                  />

                  {/* Barra Vendido (Verde Esmeralda) */}
                  <div
                    className={cn(
                      "w-1/2 rounded-t-sm bg-emerald-500 transition-all duration-300",
                      isHovered
                        ? "opacity-100 ring-2 ring-emerald-500/40 shadow-md"
                        : "opacity-85 group-hover:opacity-100",
                    )}
                    style={{ height: `${wonHeight}%` }}
                    title={`Vendido: ${formatCop(d.wonCop)}`}
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
      <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-3 sm:p-4">
        {activePoint ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs animate-in fade-in-50 duration-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-foreground">
                  Mes de {activePoint.monthName} ({data.year})
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {activePoint.compliancePercentage}% meta del mes
                </span>
              </div>
              <p className="mt-0.5 text-muted-foreground">
                {activePoint.proposalsWonCount} de {activePoint.proposalsQuotedCount} propuestas cerradas exitosamente
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Cotizado</span>
                <span className="font-bold text-primary font-mono sm:text-sm">
                  {formatCompactCop(activePoint.quotedCop)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Vendido</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono sm:text-sm">
                  {formatCompactCop(activePoint.wonCop)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Meta Mensual</span>
                <span className="font-bold text-foreground font-mono sm:text-sm">
                  {formatCompactCop(activePoint.targetCop)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground">Total Cotizado {data.year}</span>
              <p className="font-display text-sm sm:text-base font-bold text-primary mt-0.5">
                {formatCompactCop(totalQuotedCop)}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted-foreground">Total Vendido {data.year}</span>
              <p className="font-display text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCompactCop(totalWonCop)}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted-foreground">Efectividad Global (Win Rate)</span>
              <p className="font-display text-sm sm:text-base font-bold text-foreground mt-0.5">
                {annualConversionRate}% ({totalWonCount} ganadas)
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted-foreground">Avance sobre Meta Anual</span>
              <p className="font-display text-sm sm:text-base font-bold text-foreground mt-0.5">
                {annualCompliancePercentage}% de {formatCompactCop(data.annualTargetCop)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
