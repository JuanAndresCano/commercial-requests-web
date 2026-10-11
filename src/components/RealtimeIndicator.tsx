import { useRealtimeStatus } from "@/context/RealtimeContext";
import { realtimeStatusLabel } from "@/lib/realtime";
import { cn } from "@/lib/utils";

/** Discreet "En vivo" / "Reconectando…" dot for the header of the boards. */
export function RealtimeIndicator({ className }: { className?: string }) {
  const status = useRealtimeStatus();
  const label = realtimeStatusLabel(status);
  if (!label) return null;

  const live = status === "live";
  return (
    <span
      role="status"
      aria-live="polite"
      title={
        live ? "Los cambios llegan sin recargar la página" : "Sin conexión en vivo: se actualiza cada pocos segundos"
      }
      className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground", className)}
    >
      <span
        aria-hidden="true"
        className={cn("h-2 w-2 rounded-full", live ? "bg-icesi-green" : "bg-amber-500 motion-safe:animate-pulse")}
      />
      {label}
    </span>
  );
}
