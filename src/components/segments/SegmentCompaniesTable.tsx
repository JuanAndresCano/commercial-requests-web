import { useMemo, useState } from "react";
import type { CompanySegment, SegmentProfile } from "@/lib/api/segments";
import { normalizeText } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";
import { Building2, ChevronLeft, ChevronRight, Search, X } from "@/components/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { companyTypeLabel, formatMonths, formatRate, monthsFromDays, programTypeLabel } from "./segment-format";
import { SegmentChip, SegmentMarker } from "./SegmentMarker";
import { segmentTheme } from "./segment-theme";
import { TruncatedText } from "./TruncatedText";

function FirmBadge({ company }: { company: CompanySegment }) {
  const consistency = Math.round(company.consistency * 100);
  const text = company.isFirm
    ? `Consistencia ${consistency} %: el modelo la dejó en este segmento en casi todas las repeticiones.`
    : `Consistencia ${consistency} %: en varias repeticiones el modelo la asignó a otro segmento. Está en el borde.`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          data-testid={company.isFirm ? "badge-firm" : "badge-edge"}
          className={cn(
            "inline-flex cursor-help items-center rounded-full border px-2 py-0.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-icesi-blue",
            company.isFirm
              ? "border-foreground/30 bg-foreground/10 text-foreground"
              : "border-dashed border-muted-foreground/50 text-muted-foreground",
          )}
        >
          {company.isFirm ? "Firme" : "Borde"}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

interface SegmentCompaniesTableProps {
  companies: CompanySegment[];
  profiles: SegmentProfile[];
  /** Segment currently filtering the table (null = all). */
  selectedSegment?: number | null;
  /** When given, the segment filter chips and the segment column are shown. */
  onSelectSegment?: (segment: number | null) => void;
  /** Id so the variants can scroll here. */
  id?: string;
  className?: string;
}

export function SegmentCompaniesTable({
  companies,
  profiles,
  selectedSegment = null,
  onSelectSegment,
  id,
  className,
}: SegmentCompaniesTableProps) {
  const [firmOnly, setFirmOnly] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const strategyBySegment = useMemo(() => new Map(profiles.map((p) => [p.segment, p])), [profiles]);

  // Firm + search first: the chips show how many companies each segment would have with those two applied.
  const base = useMemo(() => {
    const needle = normalizeText(searchTerm);
    return companies.filter(
      (c) => (!firmOnly || c.isFirm) && (!needle || normalizeText(c.companyName).includes(needle)),
    );
  }, [companies, firmOnly, searchTerm]);

  const countBySegment = useMemo(() => {
    const counts = new Map<number, number>();
    for (const c of base) counts.set(c.segment, (counts.get(c.segment) ?? 0) + 1);
    return counts;
  }, [base]);

  const rows = useMemo(
    () =>
      base
        .filter((c) => selectedSegment === null || c.segment === selectedSegment)
        .sort((a, b) => b.frequency - a.frequency || a.companyName.localeCompare(b.companyName, "es")),
    [base, selectedSegment],
  );

  const totalItems = rows.length;
  const effectivePageSize = pageSize === -1 ? Math.max(1, totalItems) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePageSize;
  const pageRows = rows.slice(startIndex, startIndex + effectivePageSize);
  const showSegmentColumn = Boolean(onSelectSegment);

  const reset = () => setCurrentPage(1);

  return (
    <TooltipProvider delayDuration={150}>
      <section
        id={id}
        data-testid="segment-companies-table"
        className={cn(
          "space-y-4 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6",
          className,
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-icesi-blue" />
              <h2 className="font-display text-base font-bold text-foreground sm:text-lg">Empresas por segmento</h2>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              «Firme» es una empresa que el modelo deja en el mismo segmento casi siempre; «Borde» es la que podría
              estar en otro.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                aria-label="Buscar empresa"
                placeholder="Buscar por razón social..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  reset();
                }}
                className="h-8 w-full rounded-lg border border-border bg-muted/30 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-icesi-blue focus:outline-none focus:ring-1 focus:ring-icesi-blue"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    reset();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Borrar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={firmOnly}
              data-testid="firm-only-switch"
              onClick={() => {
                setFirmOnly((v) => !v);
                reset();
              }}
              className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-1 focus:ring-icesi-blue"
            >
              <span
                className={cn(
                  "relative inline-block h-4 w-7 rounded-full transition-colors",
                  firmOnly ? "bg-icesi-blue" : "bg-muted-foreground/40",
                )}
                aria-hidden="true"
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all",
                    firmOnly ? "left-3.5" : "left-0.5",
                  )}
                />
              </span>
              Solo firmes
            </button>
          </div>
        </div>

        {onSelectSegment && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por segmento">
            <button
              type="button"
              aria-pressed={selectedSegment === null}
              onClick={() => {
                onSelectSegment(null);
                reset();
              }}
              className={cn(
                "inline-flex cursor-pointer items-center rounded-full border px-2.5 py-1 text-xs font-bold transition-colors",
                selectedSegment === null
                  ? "border-foreground/40 bg-foreground/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              Todos ({base.length})
            </button>
            {profiles.map((p) => {
              const theme = segmentTheme(p.strategy);
              const active = selectedSegment === p.segment;
              return (
                <button
                  key={p.segment}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onSelectSegment(active ? null : p.segment);
                    reset();
                  }}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors",
                    active
                      ? cn(theme.border, theme.soft, theme.text, "ring-2", theme.ring)
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <SegmentMarker strategy={p.strategy} />
                  {p.strategy}
                  <span className="font-mono font-semibold">({countBySegment.get(p.segment) ?? 0})</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="-mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="select-none border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                {showSegmentColumn && <th className="px-3 py-3">Segmento</th>}
                <th className="px-3 py-3 text-center">Propuestas</th>
                <th className="px-3 py-3">Última propuesta</th>
                <th className="px-3 py-3 text-right">Tasa de aprobación</th>
                <th className="px-3 py-3">Tipo de empresa</th>
                <th className="px-3 py-3">Tipo de programa</th>
                <th className="px-4 py-3 text-center">Asignación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={showSegmentColumn ? 8 : 7} className="px-4 py-10 text-center text-muted-foreground">
                    <p className="font-semibold text-foreground">Ninguna empresa coincide con los filtros.</p>
                    {firmOnly && <p className="mt-1">Prueba desactivando «Solo firmes» o cambiando la búsqueda.</p>}
                  </td>
                </tr>
              )}
              {pageRows.map((c) => {
                const profile = strategyBySegment.get(c.segment);
                return (
                  <tr key={c.id} data-testid="segment-company-row" className="transition-colors hover:bg-muted/30">
                    <td className="max-w-[280px] px-4 py-3 font-semibold text-foreground">
                      <TruncatedText text={c.companyName} />
                    </td>
                    {showSegmentColumn && (
                      <td className="px-3 py-3">
                        <SegmentChip strategy={profile?.strategy ?? c.segmentLabel} />
                      </td>
                    )}
                    <td className="px-3 py-3 text-center font-mono font-bold text-foreground">{c.frequency}</td>
                    <td className="px-3 py-3 text-foreground">{formatMonths(monthsFromDays(c.recencyDays))}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-foreground">
                      {formatRate(c.approvalRateSmoothed)}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{companyTypeLabel(c.dominantCompanyType)}</td>
                    <td className="max-w-[200px] px-3 py-3 text-muted-foreground">
                      <TruncatedText text={programTypeLabel(c.dominantProgramType)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <FirmBadge company={c} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <div className="flex flex-col gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div data-testid="segment-pagination-counter">
              Mostrando <strong className="text-foreground">{startIndex + 1}</strong> –{" "}
              <strong className="text-foreground">{Math.min(startIndex + pageRows.length, totalItems)}</strong> de{" "}
              <strong className="text-foreground">{totalItems}</strong> empresas
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Mostrar:</span>
                <select
                  aria-label="Empresas por página"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    reset();
                  }}
                  className="h-7 cursor-pointer rounded-md border border-border bg-card px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-icesi-blue"
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={-1}>Ver todas</option>
                </select>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="segment-prev-page"
                    disabled={validPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Anterior</span>
                  </button>
                  <span className="px-2 font-mono text-xs font-semibold text-foreground">
                    {validPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    data-testid="segment-next-page"
                    disabled={validPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </TooltipProvider>
  );
}
