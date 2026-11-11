import React from "react";
import type { NodeDistributionEntry } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Network, CheckCircle2, Clock } from "@/components/icons";

interface AcademicNodeRankingTableProps {
  nodeDistribution: NodeDistributionEntry[];
  totalCenterWonCop: number;
}

export function AcademicNodeRankingTable({ nodeDistribution, totalCenterWonCop }: AcademicNodeRankingTableProps) {
  // Aggregate center totals
  const totalProposals = nodeDistribution.reduce((acc, n) => acc + n.totalProposals, 0);
  const totalOfferedCop = nodeDistribution.reduce((acc, n) => acc + n.deliveredTotalCop + n.pipelineTotalCop, 0);
  const totalWonCop = nodeDistribution.reduce((acc, n) => acc + (n.wonTotalCop ?? 0), 0);
  const centerWinRate = totalOfferedCop > 0 ? Math.round((totalWonCop / totalOfferedCop) * 1000) / 10 : 0;

  // Average design and costing days across nodes with sufficient historical data
  const validTechNodes = nodeDistribution.filter(
    (n) => n.avgTechnicalDesignDays !== null && n.avgTechnicalDesignDays !== undefined,
  );
  const avgTechnicalDays =
    validTechNodes.length > 0
      ? Math.round(
          (validTechNodes.reduce((acc, n) => acc + (n.avgTechnicalDesignDays ?? 0), 0) / validTechNodes.length) * 10,
        ) / 10
      : null;

  const validCostNodes = nodeDistribution.filter((n) => n.avgCostingDays !== null && n.avgCostingDays !== undefined);
  const avgCostingDays =
    validCostNodes.length > 0
      ? Math.round((validCostNodes.reduce((acc, n) => acc + (n.avgCostingDays ?? 0), 0) / validCostNodes.length) * 10) /
        10
      : null;

  return (
    <div
      data-testid="academic-node-ranking-table"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs overflow-hidden"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-icesi-blue" />
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Ranking Financiero de Nodos Temáticos & Fábrica Académica
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aporte de los 7 centros de conocimiento a la facturación institucional y tiempos promedio en diseño técnico
            y costeo
          </p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{nodeDistribution.length} líneas evaluadas</span>
      </div>

      <div className="overflow-x-auto -mx-5 sm:-mx-6">
        <table className="w-full text-left text-xs min-w-[850px]">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
            <tr>
              <th className="py-3 px-4">Centro / Nodo Temático</th>
              <th className="py-3 px-3 text-center">Propuestas</th>
              <th className="py-3 px-3 text-right">Monto Ofertado ($)</th>
              <th className="py-3 px-3 text-right">Monto Vendido ($)</th>
              <th className="py-3 px-3 text-center">Win Rate</th>
              <th className="py-3 px-3 text-center">Participación %</th>
              <th className="py-3 px-3 text-center">Días en Diseño (Experto)</th>
              <th className="py-3 px-4 text-center">Días en Costeo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {nodeDistribution.map((node, index) => {
              const offeredCop = node.deliveredTotalCop + node.pipelineTotalCop;
              const wonCop = node.wonTotalCop ?? 0;
              const winRate =
                node.winRatePercentage ?? (offeredCop > 0 ? Math.round((wonCop / offeredCop) * 1000) / 10 : 0);
              const share =
                node.shareOfTotalSalesPercentage ??
                (totalCenterWonCop > 0 ? Math.round((wonCop / totalCenterWonCop) * 1000) / 10 : 0);

              return (
                <tr key={node.nodeId || index} className="hover:bg-muted/30 transition-colors group">
                  {/* Nombre del Nodo con Icono / Ranking */}
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-foreground group-hover:text-icesi-blue transition-colors">
                        {node.name}
                      </span>
                    </div>
                  </td>

                  {/* Conteo de propuestas */}
                  <td className="py-3.5 px-3 text-center font-bold text-foreground">{node.totalProposals}</td>

                  {/* Monto Ofertado */}
                  <td className="py-3.5 px-3 text-right font-medium text-muted-foreground">
                    {formatCompactCop(offeredCop)}
                  </td>

                  {/* Monto Vendido */}
                  <td className="py-3.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCompactCop(wonCop)}
                  </td>

                  {/* Win Rate */}
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold",
                        winRate >= 30
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : winRate >= 10
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
                      )}
                    >
                      {winRate}%
                    </span>
                  </td>

                  {/* Participación en ventas del Centro */}
                  <td className="py-3.5 px-3 text-center font-bold text-foreground">
                    <div className="flex flex-col items-center gap-1">
                      <span>{share}%</span>
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-icesi-blue rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, share)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Días en Diseño Técnico */}
                  <td className="py-3.5 px-3 text-center font-medium">
                    {node.avgTechnicalDesignDays !== null && node.avgTechnicalDesignDays !== undefined ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold",
                          node.avgTechnicalDesignDays <= 7
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : node.avgTechnicalDesignDays <= 10
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400",
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        {node.avgTechnicalDesignDays}d
                      </span>
                    ) : (
                      <span
                        title="Sin datos suficientes (< 3 solicitudes cerradas)"
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-muted-foreground border border-border cursor-help"
                      >
                        S/D
                      </span>
                    )}
                  </td>

                  {/* Días en Costeo */}
                  <td className="py-3.5 px-4 text-center font-medium">
                    {node.avgCostingDays !== null && node.avgCostingDays !== undefined ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold",
                          node.avgCostingDays <= 3
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : node.avgCostingDays <= 5
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400",
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        {node.avgCostingDays}d
                      </span>
                    ) : (
                      <span
                        title="Sin datos suficientes (< 3 solicitudes cerradas)"
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-muted-foreground border border-border cursor-help"
                      >
                        S/D
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Fila Totalizadora Institucional */}
          <tfoot className="border-t-2 border-border bg-muted/60 font-bold text-foreground">
            <tr>
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-icesi-blue" />
                  <span>Total Fábrica Académica Icesi</span>
                </div>
              </td>
              <td className="py-3.5 px-3 text-center font-bold text-foreground">{totalProposals}</td>
              <td className="py-3.5 px-3 text-right font-bold text-foreground">{formatCompactCop(totalOfferedCop)}</td>
              <td className="py-3.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                {formatCompactCop(totalWonCop)}
              </td>
              <td className="py-3.5 px-3 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-icesi-blue/10 text-icesi-blue">
                  {centerWinRate}%
                </span>
              </td>
              <td className="py-3.5 px-3 text-center font-bold text-foreground">100%</td>
              <td className="py-3.5 px-3 text-center font-bold text-muted-foreground">
                {avgTechnicalDays !== null ? `${avgTechnicalDays}d prom` : "S/D"}
              </td>
              <td className="py-3.5 px-4 text-center font-bold text-muted-foreground">
                {avgCostingDays !== null ? `${avgCostingDays}d prom` : "S/D"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
