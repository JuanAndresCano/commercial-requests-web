import { Clock } from "@/components/icons";
import { cn } from "@/lib/utils";
import { formatStageDays, type StageTimeRow } from "@/lib/stage-time";

interface StageTimeSectionProps {
  /** From `getStageTimes`; `null` when the request has no status history (nothing is shown). */
  rows: StageTimeRow[] | null;
}

/** "Tiempo por etapa": the days accumulated in each stage of the viewer's role, no due dates. */
export function StageTimeSection({ rows }: StageTimeSectionProps) {
  if (!rows) return null;
  return (
    <div className="rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] p-5 shadow-xs space-y-3">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border dark:border-[#252838] pb-3">
        <Clock className="h-3.5 w-3.5" />
        Tiempo por etapa
      </h3>
      <ul className="space-y-2 text-xs">
        {rows.map((row) => (
          <li key={row.stage} className="flex items-center justify-between gap-2">
            <span className={cn("text-muted-foreground", row.current && "font-semibold text-foreground")}>
              {row.label}
            </span>
            <span className={cn("shrink-0 text-foreground", row.days === null && "text-muted-foreground")}>
              {formatStageDays(row.days)}
              {row.current && <span className="text-muted-foreground"> · actual</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
