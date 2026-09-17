import { cn } from "@/lib/utils";

// Insignia de rol junto al encabezado ("Hola, X [Rol]"). Un solo color (amarillo
// Icesi) para las 3 pantallas que la usan — no debe competir visualmente con el
// azul primario, que ya se usa para acciones y enlaces en toda la app.
export function RoleBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "rounded bg-[#e4eb60]/25 px-2.5 py-0.5 text-xs font-bold text-[#757a07] dark:text-[#e4eb60]",
        className,
      )}
    >
      {label}
    </span>
  );
}
