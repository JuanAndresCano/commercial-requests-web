import React, { useState, useEffect, useMemo } from "react";
import type { SalesTargetsResponse, SalesTargetEntryInput } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Save,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "@/components/icons";
import { fuzzyScore, normalizeText } from "@/lib/fuzzy";
import { toast } from "sonner";
import { useUpdateSalesTargets } from "@/hooks/use-sales-targets";

interface SalesTargetsManagerProps {
  year: number;
  initialData?: SalesTargetsResponse;
  isLoading?: boolean;
}

/** Formats a number with dot thousand separators (Colombian standard: 2.516.000.000) */
export const formatNumberWithDots = (val: number | string): string => {
  const num = typeof val === "number" ? val : parseInt(String(val).replace(/\D/g, ""), 10);
  if (isNaN(num) || num === 0) return "0";
  return num.toLocaleString("es-CO");
};

/** Parses a dot-separated string back to raw number (e.g. "2.516.000.000" -> 2516000000) */
export const parseDotsToNumber = (str: string): number => {
  const clean = str.replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
};

export function SalesTargetsManager({ year, initialData, isLoading }: SalesTargetsManagerProps) {
  const currentYear = new Date().getFullYear();
  const isPastYear = year < currentYear;

  const updateTargetsMutation = useUpdateSalesTargets();

  // Local state for University global target
  const [centerCop, setCenterCop] = useState<number>(2516000000);
  const [centerConversionRate, setCenterConversionRate] = useState<number>(35);

  // Local state for KAM individual quotas
  const [kamRows, setKamRows] = useState<
    Array<{
      kamId: string;
      kamName: string;
      kamEmail: string;
      targetCop: number;
      targetProposals: number;
    }>
  >([]);

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    if (initialData) {
      setCenterCop(initialData.centerTarget.annualTargetCop || 2516000000);
      const rawRate = initialData.centerTarget.annualTargetProposals;
      setCenterConversionRate(rawRate > 0 && rawRate <= 100 ? rawRate : 35);

      if (initialData.kamTargets.length > 0) {
        setKamRows(
          initialData.kamTargets.map((k) => ({
            kamId: k.kamId,
            kamName: k.kamName,
            kamEmail: k.kamEmail,
            targetCop: k.annualTargetCop || 0,
            targetProposals:
              k.annualTargetProposals > 0 && k.annualTargetProposals <= 100 ? k.annualTargetProposals : 35,
          })),
        );
      }
    }
  }, [initialData]);

  // Handle equal distribution among KAMs with exact remainder allocation
  const handleEqualDistribution = () => {
    if (isPastYear || kamRows.length === 0) return;
    const n = kamRows.length;
    const baseCop = Math.floor(centerCop / n);
    const remCop = centerCop % n;

    setKamRows((prev) =>
      prev.map((r, i) => ({
        ...r,
        targetCop: baseCop + (i < remCop ? 1 : 0),
        targetProposals: centerConversionRate,
      })),
    );
    toast.info("Meta global distribuida equitativamente entre los KAMs");
  };

  const handleKamTargetChange = (kamId: string, field: "targetCop" | "targetProposals", value: number) => {
    if (isPastYear) return;
    setKamRows((prev) => prev.map((r) => (r.kamId === kamId ? { ...r, [field]: Math.max(0, value) } : r)));
  };

  const handleKamPercentChange = (kamId: string, pctValue: number) => {
    if (isPastYear) return;
    const validPct = Math.max(0, pctValue);
    const calculatedCop = Math.round(centerCop * (validPct / 100));
    handleKamTargetChange(kamId, "targetCop", calculatedCop);
  };

  // Calculations for balance and validation
  const totalAssignedCop = kamRows.reduce((acc, r) => acc + r.targetCop, 0);

  const diffCop = centerCop - totalAssignedCop;
  const isBalanced = totalAssignedCop === centerCop;
  const totalSharePct = centerCop > 0 ? Math.round((totalAssignedCop / centerCop) * 1000) / 10 : 0;

  // Filter KAMs by query (Fuzzy + Substring)
  const filteredKams = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return kamRows;
    const qNorm = normalizeText(q);

    return kamRows.filter((k) => {
      const nameNorm = normalizeText(k.kamName);
      const emailNorm = normalizeText(k.kamEmail || "");
      const score = fuzzyScore(q, k.kamName);
      return score >= 0.45 || nameNorm.includes(qNorm) || emailNorm.includes(qNorm);
    });
  }, [kamRows, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredKams.length / pageSize));
  const paginatedKams = useMemo(() => {
    if (showAll) return filteredKams;
    const start = (currentPage - 1) * pageSize;
    return filteredKams.slice(start, start + pageSize);
  }, [filteredKams, currentPage, showAll, pageSize]);

  // Save handler
  const handleSave = async () => {
    if (isPastYear) {
      toast.warning("No es posible modificar metas de años pasados por políticas de auditoría institucional.");
      return;
    }

    if (!isBalanced) {
      toast.warning(
        `Atención: Desbalance en metas. La suma de KAMs (${formatCompactCop(totalAssignedCop)}) difiere de la meta global (${formatCompactCop(centerCop)}). Guardando de todos modos...`,
      );
    }

    const payloadTargets: SalesTargetEntryInput[] = [
      {
        month: null,
        kamId: null,
        targetCop: centerCop,
        targetProposals: centerConversionRate,
      },
      ...kamRows.map((k) => ({
        month: null,
        kamId: k.kamId,
        targetCop: k.targetCop,
        targetProposals: k.targetProposals,
      })),
    ];

    try {
      await updateTargetsMutation.mutateAsync({
        year,
        targets: payloadTargets,
      });
      toast.success("Metas institucionales actualizadas exitosamente");
    } catch {
      toast.error("Ocurrió un error al guardar las metas financieras. Intenta nuevamente.");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 w-48 bg-muted rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-20 bg-muted/60 rounded-xl" />
          <div className="h-20 bg-muted/60 rounded-xl" />
          <div className="h-20 bg-muted/60 rounded-xl" />
        </div>
        <div className="h-64 bg-muted/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-6">
      {/* 1. Cabecera del Gestor con Selector de Acciones */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Gestor de Metas Presupuestales — Dirección Financiera
            </h2>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">Año {year}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configura la meta anual institucional de la Universidad y distribuye las cuotas comerciales por ejecutivo
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isPastYear && (
            <button
              type="button"
              onClick={handleEqualDistribution}
              disabled={isPastYear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Dividir en partes iguales entre los ejecutivos activos"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
              <span>Reparto Equitativo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPastYear || updateTargetsMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPastYear ? (
              <>
                <Lock className="h-4 w-4" />
                <span>Periodo Bloqueado</span>
              </>
            ) : updateTargetsMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Metas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta de Periodo Fiscal Cerrado (Años Pasados) */}
      {isPastYear && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
          <Lock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold">Periodo fiscal cerrado ({year}):</span>
            <span className="ml-1">
              Las metas financieras de años anteriores se encuentran en modo de solo lectura para preservar la
              trazabilidad histórica y auditoría institucional.
            </span>
          </div>
        </div>
      )}

      {/* 2. Control Global de Meta de la Universidad */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Meta Anual de la Universidad ($ COP)
            </label>
            <input
              type="text"
              inputMode="numeric"
              disabled={isPastYear}
              value={formatNumberWithDots(centerCop)}
              onChange={(e) => setCenterCop(parseDotsToNumber(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/50 disabled:cursor-not-allowed"
              aria-label="Meta Anual de la Universidad COP"
            />
            <span className="block text-[11px] text-muted-foreground mt-1">
              Base mensual: {formatCompactCop(Math.round(centerCop / 12))} / mes
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Tasa de Conversión Meta (%)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="1"
                min="1"
                max="100"
                disabled={isPastYear}
                value={centerConversionRate}
                onChange={(e) => setCenterConversionRate(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 0)))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Tasa de Conversión Meta"
              />
              <span className="text-muted-foreground font-bold text-xs">%</span>
            </div>
            <span className="block text-[11px] text-muted-foreground mt-1">
              Porcentaje meta de propuestas aprobadas / ganadas (Win Rate institucional)
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold text-foreground mb-1.5">Estado de Balance de Cuotas</span>
            <div
              className={cn(
                "rounded-lg p-2.5 text-xs font-bold flex items-center justify-between",
                isBalanced
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
              )}
            >
              <div className="flex items-center gap-1.5">
                {isBalanced ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span>{isBalanced ? "100% Asignado" : "Desbalance en Asignación"}</span>
              </div>
              <span className="font-mono">
                {formatCompactCop(totalAssignedCop)} ({totalSharePct}%)
              </span>
            </div>
            {!isBalanced && (
              <span className="block text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                {diffCop > 0
                  ? `Faltan ${formatCompactCop(diffCop)} (${(100 - totalSharePct).toFixed(1)}%) por asignar a los KAMs`
                  : `Supera la meta global por ${formatCompactCop(Math.abs(diffCop))} (${(totalSharePct - 100).toFixed(1)}%)`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Grilla Editable por Asesor con Buscador y Paginación */}
      <div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between mb-3">
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">
              Distribución de Cuota Presupuestal por Asesor (KAM)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Ajusta el valor en COP o el porcentaje de participación para calcular automáticamente la cuota.
            </p>
          </div>

          {/* Buscador Fuzzy */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-7 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
              <tr>
                <th className="py-2.5 px-3">Ejecutivo Comercial</th>
                <th className="py-2.5 px-3 text-right">Meta Presupuestal ($ COP)</th>
                <th className="py-2.5 px-3 text-center">Tasa Conversión Meta (%)</th>
                <th className="py-2.5 px-3 text-right">Participación en la Meta (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-card">
              {paginatedKams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                    No se encontraron ejecutivos que coincidan con &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                paginatedKams.map((kam) => {
                  const shareOfBudgetPct = centerCop > 0 ? Math.round((kam.targetCop / centerCop) * 1000) / 10 : 0;

                  return (
                    <tr key={kam.kamId} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-foreground">{kam.kamName}</p>
                        <p className="text-[11px] text-muted-foreground">{kam.kamEmail}</p>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={isPastYear}
                          value={formatNumberWithDots(kam.targetCop)}
                          onChange={(e) =>
                            handleKamTargetChange(kam.kamId, "targetCop", parseDotsToNumber(e.target.value))
                          }
                          className="w-36 rounded-md border border-border bg-background px-2.5 py-1 text-right font-mono text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/50 disabled:cursor-not-allowed"
                          aria-label={`Meta para ${kam.kamName}`}
                        />
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max="100"
                            disabled={isPastYear}
                            value={kam.targetProposals}
                            onChange={(e) =>
                              handleKamTargetChange(
                                kam.kamId,
                                "targetProposals",
                                Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)),
                              )
                            }
                            className="w-16 rounded-md border border-border bg-background px-2 py-1 text-center font-mono text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label={`Conversión meta para ${kam.kamName}`}
                          />
                          <span className="text-muted-foreground font-bold text-xs">%</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            disabled={isPastYear}
                            value={shareOfBudgetPct}
                            onChange={(e) => handleKamPercentChange(kam.kamId, parseFloat(e.target.value) || 0)}
                            className="w-16 rounded-md border border-border bg-background px-1.5 py-1 text-right font-mono text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label={`Porcentaje de meta para ${kam.kamName}`}
                          />
                          <span className="text-muted-foreground font-bold text-xs">%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="border-t-2 border-border bg-muted/20 font-bold text-foreground">
              <tr>
                <td className="py-2.5 px-3">Suma Asignada a KAMs ({kamRows.length} en total)</td>
                <td className="py-2.5 px-3 text-right font-mono text-primary">{formatCompactCop(totalAssignedCop)}</td>
                <td className="py-2.5 px-3 text-center font-mono">{centerConversionRate}% promedio</td>
                <td className="py-2.5 px-3 text-right font-mono">
                  <span
                    className={cn(
                      totalSharePct === 100
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {totalSharePct}%
                  </span>
                  {totalSharePct !== 100 && (
                    <span className="block text-[10px] text-muted-foreground font-normal">
                      {totalSharePct < 100
                        ? `Falta ${(100 - totalSharePct).toFixed(1)}%`
                        : `Excede por ${(totalSharePct - 100).toFixed(1)}%`}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Paginación y Toggle de Visualización */}
        {filteredKams.length > pageSize && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground pt-3">
            <div className="flex items-center gap-2">
              <span>
                Mostrando{" "}
                <span className="font-semibold text-foreground">
                  {showAll
                    ? filteredKams.length
                    : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredKams.length)}`}
                </span>{" "}
                de <span className="font-semibold text-foreground">{filteredKams.length}</span> ejecutivos
              </span>
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="text-primary hover:underline font-semibold cursor-pointer ml-1"
              >
                {showAll ? "Paginar (10 por página)" : "Ver todos"}
              </button>
            </div>

            {!showAll && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Anterior</span>
                </button>
                <span className="px-2 font-mono font-semibold text-foreground">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Página siguiente"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
