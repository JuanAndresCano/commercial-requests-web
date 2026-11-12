import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, LayoutGrid, RefreshCw } from "@/components/icons";

export function SegmentosSkeleton() {
  return (
    <div className="space-y-6" data-testid="segmentos-skeleton" aria-busy="true" aria-label="Cargando segmentos">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <Skeleton className="mb-4 h-5 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-xs">
            <Skeleton className="h-5 w-28 rounded-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <Skeleton className="h-5 w-48" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

export function SegmentosEmpty() {
  return (
    <div
      data-testid="segmentos-empty"
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-xs"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-icesi-blue/10 text-icesi-blue">
        <LayoutGrid className="h-6 w-6" />
      </div>
      <h2 className="font-display text-lg font-bold text-foreground">Aún no se han cargado segmentos</h2>
      <p className="max-w-md text-xs text-muted-foreground sm:text-sm">
        Cuando el equipo de datos cargue una corrida del modelo de segmentación, los segmentos y sus empresas aparecerán
        aquí.
      </p>
    </div>
  );
}

export function SegmentosError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      data-testid="segmentos-error"
      className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="font-display text-lg font-bold text-foreground">No pudimos cargar los segmentos</h2>
      <p className="max-w-md text-xs text-muted-foreground sm:text-sm">
        Hubo un problema al consultar los datos. Revisa tu conexión e inténtalo de nuevo.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Reintentar
      </button>
    </div>
  );
}
