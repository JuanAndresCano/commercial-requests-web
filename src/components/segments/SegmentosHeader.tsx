import type { SegmentRun } from "@/lib/api/segments";
import { formatDay } from "./segment-format";

export const SEGMENTS_NOTE =
  "Segmentos exploratorios calculados sobre el histórico de Educación Continua (empresas con 3 o más propuestas).";

interface SegmentosHeaderProps {
  run: SegmentRun | null;
}

export function SegmentosHeader({ run }: SegmentosHeaderProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-border/60 pb-4">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Segmentos de clientes
      </h1>
      <p className="text-xs text-muted-foreground sm:text-sm">{SEGMENTS_NOTE}</p>
      {run && (
        <p data-testid="segment-run-date" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 font-semibold text-foreground">
            Corrida del {formatDay(run.runDate)}
          </span>
          <span className="text-muted-foreground">Datos hasta el {formatDay(run.dataCutoffDate)}</span>
          <span className="text-muted-foreground">
            {run.universeSize} empresas · {run.k} segmentos
          </span>
        </p>
      )}
    </div>
  );
}
