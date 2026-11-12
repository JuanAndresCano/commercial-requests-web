import React, { useState, useMemo } from "react";
import type { CompanyListItem } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { fuzzyScore, normalizeText } from "@/lib/fuzzy";
import {
  Building2,
  Search,
  ArrowUpRight,
  Award,
  CheckCircle2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
} from "@/components/icons";

interface CompanyDirectoryRankingTableProps {
  companies: CompanyListItem[];
  onSelectCompany: (companyId: string) => void;
}

export type CompanySortField = "wonCop" | "quotedCop" | "proposals" | "winRate" | "name" | "nit";
export type SortDirection = "asc" | "desc";

export function CompanyDirectoryRankingTable({ companies, onSelectCompany }: CompanyDirectoryRankingTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");

  // Sorting
  const [sortField, setSortField] = useState<CompanySortField>("wonCop");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract distinct sectors
  const sectors = useMemo(() => {
    const set = new Set<string>();
    for (const c of companies) {
      if (c.sector) set.add(c.sector);
    }
    return Array.from(set).sort();
  }, [companies]);

  // Filter companies with fuzzy matching + exact normalized substring + sector
  const filteredCompanies = useMemo(() => {
    const q = searchTerm.trim();
    const qNorm = normalizeText(q);

    return companies.filter((c) => {
      const matchesSector = selectedSector === "ALL" || c.sector === selectedSector;
      if (!matchesSector) return false;
      if (!q) return true;

      const nameNorm = normalizeText(c.name);
      const nitNorm = normalizeText(c.nit || "");
      const scoreName = fuzzyScore(q, c.name);

      return scoreName >= 0.45 || nameNorm.includes(qNorm) || nitNorm.includes(qNorm);
    });
  }, [companies, searchTerm, selectedSector]);

  // Sort filtered companies
  const sortedCompanies = useMemo(() => {
    return [...filteredCompanies].sort((a, b) => {
      let comparison = 0;
      const quotedA = a.deliveredTotalCop + a.pipelineTotalCop;
      const quotedB = b.deliveredTotalCop + b.pipelineTotalCop;
      const wonA = a.wonTotalCop ?? a.deliveredTotalCop;
      const wonB = b.wonTotalCop ?? b.deliveredTotalCop;
      const rateA = a.winRatePercentage ?? (quotedA > 0 ? (wonA / quotedA) * 100 : 0);
      const rateB = b.winRatePercentage ?? (quotedB > 0 ? (wonB / quotedB) * 100 : 0);

      switch (sortField) {
        case "wonCop":
          comparison = wonA - wonB;
          break;
        case "quotedCop":
          comparison = quotedA - quotedB;
          break;
        case "proposals":
          comparison = a.totalProposals - b.totalProposals;
          break;
        case "winRate":
          comparison = rateA - rateB;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name, "es", { sensitivity: "base" });
          break;
        case "nit":
          comparison = (a.nit || "").localeCompare(b.nit || "", "es", { sensitivity: "base" });
          break;
        default:
          comparison = wonA - wonB;
      }

      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [filteredCompanies, sortField, sortDir]);

  // Toggle column sort
  const handleToggleSort = (field: CompanySortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" || field === "nit" ? "asc" : "desc");
    }
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalItems = sortedCompanies.length;
  const effectivePageSize = pageSize === -1 ? Math.max(1, totalItems) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePageSize;
  const paginatedCompanies =
    pageSize === -1 ? sortedCompanies : sortedCompanies.slice(startIndex, startIndex + effectivePageSize);

  // Aggregated totals of the ENTIRE filtered portfolio (independent of current page)
  const totalProposals = filteredCompanies.reduce((acc, c) => acc + c.totalProposals, 0);
  const totalQuotedCop = filteredCompanies.reduce((acc, c) => acc + c.deliveredTotalCop + c.pipelineTotalCop, 0);
  const totalWonCop = filteredCompanies.reduce((acc, c) => acc + (c.wonTotalCop ?? c.deliveredTotalCop), 0);
  const avgWinRate = totalQuotedCop > 0 ? Math.round((totalWonCop / totalQuotedCop) * 1000) / 10 : 0;

  return (
    <div
      data-testid="company-directory-ranking-table"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs overflow-hidden space-y-4"
    >
      {/* Cabecera y Controles de Búsqueda y Filtros */}
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

        {/* Buscador, Filtro por Sector y Selector de Ordenamiento */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Input de Búsqueda con Fuzzy Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por razón social o NIT..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 w-full rounded-lg border border-border bg-muted/30 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-icesi-blue focus:outline-none focus:ring-1 focus:ring-icesi-blue"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Borrar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filtro Sector */}
          {sectors.length > 0 && (
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                aria-label="Filtrar por sector"
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setCurrentPage(1);
                }}
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

          {/* Selector de Ordenamiento */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-semibold shrink-0">Ordenar:</span>
            <select
              aria-label="Ordenar empresas"
              value={`${sortField}-${sortDir}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split("-") as [CompanySortField, SortDirection];
                setSortField(field);
                setSortDir(dir);
                setCurrentPage(1);
              }}
              className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-icesi-blue"
            >
              <option value="wonCop-desc">Mayor vendido / facturado</option>
              <option value="wonCop-asc">Menor vendido / facturado</option>
              <option value="quotedCop-desc">Mayor cotizado COP</option>
              <option value="quotedCop-asc">Menor cotizado COP</option>
              <option value="proposals-desc">Más propuestas</option>
              <option value="proposals-asc">Menos propuestas</option>
              <option value="winRate-desc">Mayor tasa de éxito (%)</option>
              <option value="winRate-asc">Menor tasa de éxito (%)</option>
              <option value="name-asc">Razón Social (A - Z)</option>
              <option value="name-desc">Razón Social (Z - A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Maestra Paginada */}
      <div className="overflow-x-auto -mx-5 sm:-mx-6">
        <table className="w-full text-left text-xs min-w-[850px]">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold select-none">
            <tr>
              <th
                className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleToggleSort("name")}
                title="Ordenar por razón social"
              >
                <div className="flex items-center gap-1.5">
                  <span># Ranking & Empresa Aliada</span>
                  <ArrowUpDown className={cn("h-3 w-3", sortField === "name" ? "text-primary" : "opacity-40")} />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleToggleSort("nit")}
                title="Ordenar por NIT"
              >
                <div className="flex items-center gap-1.5">
                  <span>NIT</span>
                  <ArrowUpDown className={cn("h-3 w-3", sortField === "nit" ? "text-primary" : "opacity-40")} />
                </div>
              </th>
              <th
                className="py-3 px-3 text-center cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleToggleSort("proposals")}
                title="Ordenar por cantidad de propuestas"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Propuestas</span>
                  <ArrowUpDown className={cn("h-3 w-3", sortField === "proposals" ? "text-primary" : "opacity-40")} />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleToggleSort("quotedCop")}
                title="Ordenar por monto cotizado"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Cotizado ($)</span>
                  <ArrowUpDown className={cn("h-3 w-3", sortField === "quotedCop" ? "text-primary" : "opacity-40")} />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleToggleSort("wonCop")}
                title="Ordenar por monto facturado / vendido"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Facturado / Vendido ($)</span>
                  <ArrowUpDown className={cn("h-3 w-3", sortField === "wonCop" ? "text-primary" : "opacity-40")} />
                </div>
              </th>
              <th
                className="py-3 px-3 text-center cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleToggleSort("winRate")}
                title="Ordenar por tasa de éxito"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Tasa de Éxito</span>
                  <ArrowUpDown className={cn("h-3 w-3", sortField === "winRate" ? "text-primary" : "opacity-40")} />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginatedCompanies.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                  {searchTerm
                    ? `No se encontraron empresas que coincidan con "${searchTerm}".`
                    : "No se encontraron empresas con el criterio de búsqueda ingresado."}
                </td>
              </tr>
            ) : (
              paginatedCompanies.map((company, index) => {
                const quotedCop = company.deliveredTotalCop + company.pipelineTotalCop;
                const wonCop = company.wonTotalCop ?? company.deliveredTotalCop;
                const winRate =
                  company.winRatePercentage ?? (quotedCop > 0 ? Math.round((wonCop / quotedCop) * 1000) / 10 : 0);
                const globalRank = startIndex + index + 1;
                const isTopRanked = sortField === "wonCop" && sortDir === "desc";

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
                            isTopRanked && globalRank === 1 && wonCop > 0
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : isTopRanked && globalRank <= 3 && wonCop > 0
                                ? "bg-muted text-foreground font-bold"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {globalRank}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground group-hover:text-icesi-blue transition-colors truncate">
                              {company.name}
                            </span>
                            {isTopRanked && globalRank === 1 && wonCop > 0 && (
                              <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
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

          {/* Fila Totalizadora del Portafolio Consolidado (Toda la cartera filtrada) */}
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

      {/* Controles de Paginación y Selector de Tamaño de Página */}
      {totalItems > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
          {/* Contador de registros visibles */}
          <div data-testid="company-pagination-counter">
            Mostrando <strong className="text-foreground">{startIndex + 1}</strong> –{" "}
            <strong className="text-foreground">{Math.min(startIndex + paginatedCompanies.length, totalItems)}</strong>{" "}
            de <strong className="text-foreground">{totalItems}</strong> empresas
          </div>

          {/* Selector de cantidad y botones de página */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Tamaño de Página */}
            <div className="flex items-center gap-1.5">
              <span>Mostrar:</span>
              <select
                aria-label="Empresas por página"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 rounded-md border border-border bg-card px-2 text-xs font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-icesi-blue"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
                <option value={-1}>Ver todas</option>
              </select>
            </div>

            {/* Botones Anterior / Siguiente */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid="company-prev-page"
                  disabled={validPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Anterior</span>
                </button>

                <span className="font-mono text-xs px-2 text-foreground font-semibold">
                  {validPage} / {totalPages}
                </span>

                <button
                  type="button"
                  data-testid="company-next-page"
                  disabled={validPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
