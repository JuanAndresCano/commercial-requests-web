import { cn } from "@/lib/utils";
import { STATUS_META, URGENCY_META, type Urgency } from "@/lib/mock-data";
import type { BoardStage } from "@/lib/board-stages";

// "Enviada al KAM" is derived on the client (see leaderStageOf), so it has no STATUS_META entry.
const SENT_TO_KAM_META = {
  label: "Enviada al KAM",
  tone: "bg-[#2b9eb3]/15 text-[#1f7f91] dark:text-[#2b9eb3] border-[#2b9eb3]/30",
  dot: "bg-[#2b9eb3]",
};

export function StatusBadge({ status, className }: { status: BoardStage; className?: string }) {
  const m = status === "enviada-kam" ? SENT_TO_KAM_META : STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
        m.tone,
        className,
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
      className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium", m.tone, className)}
    >
      {m.label}
    </span>
  );
}
