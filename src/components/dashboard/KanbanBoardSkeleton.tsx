import React from "react";

export function KanbanBoardSkeleton() {
  return (
    <div className="space-y-6" data-testid="kanban-skeleton">
      {/* Header / Metric cards placeholder */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl border border-border bg-card/60 p-3 flex flex-col justify-between">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-6 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* 4 Kanban columns placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {["Nueva", "En Asignación", "En Costeo", "Entregada"].map((colTitle) => (
          <div key={colTitle} className="rounded-xl border border-border bg-card/40 p-3 space-y-3 min-h-[380px]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-5 w-6 bg-muted rounded-full" />
            </div>
            <div className="space-y-2.5">
              {[1, 2].map((cardIndex) => (
                <div key={cardIndex} className="rounded-lg border border-border bg-card p-3 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-16 bg-muted rounded" />
                    <div className="h-3 w-12 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="pt-2 flex justify-between items-center border-t border-border/50">
                    <div className="h-3 w-20 bg-muted rounded" />
                    <div className="h-4 w-14 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
