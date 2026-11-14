import type { UserRole } from "@/context/AuthContext";
import type { ProposalDetail } from "@/lib/api/requests";
import type { CommercialStatus } from "@/lib/api/commercial-status";
import { COMMERCIAL_STATUS_LABELS, UNKNOWN_COMMERCIAL_STATUS_LABEL } from "@/lib/commercial-status";

type CommercialProposal = Pick<
  ProposalDetail,
  "id" | "creator" | "workflow" | "commercialStatus" | "commercialStatusHistory"
>;

interface CommercialStatusPanelProps {
  proposal: CommercialProposal;
  role: UserRole;
  userEmail: string;
}

const statusLabel = (status: CommercialStatus | null | undefined) =>
  status ? (COMMERCIAL_STATUS_LABELS[status] ?? UNKNOWN_COMMERCIAL_STATUS_LABEL) : "Sin etiqueta";

/**
 * History of the commercial follow-up tag. The tag itself is changed with the chip next to the stage
 * badge in the header (CommercialStatusChip); this panel only shows the server-side change log, to the
 * owner KAM (who edits) and to the Product Leader (read-only).
 */
export function CommercialStatusPanel({ proposal, role, userEmail }: CommercialStatusPanelProps) {
  const isOwnerKam = role === "kam" && proposal.creator?.email === userEmail;
  if ((!isOwnerKam && role !== "lider-producto") || proposal.workflow?.currentStatus.code !== "DELIVERED") {
    return null;
  }
  const history = proposal.commercialStatusHistory ?? [];

  return (
    <section
      className="space-y-3 rounded-xl border border-border bg-card p-5"
      aria-labelledby="commercial-status-heading"
    >
      <div>
        <h2 id="commercial-status-heading" className="text-sm font-bold text-foreground">
          Seguimiento comercial
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Una sola etiqueta vigente. La etapa operativa sigue siendo Entregada (propuesta presentada al cliente).
          {isOwnerKam && " Cámbiala desde la etiqueta junto a la etapa, en la cabecera."}
        </p>
      </div>
      {history.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-3">
          <h3 className="text-xs font-semibold text-foreground">Historial de etiquetas</h3>
          <ol className="space-y-2 text-xs text-muted-foreground">
            {history.map((change) => (
              <li key={change.id}>
                <span className="font-medium text-foreground">
                  {statusLabel(change.previousStatus)} → {statusLabel(change.status)}
                </span>
                <span className="block">
                  {[change.changedBy.firstName, change.changedBy.lastName].filter(Boolean).join(" ") || "KAM"}
                </span>
                <time dateTime={change.changedAt}>{new Date(change.changedAt).toLocaleString("es-CO")}</time>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="border-t border-border pt-3 text-xs text-muted-foreground">Aún no hay cambios de etiqueta.</p>
      )}
    </section>
  );
}
