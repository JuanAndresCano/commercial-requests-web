import React, { useState, useEffect } from "react";
import type { SalesTargetsResponse, SalesTargetEntryInput } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Save, ArrowLeftRight, CheckCircle2, AlertTriangle, RefreshCw } from "@/components/icons";
import { toast } from "sonner";
import { useUpdateSalesTargets } from "@/hooks/use-sales-targets";

interface SalesTargetsManagerProps {
  year: number;
  initialData?: SalesTargetsResponse;
  isLoading?: boolean;
}

export function SalesTargetsManager({ year, initialData, isLoading }: SalesTargetsManagerProps) {
  const updateTargetsMutation = useUpdateSalesTargets();

  // Local state for Center global target
  const [centerCop, setCenterCop] = useState<number>(2516000000);
  const [centerProposals, setCenterProposals] = useState<number>(45);

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

  useEffect(() => {
    if (initialData) {
      setCenterCop(initialData.centerTarget.annualTargetCop || 2516000000);
      setCenterProposals(initialData.centerTarget.annualTargetProposals || 45);

      if (initialData.kamTargets.length > 0) {
        setKamRows(
          initialData.kamTargets.map((k) => ({
            kamId: k.kamId,
            kamName: k.kamName,
            kamEmail: k.kamEmail,
            targetCop: k.annualTargetCop || 0,
            targetProposals: k.annualTargetProposals || 0,
          })),
        );
      }
    }
  }, [initialData]);

  // Handle equal distribution among KAMs
  const handleEqualDistribution = () => {
    if (kamRows.length === 0) return;
    const splitCop = Math.round(centerCop / kamRows.length);
    const splitProposals = Math.round(centerProposals / kamRows.length);

    setKamRows((prev) =>
      prev.map((r) => ({
        ...r,
        targetCop: splitCop,
        targetProposals: splitProposals,
      })),
    );
    toast.info("Meta global distribuida equitativamente entre los KAMs");
  };

  const handleKamTargetChange = (kamId: string, field: "targetCop" | "targetProposals", value: number) => {
    setKamRows((prev) => prev.map((r) => (r.kamId === kamId ? { ...r, [field]: Math.max(0, value) } : r)));
  };

  const totalAssignedCop = kamRows.reduce((acc, r) => acc + (r.targetCop || 0), 0);
  const totalAssignedProposals = kamRows.reduce((acc, r) => acc + (r.targetProposals || 0), 0);
  const diffCop = centerCop - totalAssignedCop;
  const isBalanced = Math.abs(diffCop) < 1000;

  const handleSave = async () => {
    const payloadTargets: SalesTargetEntryInput[] = [
      // 1. Center Target
      {
        month: null,
        kamId: null,
        targetCop: centerCop,
        targetProposals: centerProposals,
      },
      // 2. Individual KAM Targets
      ...kamRows.map((r) => ({
        month: null,
        kamId: r.kamId,
        targetCop: r.targetCop,
        targetProposals: r.targetProposals,
      })),
    ];

    try {
      await updateTargetsMutation.mutateAsync({
        year,
        targets: payloadTargets,
      });
      toast.success("Metas institucionales actualizadas exitosamente");
    } catch {
      toast.error("Ocurrió un error al guardar las metas presupuestales");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs animate-pulse">
        <div className="h-6 w-64 bg-muted rounded-md mb-2" />
        <div className="h-4 w-96 bg-muted/60 rounded-md mb-6" />
        <div className="h-48 bg-muted/30 rounded-xl" />
      </div>
    );
  }

  return (
    <div
      data-testid="sales-targets-manager"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-6"
    >
      {/* 1. Cabecera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Gestor de Metas Presupuestales — Dirección Financiera
            </h2>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">Año {year}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configuración de cuotas de facturación anual y distribución de metas de propuestas por asesor
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleEqualDistribution}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Dividir en partes iguales entre los ejecutivos activos"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
            <span>Reparto Equitativo</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={updateTargetsMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
          >
            {updateTargetsMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Guardar Metas</span>
          </button>
        </div>
      </div>

      {/* 2. Control Global de Meta del Centro */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Meta Anual del Centro ($ COP)</label>
            <input
              type="number"
              value={centerCop}
              onChange={(e) => setCenterCop(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Meta Anual del Centro COP"
            />
            <span className="block text-[11px] text-muted-foreground mt-1">
              Base mensual: {formatCompactCop(Math.round(centerCop / 12))} / mes
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Propuestas Aprobadas Meta (#)</label>
            <input
              type="number"
              value={centerProposals}
              onChange={(e) => setCenterProposals(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Propuestas Aprobadas Meta"
            />
            <span className="block text-[11px] text-muted-foreground mt-1">
              Base mensual: {Math.round((centerProposals / 12) * 10) / 10} propuestas / mes
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
              <span className="font-mono">{formatCompactCop(totalAssignedCop)}</span>
            </div>
            {!isBalanced && (
              <span className="block text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                {diffCop > 0
                  ? `Faltan ${formatCompactCop(diffCop)} por asignar a los KAMs`
                  : `Supera la meta global por ${formatCompactCop(Math.abs(diffCop))}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Grilla Editable por Asesor */}
      <div>
        <h3 className="font-display text-sm font-bold text-foreground mb-3">
          Distribución de Cuota Presupuestal por Asesor (KAM)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
              <tr>
                <th className="py-2.5 px-3">Ejecutivo Comercial</th>
                <th className="py-2.5 px-3 text-right">Meta Presupuestal ($ COP)</th>
                <th className="py-2.5 px-3 text-center">Propuestas Meta (#)</th>
                <th className="py-2.5 px-3 text-right">Participación en la Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {kamRows.map((kam) => {
                const shareOfBudgetPct = centerCop > 0 ? Math.round((kam.targetCop / centerCop) * 1000) / 10 : 0;

                return (
                  <tr key={kam.kamId} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-foreground">{kam.kamName}</p>
                      <p className="text-[11px] text-muted-foreground">{kam.kamEmail}</p>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        value={kam.targetCop}
                        onChange={(e) => handleKamTargetChange(kam.kamId, "targetCop", Number(e.target.value) || 0)}
                        className="w-36 rounded-md border border-border bg-background px-2.5 py-1 text-right font-mono text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        aria-label={`Meta para ${kam.kamName}`}
                      />
                    </td>

                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        value={kam.targetProposals}
                        onChange={(e) =>
                          handleKamTargetChange(kam.kamId, "targetProposals", Number(e.target.value) || 0)
                        }
                        className="w-20 rounded-md border border-border bg-background px-2.5 py-1 text-center font-mono text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        aria-label={`Propuestas meta para ${kam.kamName}`}
                      />
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-foreground">
                      <span className="font-mono">{shareOfBudgetPct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-border bg-muted/20 font-bold text-foreground">
              <tr>
                <td className="py-2.5 px-3">Suma Asignada a KAMs</td>
                <td className="py-2.5 px-3 text-right font-mono text-primary">{formatCompactCop(totalAssignedCop)}</td>
                <td className="py-2.5 px-3 text-center font-mono">{totalAssignedProposals} propuestas</td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {centerCop > 0 ? Math.round((totalAssignedCop / centerCop) * 1000) / 10 : 0}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
