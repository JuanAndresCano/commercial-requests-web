import type { CompanySegment, SegmentProfile } from "@/lib/api/segments";
import { ArrowRight } from "@/components/icons";
import { cn } from "@/lib/utils";
import { formatRate } from "./segment-format";
import { SegmentChip } from "./SegmentMarker";
import { RateVsArea, SegmentStatGrid } from "./SegmentStats";
import { segmentTheme } from "./segment-theme";
import { TruncatedText } from "./TruncatedText";

interface SegmentSummaryCardProps {
  profile: SegmentProfile;
  /** Approval rate of the whole area (0..1). */
  areaRate: number;
  /** The firm companies with the most proposals (at most 3). */
  topCompanies: CompanySegment[];
  /** The table is currently filtered to this segment. */
  selected: boolean;
  /** Another segment is selected. */
  dimmed: boolean;
  /** Filters the table to this segment and scrolls to it. */
  onViewAll: () => void;
}

export function SegmentSummaryCard({
  profile,
  areaRate,
  topCompanies,
  selected,
  dimmed,
  onViewAll,
}: SegmentSummaryCardProps) {
  const theme = segmentTheme(profile.strategy);
  return (
    <article
      data-testid={`summary-card-${profile.segment}`}
      aria-label={`Segmento ${profile.strategy}: ${profile.label}`}
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs transition-all",
        selected ? cn(theme.border, "ring-2", theme.ring) : "border-border",
        dimmed && "opacity-60",
      )}
    >
      <div className="space-y-1.5">
        <SegmentChip strategy={profile.strategy} />
        <p className="font-display text-sm font-bold leading-snug text-foreground">{profile.label}</p>
      </div>

      <SegmentStatGrid profile={profile} />
      <RateVsArea rate={profile.approvalRateMedian} areaRate={areaRate} strategy={profile.strategy} />

      <div className="flex-1 space-y-2">
        <h3 className="text-xs font-bold text-foreground">Empresas firmes principales</h3>
        {topCompanies.length === 0 ? (
          <p className="text-xs text-muted-foreground">Este segmento no tiene empresas firmes.</p>
        ) : (
          <ol className="space-y-1.5">
            {topCompanies.map((c) => (
              <li
                key={c.id}
                data-testid="summary-top-company"
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5",
                  theme.border,
                  theme.soft,
                )}
              >
                <TruncatedText text={c.companyName} className="min-w-0 flex-1 text-xs font-semibold text-foreground" />
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {c.frequency} prop. · {formatRate(c.approvalRateSmoothed)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <button
        type="button"
        onClick={onViewAll}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-icesi-blue"
      >
        Ver las {profile.companyCount} empresas
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}
