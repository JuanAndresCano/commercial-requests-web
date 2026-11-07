import { cn } from "@/lib/utils";
import { STATUS_META, URGENCY_META, type Urgency } from "@/lib/mock-data";
import type { BoardStage } from "@/lib/board-stages";

// "Enviada al KAM" is derived on the client (see leaderStageOf), so it has no STATUS_META entry.
const SENT_TO_KAM_META = {
  label: "Enviada al KAM",
  tone: "bg-[#2b9eb3]/15 text-[#1f7f91] dark:text-[#2b9eb3] border-[#2b9eb3]/30",
  dot: "bg-[#2b9eb3]",
};

export function StatusBadge({
  status,
  className,
  pendingAdjustment = false,
}: {
  status: BoardStage;
  className?: string;
  /** The client returned the proposal with observations and it was not presented again (see lib/adjustments). */
  pendingAdjustment?: boolean;
}) {
  const m = status === "enviada-kam" ? SENT_TO_KAM_META : STATUS_META[status];
  const isAdjusting = pendingAdjustment && (status === "en-costeo" || status === "enviada-kam");
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium", m.tone)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
        {m.label}
      </span>
      {isAdjusting && (
        <span className="rounded border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          Sustentación y ajustes
        </span>
      )}
    </span>
  );
}

export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  const m = URGENCY_META[urgency];
  return (
    <span
      className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium", m.tone, className)}
    >
      {m.label}
    </span>
  );
}
