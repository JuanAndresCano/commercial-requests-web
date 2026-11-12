import { cn } from "@/lib/utils";
import { segmentTheme, type SegmentMarkerShape } from "./segment-theme";

const SHAPES: Record<SegmentMarkerShape, React.ReactNode> = {
  circle: <circle cx="6" cy="6" r="5" />,
  square: <rect x="1" y="1" width="10" height="10" rx="1.5" />,
  triangle: <polygon points="6,0.8 11.4,11 0.6,11" />,
  diamond: <polygon points="6,0.4 11.6,6 6,11.6 0.4,6" />,
};

interface SegmentMarkerProps {
  strategy: string;
  className?: string;
}

/** The shape is part of the segment's identity, so it is still told apart without colour. */
export function SegmentMarker({ strategy, className }: SegmentMarkerProps) {
  const theme = segmentTheme(strategy);
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={cn("h-3 w-3 shrink-0", theme.fill, className)}>
      {SHAPES[theme.marker]}
    </svg>
  );
}

interface SegmentChipProps {
  strategy: string;
  /** Tentative label, shown after the strategy when given. */
  label?: string;
  className?: string;
}

/** Marker + strategy (+ label): the way a segment is always named in the interface. */
export function SegmentChip({ strategy, label, className }: SegmentChipProps) {
  const theme = segmentTheme(strategy);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-bold",
        theme.border,
        theme.soft,
        theme.text,
        className,
      )}
    >
      <SegmentMarker strategy={strategy} />
      <span className="truncate">{strategy}</span>
      {label && <span className="hidden truncate font-semibold opacity-80 sm:inline">· {label}</span>}
    </span>
  );
}
