import { RotateCw } from "@/components/icons";
import {
  adjustmentBadgeLabel,
  adjustmentBadgeTitle,
  getAdjustmentCount,
  getAdjustmentState,
  type AdjustmentSource,
} from "@/lib/adjustments";
import { cn } from "@/lib/utils";

/**
 * Neutral mark for a proposal that was returned with observations and has already been presented
 * again ("↻ 2 ajustes"). Amber stays reserved for the pending notice, so this one is a thin border
 * with muted text. Renders nothing for pending proposals or those that were never returned.
 */
export function ResentAdjustmentBadge({ req, className }: { req: AdjustmentSource; className?: string }) {
  if (getAdjustmentState(req) !== "resent") return null;
  const count = getAdjustmentCount(req);
  return (
    <span
      data-slot="resent-adjustment"
      title={adjustmentBadgeTitle(count)}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium leading-4 text-muted-foreground",
        className,
      )}
    >
      <RotateCw className="h-3 w-3" />
      <span>{adjustmentBadgeLabel(count)}</span>
    </span>
  );
}
