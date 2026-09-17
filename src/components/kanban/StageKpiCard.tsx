import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STAGE_THEME } from "@/lib/kanban-theme";
import type { RequestStatus } from "@/lib/mock-data";

interface StageKpiCardProps {
  stage: RequestStatus;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  hint: string;
  activeHint?: string;
  /** Reemplaza la línea de hint por defecto (ej. el valor real aprobado en COP). */
  secondaryLine?: ReactNode;
  className?: string;
}

export function StageKpiCard({
  stage,
  label,
  count,
  active,
  onClick,
  hint,
  activeHint = "✓ Filtrando esta columna",
  secondaryLine,
  className,
}: StageKpiCardProps) {
  const theme = STAGE_THEME[stage];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col justify-between rounded-xl border p-4 text-left shadow-xs transition-all cursor-pointer",
        active ? theme.activeCardClass : theme.inactiveHoverClass,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2.5">
        <p
          className="font-display text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: theme.colorHex }}
        >
          {count}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {secondaryLine ?? (active ? activeHint : hint)}
        </p>
      </div>
      <div
        className="mt-2.5 h-1 w-full rounded-full"
        style={{ backgroundColor: theme.colorHex }}
      />
    </button>
  );
}
