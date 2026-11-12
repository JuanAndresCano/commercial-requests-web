import { useMemo, useState } from "react";
import type { CompanySegment, SegmentProfile, SegmentRun } from "@/lib/api/segments";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SegmentBubbleChart } from "./SegmentBubbleChart";
import { SegmentCompaniesTable } from "./SegmentCompaniesTable";
import { SegmentSummaryCard } from "./SegmentSummaryCard";

const TOP_FIRM_COMPANIES = 3;
export const SEGMENTS_TABLE_ID = "segmentos-tabla";

interface SegmentsOverviewProps {
  run: SegmentRun;
  /** In business order (Cuidar, Crecer, Convertir, Reactivar). */
  profiles: SegmentProfile[];
  /** Every company of the run; filtering is done here (a run has a few hundred rows). */
  companies: CompanySegment[];
}

/** The map on top, one card per segment under it, and the companies table at the end. */
export function SegmentsOverview({ run, profiles, companies }: SegmentsOverviewProps) {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const narrow = useMediaQuery("(max-width: 639px)");

  const topBySegment = useMemo(() => {
    const result = new Map<number, CompanySegment[]>();
    for (const p of profiles) {
      result.set(
        p.segment,
        companies
          .filter((c) => c.segment === p.segment && c.isFirm)
          .sort((a, b) => b.frequency - a.frequency || a.companyName.localeCompare(b.companyName, "es"))
          .slice(0, TOP_FIRM_COMPANIES),
      );
    }
    return result;
  }, [companies, profiles]);

  const viewAll = (segment: number) => {
    setSelectedSegment(segment);
    // Wait for the table to re-render with the filter before scrolling to it.
    requestAnimationFrame(() =>
      document.getElementById(SEGMENTS_TABLE_ID)?.scrollIntoView?.({ behavior: "smooth", block: "start" }),
    );
  };

  return (
    <div className="space-y-6" data-testid="segments-overview">
      <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <div>
          <h2 className="font-display text-base font-bold text-foreground sm:text-lg">Mapa de segmentos</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cada burbuja es un segmento y su tamaño es el número de empresas. Los puntos pequeños son las empresas (más
            oscuros las «firmes»). Toca una burbuja para filtrar la tabla.
          </p>
        </div>
        <SegmentBubbleChart
          profiles={profiles}
          companies={companies}
          areaRate={run.areaApprovalRate}
          selectedSegment={selectedSegment}
          onSelectSegment={setSelectedSegment}
          compact={narrow}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {profiles.map((p) => (
          <SegmentSummaryCard
            key={p.segment}
            profile={p}
            areaRate={run.areaApprovalRate}
            topCompanies={topBySegment.get(p.segment) ?? []}
            selected={selectedSegment === p.segment}
            dimmed={selectedSegment !== null && selectedSegment !== p.segment}
            onViewAll={() => viewAll(p.segment)}
          />
        ))}
      </div>

      <SegmentCompaniesTable
        id={SEGMENTS_TABLE_ID}
        companies={companies}
        profiles={profiles}
        selectedSegment={selectedSegment}
        onSelectSegment={setSelectedSegment}
      />
    </div>
  );
}
