import React, { useState } from "react";
import type { KamRankingEntry } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/mock-data";
import { CheckCircle2, AlertTriangle, AlertCircle, ChevronLeft, ChevronRight } from "@/components/icons";

interface KamTargetVsWonChartProps {
  kamRanking: KamRankingEntry[];
}

export function KamTargetVsWonChart({ kamRanking }: KamTargetVsWonChartProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const pageSize = 10;

  // Find maximum value among targets and won sales for scaling
  const maxVal = Math.max(
    ...kamRanking.map((k) => Math.max(k.wonTotalCop ?? k.deliveredTotalCop, k.targetCop ?? 0)),
    10_000_000,
  );

  const totalPages = Math.max(1, Math.ceil(kamRanking.length / pageSize));
  const displayedKams = showAll ? kamRanking : kamRanking.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div
      data-testid="kam-target-vs-won-chart"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Cumplimiento Comercial: Vendido vs. Meta Individual
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">({kamRanking.length} asesores)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comparación directa entre las ventas reales cerradas por cada asesor y su cuota presupuestal asignada
          </p>
        </div>

        {/* Leyenda y Paginación */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs bg-emerald-500" />
            <span className="text-foreground">Vendido Real</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs bg-primary/70" />
            <span className="text-muted-foreground">Meta Presupuestal</span>
          </div>

          {kamRanking.length > pageSize && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-primary hover:underline font-semibold cursor-pointer mr-1"
              >
                {showAll ? "Paginado (Top 10)" : "Ver todos"}
              </button>
              {!showAll && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Página anterior de asesores"
                    className="p-1 rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] text-muted-foreground font-mono px-1">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Página siguiente de asesores"
                    className="p-1 rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {displayedKams.map((kam) => {
          const wonCop = kam.wonTotalCop ?? 0;
          const targetCop = kam.targetCop ?? 0;
          const hasTarget = targetCop > 0;

          const compliancePct = hasTarget
            ? (kam.targetCompliancePercentage ?? Math.round((wonCop / targetCop) * 1000) / 10)
            : 0;

          const wonWidth = wonCop > 0 ? Math.min(Math.round((wonCop / maxVal) * 100), 100) : 0;
          const targetWidth = targetCop > 0 ? Math.min(Math.round((targetCop / maxVal) * 100), 100) : 0;

          return (
            <div key={kam.kamId} className="flex flex-col gap-1.5">
              {/* Encabezado del KAM con Estado */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{kam.name}</span>
                  <span className="text-muted-foreground text-[11px] hidden sm:inline">
                    ({kam.wonCount ?? kam.deliveredCount} propuestas ganadas)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!hasTarget ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-muted text-muted-foreground border border-border">
                      <AlertCircle className="h-3 w-3" />
                      <span>Sin meta asignada</span>
                    </span>
                  ) : compliancePct >= 120 ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-600/30">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Superávit destacado ({compliancePct}%)</span>
                    </span>
                  ) : compliancePct >= 100 ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Meta Cumplida ({compliancePct}%)</span>
                    </span>
                  ) : compliancePct >= 80 ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="h-3 w-3" />
                      <span>En seguimiento ({compliancePct}%)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Déficit ({compliancePct}%)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Par de Barras Horizontales */}
              <div className="space-y-1">
                {/* Barra de Vendido Real */}
                <div className="flex items-center gap-3">
                  <div className="h-4 flex-1 rounded-sm bg-muted overflow-hidden">
                    {wonWidth > 0 && (
                      <div
                        className="h-full rounded-sm bg-emerald-500 transition-all duration-500"
                        style={{ width: `${wonWidth}%` }}
                      />
                    )}
                  </div>
                  <span className="w-24 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCompactCop(wonCop)}
                  </span>
                </div>

                {/* Barra de Meta Presupuestal */}
                <div className="flex items-center gap-3">
                  <div className="h-3 flex-1 rounded-sm bg-muted/60 overflow-hidden">
                    {hasTarget && targetWidth > 0 && (
                      <div
                        className="h-full rounded-sm bg-primary/60 transition-all duration-500"
                        style={{ width: `${targetWidth}%` }}
                      />
                    )}
                  </div>
                  <span className="w-24 text-right font-mono text-xs text-muted-foreground">
                    {hasTarget ? formatCompactCop(targetCop) : "Sin meta"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
