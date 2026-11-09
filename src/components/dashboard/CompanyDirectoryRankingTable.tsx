import React, { useState, useMemo } from "react";
import type { CompanyListItem } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Building2, Search, ArrowUpRight, Award, CheckCircle2, SlidersHorizontal } from "@/components/icons";

interface CompanyDirectoryRankingTableProps {
  companies: CompanyListItem[];
  onSelectCompany: (companyId: string) => void;
}

export function CompanyDirectoryRankingTable({ companies, onSelectCompany }: CompanyDirectoryRankingTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");

  // Extract distinct sectors
  const sectors = useMemo(() => {
    const set = new Set<string>();
    for (const c of companies) {
      if (c.sector) set.add(c.sector);
    }
    return Array.from(set).sort();
  }, [companies]);

  // Filter companies by search term and sector
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        searchTerm === "" ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nit && c.nit.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSector = selectedSector === "ALL" || c.sector === selectedSector;

      return matchesSearch && matchesSector;
    });
  }, [companies, searchTerm, selectedSector]);

  // Aggregated totals of the displayed companies
  const totalProposals = filteredCompanies.reduce((acc, c) => acc + c.totalProposals, 0);
  const totalQuotedCop = filteredCompanies.reduce((acc, c) => acc + c.deliveredTotalCop + c.pipelineTotalCop, 0);
  const totalWonCop = filteredCompanies.reduce((acc, c) => acc + (c.wonTotalCop ?? c.deliveredTotalCop), 0);
  const avgWinRate = totalQuotedCop > 0 ? Math.round((totalWonCop / totalQuotedCop) * 1000) / 10 : 0;

  return (
    <div
      data-testid="company-directory-ranking-table"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs overflow-hidden space-y-4"
    >
      {/* Cabecera y Controles de Búsqueda */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-icesi-blue" />
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Directorio y Ranking Maestro de Cuentas Corporativas
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Volumen comercial, facturación acumulada y tasa de conversión por cliente aliado para comités directivos y
            auditoría de cartera
          </p>
        </div>

        {/* Buscador y Filtro por Sector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Input de Búsqueda */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por razón social o NIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-muted/30 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-icesi-blue focus:outline-none focus:ring-1 focus:ring-icesi-blue"
            />
          </div>

          {/* Filtro Sector */}
          {sectors.length > 0 && (
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                aria-label="Filtrar por sector"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-icesi-blue"
              >
                <option value="ALL">Todos los sectores ({companies.length})</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabla Maestra Paginada / Scrollable */}
      <div className="overflow-x-auto -mx-5 sm:-mx-6">
        <table className="w-full text-left text-xs min-w-[850px]">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
            <tr>
              <th className="py-3 px-4"># Ranking & Empresa Aliada</th>
              <th className="py-3 px-3">NIT</th>
              <th className="py-3 px-3 text-center">Propuestas</th>
              <th className="py-3 px-3 text-right">Cotizado ($)</th>
              <th className="py-3 px-3 text-right">Facturado / Vendido ($)</th>
              <th className="py-3 px-3 text-center">Tasa de Éxito</th>
              <th className="py-3 px-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                  No se encontraron empresas con el criterio de búsqueda ingresado.
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company, index) => {
                const quotedCop = company.deliveredTotalCop + company.pipelineTotalCop;
                const wonCop = company.wonTotalCop ?? company.deliveredTotalCop;
                const winRate =
                  company.winRatePercentage ?? (quotedCop > 0 ? Math.round((wonCop / quotedCop) * 1000) / 10 : 0);

                return (
                  <tr
                    key={company.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => onSelectCompany(company.id)}
                  >
                    {/* Ranking & Nombre */}
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                            index === 0 && wonCop > 0
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : index < 3 && wonCop > 0
                                ? "bg-muted text-foreground font-bold"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {index + 1}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground group-hover:text-icesi-blue transition-colors truncate">
                              {company.name}
                            </span>
                            {index === 0 && wonCop > 0 && <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {company.sector && <span>{company.sector}</span>}
                            {company.type && (
                              <>
                                <span>•</span>
                                <span>{company.type}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* NIT */}
                    <td className="py-3.5 px-3 text-muted-foreground font-mono text-[11px]">
                      {company.nit || "Sin NIT"}
                    </td>

                    {/* Propuestas Gestionadas */}
                    <td className="py-3.5 px-3 text-center font-bold text-foreground">{company.totalProposals}</td>

                    {/* Monto Cotizado */}
                    <td className="py-3.5 px-3 text-right font-medium text-muted-foreground">
                      {formatCompactCop(quotedCop)}
                    </td>

                    {/* Monto Vendido */}
                    <td className="py-3.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCompactCop(wonCop)}
                    </td>

                    {/* Tasa de Éxito en la Cuenta */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold",
                          winRate >= 50
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : winRate >= 20
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
                        )}
                      >
                        {winRate}%
                      </span>
                    </td>

                    {/* Botón de Acción 360 */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCompany(company.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs hover:border-icesi-blue hover:text-icesi-blue transition-colors cursor-pointer"
                      >
                        <span>Ficha 360°</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Fila Totalizadora */}
          {filteredCompanies.length > 0 && (
            <tfoot className="border-t-2 border-border bg-muted/60 font-bold text-foreground">
              <tr>
                <td className="py-3.5 px-4" colSpan={2}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-icesi-blue" />
                    <span>Total Cartera ({filteredCompanies.length} empresas)</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center font-bold text-foreground">{totalProposals}</td>
                <td className="py-3.5 px-3 text-right font-bold text-foreground">{formatCompactCop(totalQuotedCop)}</td>
                <td className="py-3.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCompactCop(totalWonCop)}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-icesi-blue/10 text-icesi-blue">
                    {avgWinRate}%
                  </span>
                </td>
                <td className="py-3.5 px-4" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
