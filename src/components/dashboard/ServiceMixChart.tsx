import React from "react";
import type { ServiceMixEntry } from "@/lib/api/requests";
import { formatCompactCop } from "@/lib/currency";
import { PieChart, Briefcase } from "@/components/icons";

interface ServiceMixChartProps {
  serviceMix: ServiceMixEntry[];
  totalCenterWonCop: number;
}

/**
 * 6 Official Service Formats defined in the academic extension model.
 * Color palette optimized for color vision deficiency (deuteranopia / protanopia):
 * Capacitación (Deep Blue) vs Mentoría (Warm Coral / Rose) provides maximum perceptual contrast.
 */
const OFFICIAL_CATEGORIES: Array<{
  category: string;
  label: string;
  colors: { bg: string; text: string; bar: string; ring: string };
}> = [
  {
    category: "CAPACITACION",
    label: "Capacitación",
    colors: {
      bg: "bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-300",
      bar: "bg-blue-600",
      ring: "border-blue-600",
    },
  },
  {
    category: "CONSULTORIA",
    label: "Consultoría",
    colors: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-300",
      bar: "bg-emerald-600",
      ring: "border-emerald-600",
    },
  },
  {
    category: "MENTORIA",
    label: "Mentoría",
    colors: {
      bg: "bg-rose-500/10",
      text: "text-rose-700 dark:text-rose-300",
      bar: "bg-rose-500",
      ring: "border-rose-500",
    },
  },
  {
    category: "SPECIAL_PROJECTS",
    label: "Proyectos Especiales",
    colors: {
      bg: "bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-300",
      bar: "bg-amber-500",
      ring: "border-amber-500",
    },
  },
  {
    category: "INVESTIGACION",
    label: "Investigación Aplicada",
    colors: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-700 dark:text-cyan-300",
      bar: "bg-cyan-600",
      ring: "border-cyan-600",
    },
  },
  {
    category: "OTHER",
    label: "Otro Servicio",
    colors: {
      bg: "bg-slate-500/10",
      text: "text-slate-700 dark:text-slate-300",
      bar: "bg-slate-500",
      ring: "border-slate-500",
    },
  },
];

export function ServiceMixChart({ serviceMix, totalCenterWonCop }: ServiceMixChartProps) {
  // Map existing backend data by category key
  const mixMap = new Map<string, ServiceMixEntry>();
  for (const item of serviceMix) {
    mixMap.set(item.category, item);
  }

  // Ensure all 6 categories are always present even if proposalsCount is 0 in the period
  const allCategoriesData = OFFICIAL_CATEGORIES.map((cfg) => {
    const existing = mixMap.get(cfg.category);
    return {
      category: cfg.category,
      label: cfg.label,
      proposalsCount: existing?.proposalsCount ?? 0,
      quotedCop: existing?.quotedCop ?? 0,
      wonCop: existing?.wonCop ?? 0,
      wonCount: existing?.wonCount ?? 0,
      shareOfWonPercentage:
        existing?.shareOfWonPercentage ??
        (totalCenterWonCop > 0 && existing?.wonCop ? Math.round((existing.wonCop / totalCenterWonCop) * 1000) / 10 : 0),
      colors: cfg.colors,
    };
  });

  const totalProposals = allCategoriesData.reduce((acc, s) => acc + s.proposalsCount, 0);

  return (
    <div
      data-testid="service-mix-chart"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs overflow-hidden"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-icesi-blue" />
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              Mix de Portafolio por Formato de Servicio
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Distribución del recaudo y volumen de propuestas entre los 6 formatos institucionales de la Dirección de
            Extensión
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
              {allCategoriesData.map((item) => {
                const share = item.shareOfWonPercentage;
                if (share <= 0) return null;

                return (
                  <div
                    key={item.category}
                    className={`h-full rounded-sm ${item.colors.bar} transition-all duration-300`}
                    style={{ width: `${Math.max(2, share)}%` }}
                    title={`${item.label}: ${share}% (${formatCompactCop(item.wonCop)})`}
                  />
                );
              })}
            </div>
          </div>

          {/* Tarjetas de Desglose para los 6 Formatos de Servicio (3 arriba y 3 abajo) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCategoriesData.map((item) => {
              const share = item.shareOfWonPercentage;
              const winRate = item.quotedCop > 0 ? Math.round((item.wonCop / item.quotedCop) * 1000) / 10 : 0;
              const hasActivity = item.proposalsCount > 0;

              return (
                <div
                  key={item.category}
                  className={`rounded-xl border p-4 transition-all ${
                    hasActivity
                      ? "border-border/80 bg-muted/20 hover:bg-muted/40 hover:border-border"
                      : "border-dashed border-border/60 bg-muted/5 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        hasActivity ? `${item.colors.bg} ${item.colors.text}` : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Briefcase className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{item.label}</span>
                    </span>
                    <span className="text-xs font-bold text-foreground">{share}%</span>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground">Facturado Real</p>
                    <p className="font-display text-base font-bold text-foreground">{formatCompactCop(item.wonCop)}</p>
                  </div>

                  {/* Barra individual */}
                  <div className="my-2.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${item.colors.bar} rounded-full`}
                      style={{ width: `${Math.min(100, share)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[10px]">
                    <div>
                      <span className="text-muted-foreground block">Propuestas</span>
                      <span className="font-bold text-foreground">
                        {item.proposalsCount}{" "}
                        {hasActivity && totalProposals > 0 && (
                          <span className="text-[9px] text-muted-foreground font-normal">
                            ({Math.round((item.proposalsCount / totalProposals) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Win Rate</span>
                      <span
                        className={`font-bold ${
                          winRate >= 30 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        }`}
                      >
                        {hasActivity ? `${winRate}%` : "—"}
                      </span>
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
