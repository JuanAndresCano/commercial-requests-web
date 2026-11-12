import type { SegmentProfile } from "@/lib/api/segments";
import { formatCompactCop } from "@/lib/currency";
import { ArrowUpRight, TrendingDown } from "@/components/icons";
import { cn } from "@/lib/utils";
import { formatCount, formatMonths, formatRate, rateVsArea } from "./segment-format";
import { segmentTheme } from "./segment-theme";

// The bar spans 0 to 60 % so the area mark sits near the middle and the rates seen so far (up to ~50 %) fit.
const RATE_SCALE_MAX = 0.6;

interface RateVsAreaProps {
  rate: number;
  /** Approval rate of the whole area (0..1), from the model run. */
  areaRate: number;
  strategy: string;
  /** Label above the value; defaults to the segment's median rate. */
  label?: string;
}

/** Approval rate with a bar and a tick at the area's rate; the difference is always written out. */
export function RateVsArea({ rate, areaRate, strategy, label = "Tasa de aprobación (mediana)" }: RateVsAreaProps) {
  const theme = segmentTheme(strategy);
  const diff = rateVsArea(rate, areaRate);
  const width = Math.min(100, (rate / RATE_SCALE_MAX) * 100);
  const areaLeft = Math.min(100, (areaRate / RATE_SCALE_MAX) * 100);

  return (
    <div data-testid="rate-vs-area" className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="font-mono text-sm font-bold text-foreground">{formatRate(rate)}</span>
      </div>
      <div
        className="relative h-2 rounded-full bg-muted"
        role="img"
        aria-label={`${formatRate(rate)} frente al ${formatRate(areaRate)} del área`}
      >
        <div className={cn("h-full rounded-full", theme.dot)} style={{ width: `${width}%` }} />
        <div
          className="absolute -top-1 h-4 w-0.5 rounded bg-foreground/70"
          style={{ left: `${areaLeft}%` }}
          aria-hidden="true"
        />
      </div>
      <p className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
        {diff.direction === "below" ? <TrendingDown className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
        <span>
          {diff.text} <span className="font-normal">({formatRate(areaRate)})</span>
        </span>
      </p>
    </div>
  );
}

interface StatProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
}

export function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className="font-display text-base font-bold leading-tight text-foreground">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** The figures every segment is described with: companies, firm ones, last proposal, proposals, typical value. */
export function SegmentStatGrid({ profile, className }: { profile: SegmentProfile; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-3", className)} data-testid="segment-stat-grid">
      <Stat label="Empresas" value={profile.companyCount} hint={`${profile.firmCount} firmes`} />
      <Stat label="Última propuesta" value={formatMonths(profile.recencyMonthsMedian)} hint="mediana" />
      <Stat label="Propuestas" value={formatCount(profile.frequencyMedian)} hint="mediana por empresa" />
      <Stat
        label="Valor típico"
        value={<span className="font-mono">{formatCompactCop(profile.typicalValueCop)}</span>}
        hint="mediana"
      />
    </div>
  );
}
