import { Skeleton } from "@/components/ui/skeleton";

export function Company360Skeleton() {
  return (
    <div className="space-y-6" data-testid="company-360-skeleton">
      {/* Header Selector Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-72 rounded-lg" />
      </div>

      {/* Company Profile Card Skeleton */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-full max-w-xl" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3.5 w-48" />
          </div>
        ))}
      </div>

      {/* Main Two-Column Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Timeline) */}
        <div className="space-y-4 lg:col-span-7 rounded-xl border border-border bg-card p-5 shadow-xs">
          <Skeleton className="h-6 w-52" />
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-6 w-6 rounded-full shrink-0 mt-1" />
                <div className="space-y-2 w-full">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (Impacts & Nodes) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <Skeleton className="h-6 w-44" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
