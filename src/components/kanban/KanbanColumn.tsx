import { Fragment, type ReactNode } from "react";
import { X } from "@/components/icons";
import { cn } from "@/lib/utils";
import { STAGE_THEME } from "@/lib/kanban-theme";
import type { RequestStatus } from "@/lib/mock-data";

interface KanbanColumnProps<T> {
  stage: RequestStatus;
  title: string;
  description?: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
  /**
   * Número mostrado en la insignia de la cabecera. Por defecto es
   * `items.length`, pero algunos tableros necesitan mostrar un conteo
   * distinto al número de tarjetas visibles (ej. el KAM: la columna
   * "en-costeo" siempre muestra todas las tarjetas en esa etapa, pero la
   * insignia debe reflejar solo las que de verdad están listas para
   * entregar — mostrar `items.length` ahí decía "3" mientras la tarjeta KPI
   * de arriba, que sí filtra por listas, decía "0").
   */
  count?: number;
  emptyLabel?: string;
  className?: string;
  columnRef?: (el: HTMLDivElement | null) => void;
  /**
   * Cuando es la única columna visible (las otras 3 quedaron ocultas porque el
   * usuario "aisló" esta fase desde la tarjeta KPI), aprovecha el ancho extra
   * mostrando varias tarjetas por fila en vez de una sola columna angosta —
   * y ofrece la forma de volver a ver las 4 fases.
   */
  isolated?: boolean;
  onExitIsolation?: () => void;
}

export function KanbanColumn<T>({
  stage,
  title,
  description,
  items,
  renderItem,
  getKey,
  count,
  emptyLabel = "Sin solicitudes en esta fase",
  className,
  columnRef,
  isolated,
  onExitIsolation,
}: KanbanColumnProps<T>) {
  const theme = STAGE_THEME[stage];

  return (
    <div
      ref={columnRef}
      className={cn(
        "flex flex-col rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#121420] shadow-xs overflow-hidden",
        theme.borderTopClass,
        isolated && "ring-2",
        className,
      )}
      style={isolated ? { boxShadow: `0 0 0 2px ${theme.colorHex}33` } : undefined}
    >
      <div className="p-3.5 border-b border-border dark:border-[#202230] bg-secondary/30 dark:bg-[#161826]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn("h-2.5 w-2.5 rounded-full shrink-0", theme.pulse && "animate-pulse")}
              style={{ backgroundColor: theme.colorHex }}
            />
            <h3 className="font-bold text-sm text-foreground font-sans truncate">{title}</h3>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: theme.colorHex }}
            >
              {count ?? items.length}
            </span>
          </div>
          {isolated && onExitIsolation && (
            <button
              type="button"
              onClick={onExitIsolation}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Volver a ver las 4 fases"
            >
              <X className="h-3 w-3" />
              Ver las 4 fases
            </button>
          )}
        </div>
        {description && <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{description}</p>}
      </div>

      <div
        className={cn(
          "p-3 min-h-[220px]",
          isolated ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" : "space-y-3",
        )}
      >
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border dark:border-[#252838] p-6 text-center text-muted-foreground">
            <p className="text-xs font-medium">{emptyLabel}</p>
          </div>
        ) : (
          items.map((item) => <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>)
        )}
      </div>
    </div>
  );
}
