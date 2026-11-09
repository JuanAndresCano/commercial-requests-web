"use client";

import { AppShell } from "@/components/AppShell";
import { Company360View } from "@/components/dashboard/Company360View";
import { RoleBadge } from "@/components/RoleBadge";

export default function AdminEmpresasView() {
  return (
    <AppShell>
      <div data-testid="admin-empresas-view" className="space-y-6">
        {/* Cabecera del Submódulo */}
        <div className="flex flex-col gap-2 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Inteligencia 360° de Empresas Aliadas
            </h1>
            <RoleBadge label="Administrador Icesi" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Directorio maestro de cuentas corporativas, historial de intervenciones, valor acumulado generado y
            penetración de facultades
          </p>
        </div>

        {/* Vista 360 de Empresa */}
        <Company360View />
      </div>
    </AppShell>
  );
}
