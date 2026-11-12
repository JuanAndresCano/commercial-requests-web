"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { SegmentosHeader } from "@/components/segments/SegmentosHeader";
import { SegmentosEmpty, SegmentosError, SegmentosSkeleton } from "@/components/segments/SegmentosStates";
import { SegmentsOverview } from "@/components/segments/SegmentsOverview";
import { sortProfiles } from "@/components/segments/segment-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAdminSegments } from "@/hooks/use-admin-segments";

export default function AdminSegmentosView() {
  const { data, isLoading, isError, refetch } = useAdminSegments();
  const profiles = useMemo(() => sortProfiles(data?.profiles ?? []), [data]);

  let content: React.ReactNode;
  if (isLoading) {
    content = <SegmentosSkeleton />;
  } else if (isError) {
    content = <SegmentosError onRetry={() => void refetch()} />;
  } else if (!data?.run || profiles.length === 0) {
    content = <SegmentosEmpty />;
  } else {
    content = <SegmentsOverview run={data.run} profiles={profiles} companies={data.companies} />;
  }

  return (
    <AppShell>
      <TooltipProvider delayDuration={150}>
        <div data-testid="admin-segmentos-view" className="space-y-6">
          <SegmentosHeader run={data?.run ?? null} />
          {content}
        </div>
      </TooltipProvider>
    </AppShell>
  );
}
