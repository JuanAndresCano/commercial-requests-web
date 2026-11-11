import React, { useState } from "react";
import type { MonthlyTrendsData, YoYComparisonPoint } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "@/components/icons";

interface YoySalesCurveChartProps {
  data?: MonthlyTrendsData;
  isLoading?: boolean;
}

export function YoySalesCurveChart({ data, isLoading }: YoySalesCurveChartProps) {
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

  const yoyComparison = Array.isArray(data.yoyComparison) ? data.yoyComparison : [];
  const { year, previousYear, totalWonCop = 0, previousYearSummary } = data;
  const prevTotalWon = previousYearSummary?.totalWonCop || 0;
  const netGrowthCop = totalWonCop - prevTotalWon;
  const netGrowthPercentage = prevTotalWon > 0 ? Math.round((netGrowthCop / prevTotalWon) * 1000) / 10 : 0;

  // Maximum value for SVG scaling
  const maxVal = Math.max(
    ...(yoyComparison.length > 0 ? yoyComparison.map((d) => Math.max(d.currentYearWonCop, d.previousYearWonCop)) : [0]),
    10_000_000,
  );

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 230;
  const paddingX = 25;
  const paddingY = 20;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  // Coordinate mapping
  const pointsCurrent = yoyComparison.map((d, i) => {
    const x = paddingX + (i / 11) * innerWidth;
    const y = svgHeight - paddingY - (d.currentYearWonCop / maxVal) * innerHeight;
    return { x, y, data: d };
  });

  const pointsPrev = yoyComparison.map((d, i) => {
    const x = paddingX + (i / 11) * innerWidth;
    const y = svgHeight - paddingY - (d.previousYearWonCop / maxVal) * innerHeight;
    return { x, y, data: d };
  });

  // SVG Path generation
  const pathCurrent = pointsCurrent.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    "",
  );

  const pathPrev = pointsPrev.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), "");

  const activePoint: YoYComparisonPoint | null =
    activeMonthIndex !== null ? (yoyComparison[activeMonthIndex] ?? null) : null;

  const activeVariance = activePoint
    ? typeof activePoint.varianceCop === "number" && !isNaN(activePoint.varianceCop)
      ? activePoint.varianceCop
      : (activePoint.currentYearWonCop ?? 0) - (activePoint.previousYearWonCop ?? 0)
    : 0;

  return (
    <div
      data-testid="yoy-sales-curve-chart"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs transition-all flex flex-col justify-between"
    >
      {/* 1. Cabecera y Leyenda */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Curva Comparativa Interanual de Ventas
            </h2>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold whitespace-nowrap shrink-0",
                netGrowthCop >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              <span>{netGrowthPercentage > 0 ? `+${netGrowthPercentage}%` : `${netGrowthPercentage}%`}</span>
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Comparación de ventas cerradas mes a mes: {year} (Azul Icesi) frente al histórico de {previousYear} (Gris)
          </p>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded-full bg-primary" />
            <span className="text-foreground">{year} (Actual)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-6 border-t-2 border-dashed border-zinc-400" />
            <span className="text-muted-foreground">{previousYear} (Previo)</span>
          </div>
        </div>
      </div>

      {/* 2. Gráfico SVG de Líneas Interactivas con Eje Y */}
      <div className="mt-6 flex items-stretch gap-2">
        {/* Eje Y: Índices de Valor */}
        <div className="flex flex-col justify-between py-2 text-[10px] font-mono text-muted-foreground select-none shrink-0 text-right w-11 sm:w-14">
          <span>{formatCompactCop(maxVal)}</span>
          <span>{formatCompactCop(maxVal * 0.66)}</span>
          <span>{formatCompactCop(maxVal * 0.33)}</span>
          <span>$ 0</span>
        </div>

        {/* Contenedor del Gráfico con Borde */}
        <div className="relative h-64 flex-1 flex flex-col justify-between pt-2 pb-1 border-b border-l border-border/80">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full select-none"
            preserveAspectRatio="none"
            onMouseLeave={() => setActiveMonthIndex(null)}
          >
            {/* Líneas horizontales de referencia */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = paddingY + (1 - pct) * innerHeight;
              return (
                <g key={pct}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.1"
                    strokeDasharray="4 4"
                  />
                </g>
              );
            })}

            {/* Línea Año Anterior (Dashed Zinc) */}
            <path
              d={pathPrev}
              fill="none"
              stroke="#71717a"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-70 pointer-events-none"
            />

            {/* Línea Año Actual (Solid Azul Icesi) */}
            <path
              d={pathCurrent}
              fill="none"
              stroke="#5454e9"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="filter drop-shadow-sm pointer-events-none"
            />

            {/* Línea vertical indicadora del mes activo */}
            {activeMonthIndex !== null && pointsCurrent[activeMonthIndex] && (
              <line
                x1={pointsCurrent[activeMonthIndex].x}
                y1={paddingY}
                x2={pointsCurrent[activeMonthIndex].x}
                y2={svgHeight - paddingY}
                stroke="#5454e9"
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeDasharray="3 3"
                pointerEvents="none"
              />
            )}

            {/* Puntos Visibles (Año Previo y Año Actual más grandes) */}
            {pointsCurrent.map((pt, i) => {
              const isHovered = activeMonthIndex === i;
              const ptPrev = pointsPrev[i];

              return (
                <g key={`pt-${i}`} pointerEvents="none">
                  {/* Punto Año Anterior */}
                  <circle
                    cx={ptPrev.x}
                    cy={ptPrev.y}
                    r={isHovered ? 6 : 4}
                    fill="#71717a"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2 : 1}
                    className="transition-all duration-150"
                  />

                  {/* Halo / Glow para Año Actual cuando está en hover */}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={14}
                      fill="#5454e9"
                      opacity={0.2}
                      className="transition-all duration-150"
                    />
                  )}

                  {/* Punto Año Actual */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 8 : 5}
                    fill="#5454e9"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2.5 : 2}
                    className="transition-all duration-150 filter drop-shadow-sm"
                  />
                </g>
              );
            })}

            {/* Franjas transparentes continuas de interacción amplia (Hover Slices) */}
            {pointsCurrent.map((pt, i) => {
              const sliceWidth = innerWidth / (pointsCurrent.length - 1 || 1);
              const xStart = i === 0 ? 0 : pt.x - sliceWidth / 2;
              const xEnd = i === pointsCurrent.length - 1 ? svgWidth : pt.x + sliceWidth / 2;
              const actualWidth = xEnd - xStart;

              return (
                <rect
                  key={`slice-${i}`}
                  x={xStart}
                  y={0}
                  width={actualWidth}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveMonthIndex(i)}
                  onClick={() => setActiveMonthIndex(activeMonthIndex === i ? null : i)}
                />
              );
            })}
          </svg>

          {/* Eje X con Meses */}
          <div className="flex justify-between px-2 pt-1 pb-0.5 text-[10px] sm:text-xs font-bold text-muted-foreground border-t border-border/30">
            {yoyComparison.map((m, i) => (
              <button
                key={m.month}
                type="button"
                onClick={() => setActiveMonthIndex(activeMonthIndex === i ? null : i)}
                className={cn(
                  "transition-colors hover:text-primary cursor-pointer px-1 py-0.5 select-none",
                  activeMonthIndex === i ? "text-primary font-black underline" : "",
                )}
              >
                {m.monthName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Panel de Detalle Comparativo Interanual */}
      <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-3.5 sm:p-4">
        {/* Fila Superior: Título de Contexto y Variación */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-bold text-sm sm:text-base text-foreground">
              {activePoint ? `Comparativo de ${activePoint.monthName}` : `Ritmo Anual de Facturación Interanual`}
            </span>
            {activePoint ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap shrink-0",
                  activeVariance >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {activePoint.growthPercentage > 0
                  ? `+${activePoint.growthPercentage}%`
                  : `${activePoint.growthPercentage}%`}
              </span>
            ) : (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap shrink-0",
                  netGrowthPercentage >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {netGrowthPercentage > 0 ? `+${netGrowthPercentage}%` : `${netGrowthPercentage}%`}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md">
            {activePoint
              ? `Variación neta en el mes: ${activeVariance >= 0 ? `+${formatCompactCop(activeVariance)}` : formatCompactCop(activeVariance)}`
              : `${year} acumula ${formatCompactCop(totalWonCop)} frente a ${formatCompactCop(prevTotalWon)} de ${previousYear}`}
          </span>
        </div>

        {/* Fila Inferior: Métricas Comparativas en 3 columnas simétricas */}
        {activePoint ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-left">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">Ventas {year}</span>
              <p className="font-display text-sm sm:text-base font-bold text-primary mt-1">
                {formatCompactCop(activePoint.currentYearWonCop)}
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Año en curso</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">
                Ventas {previousYear}
              </span>
              <p className="font-display text-sm sm:text-base font-bold text-muted-foreground mt-1">
                {formatCompactCop(activePoint.previousYearWonCop)}
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Histórico previo</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">Diferencia Neta</span>
              <p
                className={cn(
                  "font-display text-sm sm:text-base font-bold mt-1",
                  activeVariance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                )}
              >
                {activeVariance >= 0 ? `+${formatCompactCop(activeVariance)}` : formatCompactCop(activeVariance)}
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Crecimiento: {activePoint.growthPercentage}%
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-left">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">Acumulado {year}</span>
              <p className="font-display text-sm sm:text-base font-bold text-primary mt-1">
                {formatCompactCop(totalWonCop)}
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Año en curso</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">
                Acumulado {previousYear}
              </span>
              <p className="font-display text-sm sm:text-base font-bold text-muted-foreground mt-1">
                {formatCompactCop(prevTotalWon)}
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Histórico previo</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block leading-tight">Diferencia Neta</span>
              <p
                className={cn(
                  "font-display text-sm sm:text-base font-bold mt-1",
                  netGrowthCop >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                )}
              >
                {netGrowthCop >= 0 ? `+${formatCompactCop(netGrowthCop)}` : formatCompactCop(netGrowthCop)}
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Crecimiento global</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
