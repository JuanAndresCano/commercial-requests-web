"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RoleBadge } from "@/components/RoleBadge";
import { Users, Calendar, Target, Award, ArrowUpRight } from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  return (
    <AppShell>
      <div data-testid="admin-kams-view" className="space-y-6">
        {/* Cabecera del Submódulo */}
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

          {/* Selector Temporal */}
          <div className="flex flex-wrap items-center gap-3">
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

        {/* Placeholder / Estructura base para Fase 4 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">KAM Líder en Ventas</p>
              <p className="font-display text-lg font-bold text-foreground">Ana Pérez</p>
              <span className="text-[11px] text-emerald-600 font-bold">$1.134M COP cerrados</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-icesi-green/10 text-icesi-green">
              <ArrowUpRight className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Mayor Efectividad (Win Rate)</p>
              <p className="font-display text-lg font-bold text-foreground">Carlos Gómez</p>
              <span className="text-[11px] text-emerald-600 font-bold">18.4% de conversión</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-icesi-purple/10 text-icesi-purple">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Meta Global del Centro</p>
              <p className="font-display text-lg font-bold text-foreground">$2.516M COP</p>
              <span className="text-[11px] text-muted-foreground">96.2% de cumplimiento anual</span>
            </div>
          </div>
        </div>

        {/* Contenedor de Módulo en Construcción (Fase 4) */}
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
          <h3 className="font-display text-base font-bold text-foreground">Módulo de Rendimiento y Metas de Venta</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-lg mx-auto">
            La tabla consolidada de 8 indicadores por asesor, el gráfico comparativo Vendido vs. Meta y el Gestor ágil
            de cuotas de Lina se conectarán en la Fase 4.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
