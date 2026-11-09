"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RoleBadge } from "@/components/RoleBadge";
import { Users, Calendar, Target, Award, ArrowUpRight } from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { useSalesTargets } from "@/hooks/use-sales-targets";
import { KamDeepTable } from "@/components/dashboard/KamDeepTable";
import { KamTargetVsWonChart } from "@/components/dashboard/KamTargetVsWonChart";
import { SalesTargetsManager } from "@/components/dashboard/SalesTargetsManager";
import { formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const QUARTERS = [
  { label: "Todo el año", value: undefined },
  { label: "Q1 (Ene - Mar)", value: 1 },
  { label: "Q2 (Abr - Jun)", value: 2 },
  { label: "Q3 (Jul - Sep)", value: 3 },
  { label: "Q4 (Oct - Dic)", value: 4 },
] as const;

export default function AdminKamsView() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"desempeno" | "metas">("desempeno");

  const { data: dashboardData, isLoading: isDashboardLoading } = useAdminDashboard({
    year: selectedYear,
    quarter: selectedQuarter,
  });

  const { data: salesTargetsData, isLoading: isTargetsLoading } = useSalesTargets(selectedYear);

  if (isDashboardLoading && !dashboardData) {
    return (
      <AppShell>
        <div data-testid="admin-kams-view" className="space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-muted rounded-md mb-2" />
          <div className="h-4 w-96 bg-muted/60 rounded-md mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-muted/40 rounded-xl" />
            <div className="h-24 bg-muted/40 rounded-xl" />
            <div className="h-24 bg-muted/40 rounded-xl" />
          </div>
          <div className="h-64 bg-muted/30 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const kamRanking = dashboardData?.kamRanking || [];
  const macroKpis = dashboardData?.macroKpis;
  const totalCenterWonCop = macroKpis?.wonTotalCop ?? macroKpis?.deliveredTotalCop ?? 0;

  // Compute top performers dynamically
  const topSalesKam = [...kamRanking].sort(
    (a, b) => (b.wonTotalCop ?? b.deliveredTotalCop) - (a.wonTotalCop ?? a.deliveredTotalCop),
  )[0];

  const topWinRateKam = [...kamRanking].sort((a, b) => (b.winRatePercentage ?? 0) - (a.winRatePercentage ?? 0))[0];

  const centerTargetCop = salesTargetsData?.centerTarget.annualTargetCop || macroKpis?.targetCop || 2516000000;
  const annualCompliancePct = centerTargetCop > 0 ? Math.round((totalCenterWonCop / centerTargetCop) * 1000) / 10 : 0;

  return (
    <AppShell>
      <div data-testid="admin-kams-view" className="space-y-6">
        {/* Cabecera del Submódulo y Selector Temporal */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Rendimiento Comercial & Metas de Venta
              </h1>
              <RoleBadge label="Administrador Icesi" />
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Productividad profunda de Key Account Managers (KAMs), cuotas presupuestales fijadas por Lina y
              efectividad de conversión
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Año */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Año:</span>
              </div>
              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger
                  aria-label="Seleccionar año"
                  className="h-8 w-24 rounded-lg border-border bg-card px-2.5 text-xs font-bold text-foreground shadow-xs focus:ring-1 focus:ring-icesi-blue cursor-pointer"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {[2025, 2026].map((yr) => (
                    <SelectItem key={yr} value={String(yr)} className="text-xs font-semibold cursor-pointer">
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Trimestres */}
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs shadow-xs">
              {QUARTERS.map((q) => {
                const active = selectedQuarter === q.value;
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setSelectedQuarter(q.value)}
                    className={cn(
                      "rounded-md px-3 py-1 font-semibold transition-all cursor-pointer",
                      active
                        ? "bg-card text-foreground shadow-xs border border-border/60"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pestañas de Vista: Análisis de KAMs vs Gestor de Metas */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("desempeno")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              activeTab === "desempeno"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
          >
            <Users className="h-4 w-4" />
            <span>Desempeño de la Fuerza de Ventas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("metas")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              activeTab === "metas"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
          >
            <Target className="h-4 w-4" />
            <span>Gestor de Metas Financieras (Panel de Lina)</span>
          </button>
        </div>

        {activeTab === "desempeno" ? (
          <div className="space-y-6">
            {/* Tarjetas Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tarjeta 1: Líder en Ventas */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Award className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">KAM Líder en Ventas</p>
                  <p className="font-display text-lg font-bold text-foreground truncate">
                    {topSalesKam?.name || "Ana Pérez"}
                  </p>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block truncate">
                    {formatCompactCop(topSalesKam?.wonTotalCop ?? topSalesKam?.deliveredTotalCop ?? 1134000000)}{" "}
                    cerrados
                  </span>
                </div>
              </div>

              {/* Tarjeta 2: Mayor Win Rate */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ArrowUpRight className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">Mayor Efectividad (Win Rate)</p>
                  <p className="font-display text-lg font-bold text-foreground truncate">
                    {topWinRateKam?.name || "Carlos Gómez"}
                  </p>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block truncate">
                    {topWinRateKam?.winRatePercentage ?? 18.4}% de conversión
                  </span>
                </div>
              </div>

              {/* Tarjeta 3: Meta Global del Centro */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-icesi-purple/10 text-icesi-purple shrink-0">
                  <Target className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">Meta Global del Centro</p>
                  <p className="font-display text-lg font-bold text-foreground truncate">
                    {formatCompactCop(centerTargetCop)}
                  </p>
                  <span className="text-[11px] text-muted-foreground font-semibold block truncate">
                    {annualCompliancePct}% de cumplimiento anual
                  </span>
                </div>
              </div>
            </div>

            {/* Gráfico Comparativo: Vendido vs Meta Individual */}
            <KamTargetVsWonChart kamRanking={kamRanking} />

            {/* Tabla Consolidada de 8 Indicadores */}
            <KamDeepTable kamRanking={kamRanking} totalCenterWonCop={totalCenterWonCop} />
          </div>
        ) : (
          <SalesTargetsManager year={selectedYear} initialData={salesTargetsData} isLoading={isTargetsLoading} />
        )}
      </div>
    </AppShell>
  );
}
