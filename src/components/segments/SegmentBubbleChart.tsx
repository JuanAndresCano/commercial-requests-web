import { useMemo } from "react";
import type { CompanySegment, SegmentProfile } from "@/lib/api/segments";
import { cn } from "@/lib/utils";
import { formatMonths, formatRate, monthsFromDays } from "./segment-format";
import { segmentTheme } from "./segment-theme";

interface Layout {
  width: number;
  height: number;
  margin: { left: number; right: number; top: number; bottom: number };
  /** Bubble radius per square root of the number of companies (so the area follows the count). */
  radiusPerSqrt: number;
  dotRadius: number;
  font: number;
  labelFont: number;
  xTitle: string;
}

// Two layouts of the same chart, each with its own viewBox, so text keeps a readable size on a phone instead of
// a wide drawing being shrunk to fit.
const WIDE: Layout = {
  width: 900,
  height: 420,
  margin: { left: 60, right: 28, top: 22, bottom: 56 },
  radiusPerSqrt: 5,
  dotRadius: 3,
  font: 12,
  labelFont: 13,
  xTitle: "Meses desde la última propuesta (más a la izquierda = más reciente)",
};

const COMPACT: Layout = {
  width: 400,
  height: 400,
  margin: { left: 46, right: 14, top: 16, bottom: 52 },
  radiusPerSqrt: 3.3,
  dotRadius: 2.2,
  font: 11,
  labelFont: 12,
  xTitle: "Meses desde la última propuesta",
};

interface SegmentBubbleChartProps {
  profiles: SegmentProfile[];
  companies: CompanySegment[];
  /** Approval rate of the whole area (0..1): the dashed reference line. */
  areaRate: number;
  selectedSegment: number | null;
  onSelectSegment: (segment: number | null) => void;
  /** Narrow screens: a tighter layout with the same data. */
  compact?: boolean;
}

