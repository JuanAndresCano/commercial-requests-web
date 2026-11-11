import React, { useState, useMemo, useEffect } from "react";
import type { KamRankingEntry } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Search, X, ChevronLeft, ChevronRight } from "@/components/icons";
import { fuzzyScore, normalizeText } from "@/lib/fuzzy";

interface KamDeepTableProps {
  kamRanking: KamRankingEntry[];
  totalCenterWonCop: number;
}

export function KamDeepTable({ kamRanking, totalCenterWonCop }: KamDeepTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Filter KAMs with fuzzy search on name and substring on email
  const filteredKams = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return kamRanking;
    const qNorm = normalizeText(q);

    return kamRanking.filter((k) => {
      const nameNorm = normalizeText(k.name);
      const emailNorm = normalizeText(k.email || "");
      const score = fuzzyScore(q, k.name);
      return score >= 0.45 || nameNorm.includes(qNorm) || emailNorm.includes(qNorm);
    });
  }, [kamRanking, searchQuery]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredKams.length / pageSize));
  const paginatedKams = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredKams.slice(start, start + pageSize);
  }, [filteredKams, currentPage, pageSize]);

  // Aggregated center totals across ALL KAMs (unfiltered grand totals)
  const totalProposals = kamRanking.reduce((acc, k) => acc + k.totalProposals, 0);
  const totalPipelineCop = kamRanking.reduce((acc, k) => acc + k.pipelineTotalCop, 0);
  const totalDeliveredCop = kamRanking.reduce((acc, k) => acc + k.deliveredTotalCop, 0);
  const totalWonCop = kamRanking.reduce((acc, k) => acc + (k.wonTotalCop ?? 0), 0);
  const totalWonCount = kamRanking.reduce((acc, k) => acc + (k.wonCount ?? 0), 0);
  const centerWinRate = totalDeliveredCop > 0 ? Math.round((totalWonCop / totalDeliveredCop) * 1000) / 10 : 0;
  const centerAvgTicket = totalWonCount > 0 ? Math.round(totalWonCop / totalWonCount) : 0;

  return (
    <div
      data-testid="kam-deep-table"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs overflow-hidden"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
            Tabla Consolidada de Productividad Comercial por Asesor
          </h2>
          <p className="text-xs text-muted-foreground">
            Los 8 indicadores de desempeño comercial de la fuerza de ventas (efectividad, participación, ticket y metas)
          </p>
        </div>

        {/* Buscador Difuso Integrado */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar asesor o correo..."
            className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-icesi-blue focus:outline-none focus:ring-1 focus:ring-icesi-blue"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Borrar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
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
            {paginatedKams.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                  No se encontraron ejecutivos comerciales que coincidan con &quot;{searchQuery}&quot;.
                </td>
              </tr>
            ) : (
              paginatedKams.map((kam) => {
                const wonCop = kam.wonTotalCop ?? 0;
                const sharePct =
                  kam.shareOfTotalSalesPercentage ??
                  (totalCenterWonCop > 0 ? Math.round((wonCop / totalCenterWonCop) * 1000) / 10 : 0);
                const hasTarget = Boolean(kam.targetCop && kam.targetCop > 0);
                const compliancePct = hasTarget
                  ? (kam.targetCompliancePercentage ?? Math.round((wonCop / kam.targetCop!) * 1000) / 10)
                  : 0;

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
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCompactCop(wonCop)}
                      </span>
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
                      {!hasTarget ? (
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            Sin meta asignada
                          </span>
                          <div className="h-1.5 w-full rounded-full bg-muted/60" />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 items-center">
                          <div className="flex items-center justify-between w-full text-[10px] font-bold">
                            <span className="text-muted-foreground">{formatCompactCop(kam.targetCop!)}</span>
                            <span
                              className={
                                compliancePct >= 120
                                  ? "text-emerald-700 dark:text-emerald-300 font-extrabold"
                                  : compliancePct >= 100
                                    ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                                    : compliancePct >= 80
                                      ? "text-amber-600 dark:text-amber-400 font-bold"
                                      : "text-destructive font-bold"
                              }
                            >
                              {compliancePct}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            {compliancePct > 0 && (
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  compliancePct >= 120
                                    ? "bg-emerald-600"
                                    : compliancePct >= 100
                                      ? "bg-emerald-500"
                                      : compliancePct >= 80
                                        ? "bg-amber-500"
                                        : "bg-destructive",
                                )}
                                style={{ width: `${Math.min(compliancePct, 100)}%` }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Fila Totalizadora del Centro (Consolidado Global de Todos los Asesores) */}
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

      {/* Paginación de la Tabla */}
      {filteredKams.length > pageSize && (
        <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs text-muted-foreground">
          <span>
            Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredKams.length)} de{" "}
            {filteredKams.length} ejecutivos
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Anterior</span>
            </button>
            <span className="font-mono text-xs px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
