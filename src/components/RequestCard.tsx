import { Link } from "react-router-dom";
import { Calendar, User, ArrowUpRight, AlertCircle, ArrowRight } from "@/components/icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UrgencyBadge } from "./StatusBadge";
import type { RequestItem } from "@/lib/mock-data";

interface RequestCardProps {
  req: RequestItem;
  /**
   * Texto de un atajo visual al fondo de la tarjeta (ej. "Revisar y
   * entregar") para columnas donde la tarjeta ya representa una acción
   * concreta pendiente, igual que los botones de acción del tablero del
   * Líder de Producto. Es solo un refuerzo visual — toda la tarjeta ya
   * navega al detalle, así que no es un enlace independiente.
   */
  cta?: string;
}

export function RequestCard({ req, cta }: RequestCardProps) {
  return (
    <Link
      to={`/solicitudes/${req.id}`}
      className="group block rounded-lg border border-border dark:border-[#252838] bg-card dark:bg-[#141622] shadow-2xs transition-all hover:border-[#5454e9]/40 hover:shadow-md dark:hover:bg-[#171926] overflow-hidden"
    >
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
          {/* El cliente pidió ajustes — el KAM habla directo con el cliente, así
              que necesita ver esta señal igual que el Líder de Producto. Insignia
              en línea (no un banner de ancho completo) para que todas las
              tarjetas mantengan la misma estructura y proporción entre sí. */}
          {req.clientObservations && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 dark:border-amber-900/50 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Cliente pidió ajustes
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

      {cta && (
        <div className="flex items-center justify-between gap-2 border-t border-icesi-blue/20 bg-icesi-blue/5 px-3.5 py-2 dark:bg-icesi-blue/10 group-hover:bg-icesi-blue/10 dark:group-hover:bg-icesi-blue/15 transition-colors">
          <span className="text-[11px] font-bold text-icesi-blue">{cta}</span>
          <ArrowRight className="h-3.5 w-3.5 text-icesi-blue" />
        </div>
      )}
    </Link>
  );
}
