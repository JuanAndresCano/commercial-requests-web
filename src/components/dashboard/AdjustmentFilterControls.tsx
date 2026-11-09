import { AlertCircle } from "@/components/icons";
import {
  ADJUSTMENT_FILTER_LABELS,
  ADJUSTMENT_THEME,
  isAdjustmentFilter,
  type AdjustmentFilter,
} from "@/lib/adjustments";
import { cn } from "@/lib/utils";

interface AdjustmentFilterSelectProps {
  value: AdjustmentFilter;
  onChange: (value: AdjustmentFilter) => void;
  /** Distinct per board so two filters on one page never share the label's `for`. */
  id?: string;
}

/** Same look as the "Seguimiento comercial" filter: label, colour dot, native select and a clear link. */
export function AdjustmentFilterSelect({ value, onChange, id = "adjustment-filter" }: AdjustmentFilterSelectProps) {
  return (
    <>
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        Sustentación y ajustes
      </label>
      <span
        aria-hidden="true"
        data-slot="adjustment-filter-dot"
        className={cn("h-2 w-2 shrink-0 rounded-full", value ? ADJUSTMENT_THEME[value].dot : "bg-transparent")}
      />
      <select
        id={id}
        aria-label="Filtrar por sustentación y ajustes"
        value={value}
        onChange={(event) => onChange(isAdjustmentFilter(event.target.value) ? event.target.value : "")}
        className="min-w-0 max-w-full rounded-md border border-input bg-background px-2 py-2 text-xs text-foreground"
      >
        {(Object.keys(ADJUSTMENT_FILTER_LABELS) as AdjustmentFilter[]).map((option) => (
          <option key={option} value={option}>
            {ADJUSTMENT_FILTER_LABELS[option]}
          </option>
        ))}
      </select>
      {value && (
        <button type="button" className="text-xs underline text-muted-foreground" onClick={() => onChange("")}>
          Quitar ajustes
        </button>
      )}
    </>
  );
}

interface PendingAdjustmentsCounterProps {
  /** Pending proposals of the whole role set, ignoring this filter. */
  count: number;
  filter: AdjustmentFilter;
  onChange: (value: AdjustmentFilter) => void;
}

/** Header shortcut: one click shows only the pending ones, another click brings everything back. */
export function PendingAdjustmentsCounter({ count, filter, onChange }: PendingAdjustmentsCounterProps) {
  const pressed = filter === "pending";
  return (
    <button
      type="button"
      aria-pressed={pressed}
      // Stays usable while pressed so the filter can always be lifted from here.
      disabled={count === 0 && !pressed}
      onClick={() => onChange(pressed ? "" : "pending")}
      title="Mostrar solo las propuestas devueltas por el cliente que aún no se vuelven a presentar"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        "border-amber-300/60 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 dark:hover:bg-amber-950/40",
        pressed &&
          "border-amber-600/70 bg-amber-100 ring-1 ring-amber-600/40 dark:border-amber-400/60 dark:bg-amber-950/50",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-amber-50 dark:disabled:hover:bg-amber-950/20",
      )}
    >
      <AlertCircle className="h-3.5 w-3.5" />
      <span>{count} en sustentación y ajustes</span>
    </button>
  );
}
