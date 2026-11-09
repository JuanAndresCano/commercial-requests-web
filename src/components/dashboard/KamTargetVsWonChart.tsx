import React from "react";
import type { KamRankingEntry } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle } from "@/components/icons";

interface KamTargetVsWonChartProps {
  kamRanking: KamRankingEntry[];
}

export function KamTargetVsWonChart({ kamRanking }: KamTargetVsWonChartProps) {
  // Find maximum value among targets and won sales for scaling
  const maxVal = Math.max(
    ...kamRanking.map((k) => Math.max(k.wonTotalCop ?? k.deliveredTotalCop, k.targetCop ?? 0)),
    10_000_000,
  );

  return (
    <div
      data-testid="kam-target-vs-won-chart"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Cumplimiento Comercial: Vendido vs. Meta Individual
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comparación directa entre las ventas reales cerradas por cada asesor y su cuota presupuestal asignada
          </p>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs bg-emerald-500" />
            <span className="text-foreground">Vendido Real</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs bg-primary/70" />
            <span className="text-muted-foreground">Meta Presupuestal</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {kamRanking.map((kam) => {
          const wonCop = kam.wonTotalCop ?? kam.deliveredTotalCop;
          const targetCop = kam.targetCop ?? 0;
          const compliancePct =
            kam.targetCompliancePercentage ?? (targetCop > 0 ? Math.round((wonCop / targetCop) * 1000) / 10 : 0);

          const wonWidth = Math.min(Math.round((wonCop / maxVal) * 100), 100);
          const targetWidth = Math.min(Math.round((targetCop / maxVal) * 100), 100);
          const isTargetMet = compliancePct >= 100;

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
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                      isTargetMet
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {isTargetMet ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Meta Superada ({compliancePct}%)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        <span>{compliancePct}% de la meta</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Par de Barras Horizontales */}
              <div className="space-y-1">
                {/* Barra de Vendido Real */}
                <div className="flex items-center gap-3">
                  <div className="h-4 flex-1 rounded-sm bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-emerald-500 transition-all duration-500 flex items-center justify-end pr-1.5"
                      style={{ width: `${Math.max(wonWidth, 3)}%` }}
                    />
                  </div>
                  <span className="w-24 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCompactCop(wonCop)}
                  </span>
                </div>

                {/* Barra de Meta Presupuestal */}
                <div className="flex items-center gap-3">
                  <div className="h-3 flex-1 rounded-sm bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-primary/60 transition-all duration-500 flex items-center justify-end pr-1.5"
                      style={{ width: `${Math.max(targetWidth, 3)}%` }}
                    />
                  </div>
                  <span className="w-24 text-right font-mono text-xs text-muted-foreground">
                    {formatCompactCop(targetCop)}
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
