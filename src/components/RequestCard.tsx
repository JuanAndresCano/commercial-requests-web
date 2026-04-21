import { Link } from "react-router-dom";
import { Calendar, User, Tag, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StatusBadge, UrgencyBadge } from "./StatusBadge";
import type { RequestItem } from "@/lib/mock-data";

export function RequestCard({ req }: { req: RequestItem }) {
  return (
    <Link
      to={`/solicitudes/${req.id}`}
      className="group block rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">{req.id}</p>
          <h3 className="mt-1 line-clamp-2 font-display text-sm font-bold leading-snug text-foreground group-hover:text-accent">
            {req.title}
          </h3>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={req.status} />
        <UrgencyBadge urgency={req.urgency} />
      </div>

      <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">{req.applicant}</span>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="h-3.5 w-3.5" />
          <span>{req.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>Creada {format(new Date(req.createdAt), "d MMM yyyy", { locale: es })}</span>
        </div>
        {req.deadline && (
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Límite {format(new Date(req.deadline), "d MMM yyyy", { locale: es })}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