function niceCeil(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

/**
 * Recency (months since the last proposal) against median approval rate. One bubble per segment, sized by the
 * number of companies; the small dots behind are the companies themselves, so the overlap between segments is
 * visible instead of hidden. Click (or Enter/Space) on a bubble filters the table to that segment.
 */
export function SegmentBubbleChart({
  profiles,
  companies,
  areaRate,
  selectedSegment,
  onSelectSegment,
  compact = false,
}: SegmentBubbleChartProps) {
  const L = compact ? COMPACT : WIDE;
  const plotW = L.width - L.margin.left - L.margin.right;
  const plotH = L.height - L.margin.top - L.margin.bottom;
  const strategyBySegment = useMemo(() => new Map(profiles.map((p) => [p.segment, p.strategy])), [profiles]);

  const { xMax, yMax } = useMemo(() => {
    const months = [
      ...companies.map((c) => monthsFromDays(c.recencyDays)),
      ...profiles.map((p) => p.recencyMonthsMedian),
    ];
    const rates = [
      ...companies.map((c) => c.approvalRateSmoothed),
      ...profiles.map((p) => p.approvalRateMedian),
      areaRate,
    ];
    return {
      xMax: Math.min(48, Math.max(12, niceCeil(Math.max(0, ...months), 6))),
      yMax: Math.max(0.6, niceCeil(Math.max(0, ...rates) * 100, 10) / 100),
    };
  }, [companies, profiles, areaRate]);

  const x = (months: number) => L.margin.left + (Math.min(months, xMax) / xMax) * plotW;
  const y = (rate: number) => L.margin.top + plotH - (Math.min(rate, yMax) / yMax) * plotH;

  const xTicks = Array.from({ length: Math.floor(xMax / 6) + 1 }, (_, i) => i * 6);
  // Every 20 %: integers first, so there is no floating-point drift.
  const yTicks = Array.from({ length: Math.round(yMax * 10) + 1 }, (_, i) => i)
    .filter((i) => i % 2 === 0)
    .map((i) => i / 10);

  const anySelected = selectedSegment !== null;

  return (
    <svg
      viewBox={`0 0 ${L.width} ${L.height}`}
      role="group"
      aria-label="Mapa de segmentos: meses desde la última propuesta contra tasa de aprobación"
      className="w-full"
      data-testid="segment-bubble-chart"
    >
      {/* Grid and axes */}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line
            x1={L.margin.left}
            x2={L.width - L.margin.right}
            y1={y(t)}
            y2={y(t)}
            className="stroke-border"
            strokeWidth={1}
          />
          <text x={L.margin.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground" fontSize={L.font}>
            {Math.round(t * 100)} %
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <g key={`x${t}`}>
          <line
            x1={x(t)}
            x2={x(t)}
            y1={L.margin.top}
            y2={L.margin.top + plotH}
            className="stroke-border/50"
            strokeWidth={1}
          />
          <text
            x={x(t)}
            y={L.height - L.margin.bottom + 18}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={L.font}
          >
            {t}
          </text>
        </g>
      ))}
      <text
        x={L.margin.left + plotW / 2}
        y={L.height - 10}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={L.font}
        fontWeight={600}
      >
        {L.xTitle}
      </text>
      <text
        transform={`translate(12 ${L.margin.top + plotH / 2}) rotate(-90)`}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={L.font}
        fontWeight={600}
      >
        Tasa de aprobación
      </text>

      {/* Area reference */}
      <line
        x1={L.margin.left}
        x2={L.width - L.margin.right}
        y1={y(areaRate)}
        y2={y(areaRate)}
        className="stroke-foreground/60"
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
      <text
        x={L.width - L.margin.right - 4}
        y={y(areaRate) - 6}
        textAnchor="end"
        className="fill-foreground"
        fontSize={L.font}
        fontWeight={700}
      >
        Área {formatRate(areaRate)}
      </text>

      {/* Companies: small dots, one per company */}
      <g aria-hidden="true">
        {companies.map((c) => {
          const strategy = strategyBySegment.get(c.segment) ?? "";
          const theme = segmentTheme(strategy);
          const dim = anySelected && c.segment !== selectedSegment;
          return (
            <circle
              key={c.id}
              cx={x(monthsFromDays(c.recencyDays))}
              cy={y(c.approvalRateSmoothed)}
              r={L.dotRadius}
              className={cn(theme.fill, "transition-opacity")}
              opacity={dim ? 0.08 : c.isFirm ? 0.5 : 0.22}
            >
              <title>
                {c.companyName} · {strategy} · {formatRate(c.approvalRateSmoothed)}
              </title>
            </circle>
          );
        })}
      </g>

      {/* Segments: bubbles */}
      {profiles.map((p) => {
        const theme = segmentTheme(p.strategy);
        const selected = selectedSegment === p.segment;
        const r = L.radiusPerSqrt * Math.sqrt(p.companyCount);
        const cx = x(p.recencyMonthsMedian);
        const cy = y(p.approvalRateMedian);
        const labelOnLeft = cx + r + 8 + p.strategy.length * L.labelFont * 0.62 > L.width - L.margin.right;
        const toggle = () => onSelectSegment(selected ? null : p.segment);
        return (
          <g
            key={p.segment}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={`${p.strategy}, ${p.label}: ${p.companyCount} empresas, última propuesta ${formatMonths(p.recencyMonthsMedian)}, tasa ${formatRate(p.approvalRateMedian)}. ${selected ? "Quitar filtro" : "Filtrar la tabla"}`}
            data-testid={`bubble-${p.segment}`}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
              }
            }}
            className={cn(
              "group cursor-pointer outline-none transition-opacity",
              anySelected && !selected && "opacity-40",
            )}
          >
            <circle
              cx={cx}
              cy={cy}
              r={r + 5}
              className="fill-none stroke-foreground opacity-0 group-focus-visible:opacity-100"
              strokeWidth={2}
            />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              className={cn(theme.fill, theme.stroke)}
              fillOpacity={selected ? 0.4 : 0.22}
              strokeWidth={selected ? 3.5 : 2}
            />
            <text
              x={cx}
              y={cy + 4.5}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={L.labelFont + 1}
              fontWeight={800}
            >
              {p.companyCount}
            </text>
            <text
              x={labelOnLeft ? cx - r - 6 : cx + r + 6}
              y={cy + 4}
              textAnchor={labelOnLeft ? "end" : "start"}
              className="fill-foreground"
              fontSize={L.labelFont}
              fontWeight={700}
            >
              {p.strategy}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
