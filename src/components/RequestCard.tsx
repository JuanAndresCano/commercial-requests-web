import { Link } from "react-router-dom";
import { Calendar, User, ArrowUpRight, AlertCircle } from "@/components/icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UrgencyBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import type { RequestItem } from "@/lib/mock-data";

interface RequestCardProps {
  req: RequestItem;
  /**
   * Insignia opcional para distinguir tarjetas dentro de una misma columna del
   * Kanban que en realidad mezcla más de un sub-estado — ej. la columna
   * "Lista para Entregar" del KAM agrupa TODO lo que está en "en-costeo",
   * pero el número de la cabecera solo cuenta las confirmadas por el Líder
   * (ver KamCommandCenter). Sin esto, el KAM veía "1" arriba y 3 tarjetas
   * idénticas abajo, sin forma de saber cuál de las 3 era la que contaba.
   */
  badge?: { label: string; tone: "ready" | "pending" };
}

export function RequestCard({ req, badge }: RequestCardProps) {
  return (
    <Link
      to={`/solicitudes/${req.id}`}
      className="group block rounded-lg border border-border dark:border-[#252838] bg-card dark:bg-[#141622] shadow-2xs transition-all hover:border-[#5454e9]/40 hover:shadow-md dark:hover:bg-[#171926] overflow-hidden"
    >
      {/* El cliente pidió ajustes — el KAM habla directo con el cliente, así
          que necesita ver esta señal igual que el Líder de Producto. */}
      {req.clientObservations && (
        <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/40 border-b border-amber-300/60 dark:border-amber-900/50 px-3.5 py-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Cliente pidió ajustes</span>
        </div>
      )}

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-semibold text-muted-foreground">{req.id}</span>
              <span className="text-[10px] text-muted-foreground/60">•</span>
              <span className="text-[11px] font-medium text-foreground truncate max-w-[130px]">{req.company}</span>
            </div>
            <h3 className="mt-1 line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-foreground group-hover:text-[#5454e9] transition-colors font-sans">
              {req.title}
            </h3>
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-[#5454e9] transition-all shrink-0 -mt-0.5" />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {badge && (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                badge.tone === "ready"
                  ? "border-[#865cf0]/30 bg-[#865cf0]/10 text-[#865cf0]"
                  : "border-border dark:border-[#2b2d3d] bg-secondary/70 dark:bg-[#1c1e2b] text-muted-foreground",
              )}
            >
              {badge.label}
            </span>
          )}
          <UrgencyBadge urgency={req.urgency} />
          <span className="rounded-md border border-border dark:border-[#2b2d3d] bg-secondary/50 dark:bg-[#1c1e2b] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {req.type}
          </span>
        </div>

        <div className="mt-3 space-y-1.5 border-t border-border dark:border-[#222434] pt-2.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between text-[11px]">
            <span className="truncate text-muted-foreground font-medium">
              LP: {req.productLeader.split(" ")[0]} {req.productLeader.split(" ")[1] || ""}
            </span>
            {req.professor ? (
              <span className="truncate max-w-[120px] text-[11px] font-semibold text-foreground">{req.professor}</span>
            ) : (
              <span className="rounded bg-[#e9683b]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#e9683b]">
                Sin docente
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <div className="flex items-center gap-1 truncate">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{req.applicant}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{format(new Date(req.createdAt), "d MMM", { locale: es })}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
