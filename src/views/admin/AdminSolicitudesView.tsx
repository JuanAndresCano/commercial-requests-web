"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RoleBadge } from "@/components/RoleBadge";
import { FileSpreadsheet, Search, Filter, Download } from "@/components/icons";

export default function AdminSolicitudesView() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <AppShell>
      <div data-testid="admin-solicitudes-view" className="space-y-6">
        {/* Cabecera del Submódulo */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Gestión y Auditoría Global de Solicitudes
              </h1>
              <RoleBadge label="Administrador Icesi" />
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Visor tabular maestro para auditar, supervisar SLAs de envejecimiento y exportar propuestas de la
              Universidad
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 cursor-pointer self-start sm:self-auto"
            onClick={() => {}}
          >
            <Download className="h-4 w-4" />
            <span>Exportar Informe CSV</span>
          </button>
        </div>

        {/* Barra de Búsqueda y Filtros Rápidos */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border border-border rounded-xl p-3 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por código (REQ-...), empresa o título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filtros avanzados</span>
            </button>
          </div>
        </div>

        {/* Contenedor de Módulo en Construcción (Fase 7) */}
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
          <h3 className="font-display text-base font-bold text-foreground">Visor Tabular de Auditoría Directiva</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-lg mx-auto">
            La tabla paginada de propuestas con alertas de estancamiento de SLAs, buscador instantáneo y exportación a
            Excel / CSV se conectarán en la Fase 7.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
