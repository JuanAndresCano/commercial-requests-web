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
  /**
   * Hace clicable el encabezado (mismo efecto que la tarjeta KPI de la etapa:
   * aislar o volver a ver todas). Es opcional: sin él el encabezado queda
   * como texto plano, igual que antes (tablero del Líder de Producto).
   */
  onHeaderClick?: () => void;
}

export function KanbanColumn<T>({
  stage,
  title,
  description,
  items,
  renderItem,
  getKey,
  emptyLabel = "Sin solicitudes en esta fase",
  className,
  columnRef,
  isolated,
  onExitIsolation,
  onHeaderClick,
}: KanbanColumnProps<T>) {
  const theme = STAGE_THEME[stage];

  const headerContent = (
    <>
      <span
        className={cn("h-2.5 w-2.5 rounded-full shrink-0", theme.pulse && "animate-pulse")}
        style={{ backgroundColor: theme.colorHex }}
      />
      <h3 className="font-bold text-sm text-foreground font-sans truncate">{title}</h3>
      <span
        className="rounded-full px-2 py-0.5 text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: theme.colorHex }}
      >
        {items.length}
      </span>
    </>
  );

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
          {onHeaderClick ? (
            <button
              type="button"
              onClick={onHeaderClick}
              aria-pressed={!!isolated}
              title={isolated ? "Volver a ver las 4 fases" : "Ver solo esta fase"}
              className="flex items-center gap-2 min-w-0 rounded-md text-left -m-1 p-1 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-icesi-blue transition-colors"
            >
              {headerContent}
            </button>
          ) : (
            <div className="flex items-center gap-2 min-w-0">{headerContent}</div>
          )}
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
