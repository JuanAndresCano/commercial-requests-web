"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Company360View } from "@/components/dashboard/Company360View";
import { CompanyDirectoryRankingTable } from "@/components/dashboard/CompanyDirectoryRankingTable";
import { Building2, Layers, Award, TrendingUp } from "@/components/icons";
import { useAdminCompanies } from "@/hooks/use-admin-company-360";
import { formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function AdminEmpresasView() {
  const { data: companies = [] } = useAdminCompanies();
  const [activeTab, setActiveTab] = useState<"directorio" | "ficha360">("directorio");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Compute top performers and high-level KPIs dynamically
  const topCompany = [...companies].sort(
    (a, b) => (b.wonTotalCop ?? b.deliveredTotalCop) - (a.wonTotalCop ?? a.deliveredTotalCop),
  )[0];

  const totalWonAllCompanies = companies.reduce((acc, c) => acc + (c.wonTotalCop ?? c.deliveredTotalCop), 0);
  const totalPipelineAllCompanies = companies.reduce((acc, c) => acc + c.pipelineTotalCop, 0);

  const topCompanyWon = topCompany?.wonTotalCop ?? topCompany?.deliveredTotalCop ?? 0;
  const topCompanyShare = totalWonAllCompanies > 0 ? Math.round((topCompanyWon / totalWonAllCompanies) * 1000) / 10 : 0;

  // Recurrent client rate (companies with >= 2 proposals)
  const recurrentClientsCount = companies.filter((c) => c.totalProposals >= 2).length;
  const retentionRate = companies.length > 0 ? Math.round((recurrentClientsCount / companies.length) * 1000) / 10 : 0;

  const handleSelectCompanyFromDirectory = (id: string) => {
    setSelectedCompanyId(id);
    setActiveTab("ficha360");
  };

  return (
    <AppShell>
      <div data-testid="admin-empresas-view" className="space-y-6">
        {/* Cabecera del Submódulo */}
        <div className="flex flex-col gap-2 border-b border-border/60 pb-4">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Inteligencia 360° de Empresas Aliadas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Directorio maestro de cuentas corporativas, historial de intervenciones, valor acumulado generado y
            penetración de facultades
          </p>
        </div>

        {/* Tarjetas Resumen de Cartera Empresarial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tarjeta 1: Top Cliente Histórico */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Award className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Top Cliente en Facturación</p>
              <p className="font-display text-base sm:text-lg font-bold text-foreground truncate">
                {topCompany?.name || "Sin datos"}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                {formatCompactCop(topCompanyWon)} ({topCompanyShare}% de la cartera)
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Cuentas Activas & Tubería */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-icesi-blue/10 text-icesi-blue">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Total Cuentas Vinculadas</p>
              <p className="font-display text-base sm:text-lg font-bold text-foreground">{companies.length} empresas</p>
              <span className="text-[11px] text-muted-foreground font-bold">
                {formatCompactCop(totalPipelineAllCompanies)} en tubería activa
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Tasa de Recurrencia / Fidelización */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Tasa de Fidelización</p>
              <p className="font-display text-base sm:text-lg font-bold text-foreground">{retentionRate}%</p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                {recurrentClientsCount} clientes recurrentes (≥ 2 proyectos)
              </span>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación del Submódulo */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("directorio")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "directorio"
                ? "border-icesi-blue text-icesi-blue"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Building2 className="h-4 w-4" />
            <span>Directorio y Ranking Maestro ({companies.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ficha360")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "ficha360"
                ? "border-icesi-blue text-icesi-blue"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="h-4 w-4" />
            <span>Ficha de Inteligencia 360°</span>
          </button>
        </div>

        {/* Contenido según pestaña activa */}
        {activeTab === "directorio" ? (
          <CompanyDirectoryRankingTable companies={companies} onSelectCompany={handleSelectCompanyFromDirectory} />
        ) : (
          <Company360View
            initialCompanyId={selectedCompanyId ?? undefined}
            onBackToDirectory={() => setActiveTab("directorio")}
          />
        )}
      </div>
    </AppShell>
  );
}
