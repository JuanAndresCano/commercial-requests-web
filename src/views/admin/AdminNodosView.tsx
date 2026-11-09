"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RoleBadge } from "@/components/RoleBadge";
import { Network, Calendar, Layers, Clock } from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { AcademicNodeRankingTable } from "@/components/dashboard/AcademicNodeRankingTable";
import { ProductLeadersTable } from "@/components/dashboard/ProductLeadersTable";
import { ServiceMixChart } from "@/components/dashboard/ServiceMixChart";
import { formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const QUARTERS = [
  { label: "Todo el año", value: undefined },
  { label: "Q1 (Ene - Mar)", value: 1 },
  { label: "Q2 (Abr - Jun)", value: 2 },
  { label: "Q3 (Jul - Sep)", value: 3 },
  { label: "Q4 (Oct - Dic)", value: 4 },
] as const;

export default function AdminNodosView() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"nodos" | "lideres">("nodos");

  const { data: dashboardData, isLoading: isDashboardLoading } = useAdminDashboard({
    year: selectedYear,
    quarter: selectedQuarter,
  });

  if (isDashboardLoading && !dashboardData) {
    return (
      <AppShell>
        <div data-testid="admin-nodos-view" className="space-y-6 animate-pulse">
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

  const nodeDistribution = dashboardData?.nodeDistribution || [];
  const productLeaders = dashboardData?.productLeaders || [];
  const serviceMix = dashboardData?.serviceMix || [];
  const macroKpis = dashboardData?.macroKpis;
  const totalCenterWonCop = macroKpis?.wonTotalCop ?? macroKpis?.deliveredTotalCop ?? 0;

  // Compute top performers dynamically
  const topSalesNode = [...nodeDistribution].sort(
    (a, b) => (b.wonTotalCop ?? b.deliveredTotalCop) - (a.wonTotalCop ?? a.deliveredTotalCop),
  )[0];

  const topProductLeader = [...productLeaders].sort(
    (a, b) => b.wonTotalCop - a.wonTotalCop || b.totalAssigned - a.totalAssigned,
  )[0];

  const avgTechnicalDays =
    nodeDistribution.length > 0
      ? Math.round(
          (nodeDistribution.reduce((acc, n) => acc + (n.avgTechnicalDesignDays ?? 7), 0) / nodeDistribution.length) *
            10,
        ) / 10
      : 7;

  const topNodeWonCop = topSalesNode?.wonTotalCop ?? topSalesNode?.deliveredTotalCop ?? 0;
  const topNodeShare = totalCenterWonCop > 0 ? Math.round((topNodeWonCop / totalCenterWonCop) * 1000) / 10 : 0;

  return (
    <AppShell>
      <div data-testid="admin-nodos-view" className="space-y-6">
        {/* Cabecera del Submódulo y Selector Temporal */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Nodos Temáticos & Portafolio Académico
              </h1>
              <RoleBadge label="Administrador Icesi" />
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Desempeño de los 7 centros de conocimiento, productividad de Líderes de Producto y tiempos de respuesta de
              la fábrica académica
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

            {/* Selector de Trimestre */}
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

        {/* Tarjetas Resumen de Nodos y Fábrica Académica */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tarjeta 1: Nodo con Mayor Recaudo */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-icesi-blue/10 text-icesi-blue">
              <Network className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Nodo con Mayor Recaudo</p>
              <p className="font-display text-base sm:text-lg font-bold text-foreground truncate">
                {topSalesNode?.name || "Sin datos"}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                {formatCompactCop(topNodeWonCop)} COP ({topNodeShare}% del centro)
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Líder de Producto Destacado */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Layers className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Líder de Producto Destacado</p>
              <p className="font-display text-base sm:text-lg font-bold text-foreground truncate">
                {topProductLeader?.name || "Sin datos"}
              </p>
              <span className="text-[11px] text-muted-foreground font-bold">
                {topProductLeader?.totalAssigned ?? 0} propuestas estructuradas (
                {formatCompactCop(topProductLeader?.wonTotalCop ?? 0)})
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Tiempo Promedio de Respuesta */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Tiempo Promedio en Fábrica</p>
              <p className="font-display text-base sm:text-lg font-bold text-foreground">{avgTechnicalDays} días</p>
              <span
                className={cn(
                  "text-[11px] font-bold",
                  avgTechnicalDays <= 7
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                )}
              >
                {avgTechnicalDays <= 7 ? "Dentro del benchmark operativo" : "Oportunidad de agilización"}
              </span>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación del Submódulo */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("nodos")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "nodos"
                ? "border-icesi-blue text-icesi-blue"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Network className="h-4 w-4" />
            <span>Nodos Temáticos & Mix de Servicios</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lideres")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "lideres"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="h-4 w-4" />
            <span>Líderes de Producto ({productLeaders.length})</span>
          </button>
        </div>

        {/* Contenido según pestaña activa */}
        {activeTab === "nodos" ? (
          <div className="space-y-6">
            <AcademicNodeRankingTable nodeDistribution={nodeDistribution} totalCenterWonCop={totalCenterWonCop} />

            <ServiceMixChart serviceMix={serviceMix} totalCenterWonCop={totalCenterWonCop} />
          </div>
        ) : (
          <div className="space-y-6">
            <ProductLeadersTable productLeaders={productLeaders} totalCenterWonCop={totalCenterWonCop} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
