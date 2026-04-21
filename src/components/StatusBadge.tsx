import { cn } from "@/lib/utils";
import { STATUS_META, URGENCY_META, type RequestStatus, type Urgency } from "@/lib/mock-data";

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        m.tone,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  const m = URGENCY_META[urgency];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        m.tone,
        className
      )}
    >
      {m.label}
    </span>
  );
}
