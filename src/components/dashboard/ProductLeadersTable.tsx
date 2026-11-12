import React from "react";
import type { ProductLeaderEntry } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Users, Layers, Award } from "@/components/icons";

interface ProductLeadersTableProps {
  productLeaders: ProductLeaderEntry[];
  totalCenterWonCop: number;
}

export function ProductLeadersTable({ productLeaders, totalCenterWonCop }: ProductLeadersTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Aggregate center totals
  const totalAssigned = productLeaders.reduce((acc, l) => acc + l.totalAssigned, 0);
  const totalQuotedCop = productLeaders.reduce((acc, l) => acc + l.quotedTotalCop, 0);
  const totalWonCop = productLeaders.reduce((acc, l) => acc + l.wonTotalCop, 0);
  const centerWinRate = totalQuotedCop > 0 ? Math.round((totalWonCop / totalQuotedCop) * 1000) / 10 : 0;

  return (
    <div
      data-testid="product-leaders-table"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs overflow-hidden"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Líderes de Producto — Responsables de la Creación de Oferta
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Efectividad técnica, volumen gestionado y tasa de conversión de los directores académicos que estructuran
            soluciones
          </p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{productLeaders.length} líderes activos</span>
      </div>

      <div className="overflow-x-auto -mx-5 sm:-mx-6">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
            <tr>
              <th className="py-3 px-4">Líder Académico / Director de Solución</th>
              <th className="py-3 px-3 text-center">Asignadas</th>
              <th className="py-3 px-3 text-right">Ofertado ($)</th>
              <th className="py-3 px-3 text-right">Vendido ($)</th>
              <th className="py-3 px-3 text-center">Win Rate Técnico</th>
              <th className="py-3 px-4 text-center">Participación %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {productLeaders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                  No hay líderes de producto asignados en el período seleccionado.
                </td>
              </tr>
            ) : (
              productLeaders.map((leader, index) => {
                const share =
                  leader.shareOfTotalSalesPercentage ??
                  (totalCenterWonCop > 0 ? Math.round((leader.wonTotalCop / totalCenterWonCop) * 1000) / 10 : 0);

                return (
                  <tr key={leader.leaderId || index} className="hover:bg-muted/30 transition-colors group">
                    {/* Nombre con Avatar e Iniciales */}
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400">
                          {getInitials(leader.name)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground group-hover:text-icesi-blue transition-colors truncate">
                              {leader.name}
                            </span>
                            {index === 0 && leader.wonTotalCop > 0 && (
                              <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground truncate">{leader.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Propuestas asignadas */}
                    <td className="py-3.5 px-3 text-center font-bold text-foreground">{leader.totalAssigned}</td>

                    {/* Monto Ofertado */}
                    <td className="py-3.5 px-3 text-right font-medium text-muted-foreground">
                      {formatCompactCop(leader.quotedTotalCop)}
                    </td>

                    {/* Monto Vendido */}
                    <td className="py-3.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCompactCop(leader.wonTotalCop)}
                    </td>

                    {/* Win Rate Técnico */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold",
                          leader.winRatePercentage >= 30
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : leader.winRatePercentage >= 10
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
                        )}
                      >
                        {leader.winRatePercentage}%
                      </span>
                    </td>

                    {/* Participación en Ventas */}
                    <td className="py-3.5 px-4 text-center font-bold text-foreground">
                      <div className="flex flex-col items-center gap-1">
                        <span>{share}%</span>
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, share)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Fila Totalizadora */}
          {productLeaders.length > 0 && (
            <tfoot className="border-t-2 border-border bg-muted/60 font-bold text-foreground">
              <tr>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-500" />
                    <span>Total Dirección de Oferta Académica</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center font-bold text-foreground">{totalAssigned}</td>
                <td className="py-3.5 px-3 text-right font-bold text-foreground">{formatCompactCop(totalQuotedCop)}</td>
                <td className="py-3.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCompactCop(totalWonCop)}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {centerWinRate}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-foreground">100%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
