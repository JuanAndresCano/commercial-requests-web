"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { AdminAuditTable } from "@/components/dashboard/AdminAuditTable";
import { useRequests } from "@/hooks/use-requests";
import { FileSpreadsheet, AlertTriangle, Clock, CheckCircle2, RefreshCw, AlertCircle } from "@/components/icons";
import { formatCompactCop } from "@/lib/mock-data";

export default function AdminSolicitudesView() {
  const { data: proposals = [], isLoading, isError, refetch } = useRequests();

  // Top Audit KPIs
  const summaryKpis = useMemo(() => {
    let totalActive = 0;
    let totalDelivered = 0;
    let totalRiskSla = 0;
    let totalVolumeCop = 0;

    for (const p of proposals) {
      const code = p.workflow?.statusCode ?? "NEW";
      const daysElapsed = Math.max(
        0,
        Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      );
      const hasProfessor = Boolean(
        p.assignments && p.assignments.some((a) => a.role === "PROFESSOR" || Boolean(a.professor)),
      );
      const isPendingProfessorAlert = (code === "NEW" || code === "IN_PROGRESS") && !hasProfessor && daysElapsed >= 5;
      const isBottleneckAlert =
        code !== "DELIVERED" && code !== "REJECTED" && code !== "CANCELLED" && daysElapsed >= 20;

      if (code === "DELIVERED") {
        totalDelivered++;
      } else if (code !== "REJECTED" && code !== "CANCELLED") {
        totalActive++;
      }

      if (isPendingProfessorAlert || isBottleneckAlert) {
        totalRiskSla++;
      }

      const amt = p.deliveredValueCop
        ? Number(p.deliveredValueCop)
        : p.economics && p.economics[0]?.grossValue
          ? Number(p.economics[0].grossValue)
          : 0;
      totalVolumeCop += amt;
    }

    return {
      total: proposals.length,
      active: totalActive,
      delivered: totalDelivered,
      riskSla: totalRiskSla,
      volumeCop: totalVolumeCop,
    };
  }, [proposals]);

  return (
    <AppShell>
      <div data-testid="admin-solicitudes-view" className="space-y-6">
        {/* Cabecera del Submódulo */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Gestión y Auditoría Global de Solicitudes
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Visor tabular maestro para auditar el expediente completo, supervisar cuellos de botella y exportar
              informes directivos de Rectoría
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted transition-colors cursor-pointer"
              title="Refrescar listado maestro de propuestas"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* 4 TARJETAS KPI DE RESUMEN DE AUDITORÍA */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1: Total Radicadas */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Radicadas</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-icesi-blue/10 text-icesi-blue">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-foreground">
                {isLoading ? "..." : summaryKpis.total}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{formatCompactCop(summaryKpis.volumeCop)}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Propuestas registradas en el repositorio institucional
            </p>
          </div>

          {/* KPI 2: En Tubería Activa */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                En Tubería Activa
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-sky-600 dark:text-sky-400">
                {isLoading ? "..." : summaryKpis.active}
              </span>
              <span className="text-xs text-muted-foreground">en diseño o costeo</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Iniciativas en curso antes de entrega formal al cliente
            </p>
          </div>

          {/* KPI 3: Entregadas / Cerradas */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Entregadas al Cliente
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {isLoading ? "..." : summaryKpis.delivered}
              </span>
              <span className="text-xs text-muted-foreground">con número oficial</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Ofertas radicadas y presentadas formalmente</p>
          </div>

          {/* KPI 4: Alertas SLA y Cuellos */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">En Riesgo SLA</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-amber-600 dark:text-amber-400">
                {isLoading ? "..." : summaryKpis.riskSla}
              </span>
              <span className="text-xs text-muted-foreground">solicitudes</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Con más de 20 días en curso o sin docente asignado</p>
          </div>
        </div>

        {/* ESTADO DE ERROR */}
        {isError && (
          <div
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
            data-testid="audit-error-state"
          >
            <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
            <h3 className="font-bold text-foreground text-sm">Error al cargar solicitudes de auditoría</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              No fue posible recuperar el inventario global de propuestas comerciales. Por favor verifica tu conexión o
              intenta nuevamente.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-icesi-blue px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-icesi-blue/90 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {/* TABLA MAESTRA INTERACTIVA */}
        {!isError && <AdminAuditTable proposals={proposals} isLoading={isLoading} />}
      </div>
    </AppShell>
  );
}
