import { Link } from "react-router-dom";
import { Calendar, User, Tag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StatusBadge, UrgencyBadge } from "./StatusBadge";
import type { RequestItem } from "@/lib/mock-data";

export function RequestCard({ req }: { req: RequestItem }) {
  return (
    <Link
      to={`/solicitudes/${req.id}`}
      className="block rounded-md border border-border bg-card p-3 transition-colors hover:border-accent/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono text-muted-foreground">{req.id}</p>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {req.title}
          </h3>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <UrgencyBadge urgency={req.urgency} />
        <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {req.type}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-border pt-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between text-[11px]">
          <span className="truncate text-muted-foreground font-medium">LP: {req.productLeader}</span>
          {req.professor ? (
            <span className="truncate max-w-[110px] text-[11px] font-medium text-foreground">
              {req.professor}
            </span>
          ) : (
            <span className="rounded bg-warning/10 px-1 py-0.5 text-[10px] font-semibold text-warning">
              Sin docente
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3" />
          <span className="truncate">{req.applicant} · {req.company}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          <span>Creada {format(new Date(req.createdAt), "d MMM", { locale: es })}</span>
          {req.deadline && (
            <span className="ml-auto text-foreground">
              · Límite {format(new Date(req.deadline), "d MMM", { locale: es })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
