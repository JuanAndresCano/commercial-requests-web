import React from "react";
import type { KamRankingEntry } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface KamDeepTableProps {
  kamRanking: KamRankingEntry[];
  totalCenterWonCop: number;
}

export function KamDeepTable({ kamRanking, totalCenterWonCop }: KamDeepTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Aggregated center totals
  const totalProposals = kamRanking.reduce((acc, k) => acc + k.totalProposals, 0);
  const totalPipelineCop = kamRanking.reduce((acc, k) => acc + k.pipelineTotalCop, 0);
  const totalDeliveredCop = kamRanking.reduce((acc, k) => acc + k.deliveredTotalCop, 0);
  const totalWonCop = kamRanking.reduce((acc, k) => acc + (k.wonTotalCop ?? k.deliveredTotalCop), 0);
  const totalWonCount = kamRanking.reduce((acc, k) => acc + (k.wonCount ?? k.deliveredCount), 0);
  const centerWinRate = totalDeliveredCop > 0 ? Math.round((totalWonCop / totalDeliveredCop) * 1000) / 10 : 0;
  const centerAvgTicket = totalWonCount > 0 ? Math.round(totalWonCop / totalWonCount) : 0;

  return (
    <div
      data-testid="kam-deep-table"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs overflow-hidden"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
            Tabla Consolidada de Productividad Comercial por Asesor
          </h2>
          <p className="text-xs text-muted-foreground">
            Los 8 indicadores de desempeño comercial de la fuerza de ventas (efectividad, participación, ticket y metas)
          </p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{kamRanking.length} ejecutivos activos</span>
      </div>

      <div className="overflow-x-auto -mx-5 sm:-mx-6">
        <table className="w-full text-left text-xs min-w-[850px]">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
            <tr>
              <th className="py-3 px-4">Ejecutivo Comercial</th>
              <th className="py-3 px-3 text-center">Gestionadas</th>
              <th className="py-3 px-3 text-right">Ofertado ($)</th>
              <th className="py-3 px-3 text-right">Vendido ($)</th>
              <th className="py-3 px-3 text-center">Win Rate</th>
              <th className="py-3 px-3 text-center">Participación</th>
              <th className="py-3 px-3 text-right">Ticket Promedio</th>
              <th className="py-3 px-4 text-center min-w-[140px]">Cumplimiento Meta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {kamRanking.map((kam) => {
              const wonCop = kam.wonTotalCop ?? kam.deliveredTotalCop;
              const sharePct =
                kam.shareOfTotalSalesPercentage ??
                (totalCenterWonCop > 0 ? Math.round((wonCop / totalCenterWonCop) * 1000) / 10 : 0);
              const compliancePct =
                kam.targetCompliancePercentage ??
                (kam.targetCop && kam.targetCop > 0 ? Math.round((wonCop / kam.targetCop) * 1000) / 10 : 0);

              return (
                <tr key={kam.kamId} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {getInitials(kam.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{kam.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{kam.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className="rounded-md bg-muted px-2 py-0.5 font-bold text-foreground">
                      {kam.totalProposals}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right font-medium text-foreground">
                    {formatCompactCop(kam.pipelineTotalCop + kam.deliveredTotalCop)}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCompactCop(wonCop)}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {kam.wonCount ?? kam.deliveredCount} ganadas
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 font-bold text-[11px]",
                        (kam.winRatePercentage ?? 0) >= 20
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {kam.winRatePercentage ?? 0}%
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center font-bold text-foreground">{sharePct}%</td>

                  <td className="py-3.5 px-3 text-right font-medium text-foreground">
                    {formatCompactCop(kam.averageTicketCop ?? 0)}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 items-center">
                      <div className="flex items-center justify-between w-full text-[10px] font-bold">
                        <span className="text-muted-foreground">{formatCompactCop(kam.targetCop ?? 0)}</span>
                        <span
                          className={
                            compliancePct >= 100
                              ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                              : "text-foreground"
                          }
                        >
                          {compliancePct}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            compliancePct >= 100
                              ? "bg-emerald-500"
                              : compliancePct >= 70
                                ? "bg-primary"
                                : "bg-amber-500",
                          )}
                          style={{ width: `${Math.min(compliancePct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Fila Totalizadora del Centro */}
          <tfoot className="border-t-2 border-border bg-muted/30 font-bold text-foreground">
            <tr>
              <td className="py-3 px-4">Consolidado del Centro</td>
              <td className="py-3 px-3 text-center">{totalProposals}</td>
              <td className="py-3 px-3 text-right">{formatCompactCop(totalPipelineCop + totalDeliveredCop)}</td>
              <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">
                {formatCompactCop(totalWonCop)}
              </td>
              <td className="py-3 px-3 text-center">{centerWinRate}%</td>
              <td className="py-3 px-3 text-center">100%</td>
              <td className="py-3 px-3 text-right">{formatCompactCop(centerAvgTicket)}</td>
              <td className="py-3 px-4 text-center text-muted-foreground">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
