import React from "react";
import type { ServiceMixEntry } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/mock-data";
import { PieChart, Briefcase } from "@/components/icons";

interface ServiceMixChartProps {
  serviceMix: ServiceMixEntry[];
  totalCenterWonCop: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string; ring: string }> = {
  CAPACITACION: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    bar: "bg-blue-500",
    ring: "border-blue-500",
  },
  CONSULTORIA: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    ring: "border-emerald-500",
  },
  MENTORIA: {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    bar: "bg-purple-500",
    ring: "border-purple-500",
  },
  SPECIAL_PROJECTS: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    ring: "border-amber-500",
  },
  INVESTIGACION: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    bar: "bg-cyan-500",
    ring: "border-cyan-500",
  },
  OTHER: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-600 dark:text-zinc-400",
    bar: "bg-zinc-500",
    ring: "border-zinc-500",
  },
};

export function ServiceMixChart({ serviceMix, totalCenterWonCop }: ServiceMixChartProps) {
  const totalProposals = serviceMix.reduce((acc, s) => acc + s.proposalsCount, 0);

  return (
    <div
      data-testid="service-mix-chart"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs overflow-hidden"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-500" />
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Mix de Portafolio por Formato de Servicio
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Distribución del recaudo y volumen de propuestas entre Capacitación, Consultoría, Mentoría y Proyectos
            Especiales
          </p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{serviceMix.length} categorías de servicio</span>
      </div>

      {serviceMix.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No hay datos de formatos de servicio en el período seleccionado.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Barra proporcional apilada institucional */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Distribución Proporcional de la Facturación Real</span>
              <span>100% Portafolio</span>
            </div>
            <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-muted/60 p-0.5 gap-0.5">
              {serviceMix.map((item) => {
                const color = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.OTHER;
                const share =
                  item.shareOfWonPercentage > 0
                    ? item.shareOfWonPercentage
                    : totalCenterWonCop > 0
                      ? Math.round((item.wonCop / totalCenterWonCop) * 1000) / 10
                      : 0;

                if (share <= 0) return null;

                return (
                  <div
                    key={item.category}
                    className={`h-full rounded-sm ${color.bar} transition-all duration-300`}
                    style={{ width: `${Math.max(2, share)}%` }}
                    title={`${item.label}: ${share}% (${formatCompactCop(item.wonCop)})`}
                  />
                );
              })}
            </div>
          </div>

          {/* Tarjetas de Desglose por Formato de Servicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceMix.map((item) => {
              const color = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.OTHER;
              const share =
                item.shareOfWonPercentage > 0
                  ? item.shareOfWonPercentage
                  : totalCenterWonCop > 0
                    ? Math.round((item.wonCop / totalCenterWonCop) * 1000) / 10
                    : 0;
              const winRate = item.quotedCop > 0 ? Math.round((item.wonCop / item.quotedCop) * 1000) / 10 : 0;

              return (
                <div
                  key={item.category}
                  className="rounded-xl border border-border/80 bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:border-border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${color.bg} ${color.text}`}
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      {item.label}
                    </span>
                    <span className="text-xs font-bold text-foreground">{share}%</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground">Facturado Real</p>
                    <p className="font-display text-lg font-bold text-foreground">{formatCompactCop(item.wonCop)}</p>
                  </div>

                  {/* Barra individual */}
                  <div className="my-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${color.bar} rounded-full`} style={{ width: `${Math.min(100, share)}%` }} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block">Propuestas</span>
                      <span className="font-bold text-foreground">
                        {item.proposalsCount}{" "}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({totalProposals > 0 ? Math.round((item.proposalsCount / totalProposals) * 100) : 0}%)
                        </span>
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Win Rate</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{winRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
