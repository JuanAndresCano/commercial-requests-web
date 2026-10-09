import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Clock, Eye, FileText, History, Info, Search, X } from "@/components/icons";
import { cn } from "@/lib/utils";
import { STATUS_META, URGENCY_META, formatCop, type RequestItem } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { useRequests } from "@/hooks/use-requests";
import { mapProposalToRequestItem } from "@/lib/proposal-adapter";
import { findCompanyProposals, parseHistorySearchTerm } from "@/lib/proposal-history";

/**
 * History of proposals already delivered or in progress for the company being
 * registered. Rendered at the end of the "new request" wizard (Step 5), right
 * before submitting, so the KAM can check for antecedents or duplicates.
 * It only matches the exact NIT or the exact company name (see proposal-history).
 */
export function ProposalHistorySection({
  empresaNombre,
  empresaNit = "",
}: {
  empresaNombre: string;
  empresaNit?: string;
}) {
  const { requests } = useAuth();
  const { data: apiProposals } = useRequests();
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [proposalTab, setProposalTab] = useState<"todas" | "entregadas" | "en_proceso">("todas");
  const [selectedProposalModal, setSelectedProposalModal] = useState<RequestItem | null>(null);

  const allRequests = useMemo(() => {
    if (apiProposals && apiProposals.length > 0) {
      return apiProposals.map((p) => mapProposalToRequestItem(p));
    }
    return requests;
  }, [apiProposals, requests]);

  // Lo escrito en el buscador reemplaza a la empresa (nombre y NIT) del asistente.
  const searchQuery = useMemo(
    () =>
      historySearchTerm.trim() ? parseHistorySearchTerm(historySearchTerm) : { name: empresaNombre, nit: empresaNit },
    [historySearchTerm, empresaNombre, empresaNit],
  );
  const hasQuery = Boolean(searchQuery.name?.trim() || searchQuery.nit?.replace(/\D/g, ""));
  const consultedLabel = historySearchTerm.trim() || empresaNombre.trim() || empresaNit.trim();

  const companyProposals = useMemo(() => findCompanyProposals(allRequests, searchQuery), [allRequests, searchQuery]);

  const deliveredProposals = useMemo(
    () => companyProposals.filter((p) => p.status === "entregada"),
    [companyProposals],
  );
  const inProgressProposals = useMemo(
    () => companyProposals.filter((p) => p.status !== "entregada"),
    [companyProposals],
  );

  const displayedProposals = useMemo(() => {
    if (proposalTab === "entregadas") return deliveredProposals;
    if (proposalTab === "en_proceso") return inProgressProposals;
    return companyProposals;
  }, [proposalTab, deliveredProposals, inProgressProposals, companyProposals]);

  return (
    <>
      {/* 3. Buscador de propuestas entregadas y en proceso de la empresa */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-icesi-blue/10 text-icesi-blue dark:text-icesi-purple">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                Buscador de Propuestas Entregadas y en Proceso
                {companyProposals.length > 0 && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                    {companyProposals.length} encontrada{companyProposals.length !== 1 ? "s" : ""}
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                Identifica las propuestas que Icesi ya entregó o tiene en proceso para esta empresa (ej. antecedentes o
                evitar duplicidades). La búsqueda es por NIT exacto o nombre exacto de la empresa.
              </p>
            </div>
          </div>

          {/* Buscador directo por NIT o nombre exacto de la empresa */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa por NIT o nombre exacto..."
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
              className="h-8.5 pl-8 pr-7 text-xs bg-secondary/30"
            />
            {historySearchTerm && (
              <button
                type="button"
                onClick={() => setHistorySearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Resultados del buscador */}
        {hasQuery ? (
          companyProposals.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground font-medium">Filtrar estado:</span>
                  <div className="inline-flex rounded-lg border border-border p-0.5 bg-secondary/30">
                    <button
                      type="button"
                      onClick={() => setProposalTab("todas")}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs transition-colors",
                        proposalTab === "todas"
                          ? "bg-card text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Todas ({companyProposals.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProposalTab("entregadas")}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs transition-colors",
                        proposalTab === "entregadas"
                          ? "bg-icesi-purple/15 text-[#7344e8] dark:text-icesi-purple shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Entregadas ({deliveredProposals.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProposalTab("en_proceso")}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs transition-colors",
                        proposalTab === "en_proceso"
                          ? "bg-icesi-green/15 text-[#2d8f55] dark:text-icesi-green shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      En Proceso ({inProgressProposals.length})
                    </button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Empresa consultada: <strong className="text-foreground">{consultedLabel}</strong>
                </div>
              </div>

              {/* Lista de propuestas encontradas */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {displayedProposals.map((item) => {
                  const statusInfo = STATUS_META[item.status];
                  const urgencyInfo = URGENCY_META[item.urgency];
                  const hasClientDocs = item.clientKamDocuments && item.clientKamDocuments.length > 0;

                  return (
                    <div
                      key={item.id}
                      className="group rounded-lg border border-border bg-card p-3.5 transition-all hover:border-accent/40 hover:shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground">{item.code ?? item.id}</span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border",
                                statusInfo.tone,
                              )}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", statusInfo.dot)} />
                              {statusInfo.label}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-1.5 py-0.2 text-[10px] font-medium border",
                                urgencyInfo.tone,
                              )}
                            >
                              Urgencia: {urgencyInfo.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-medium bg-secondary px-2 py-0.5 rounded">
                              {item.type}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-foreground truncate">{item.title}</h4>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              Empresa: <strong className="text-foreground">{item.company}</strong>
                            </span>
                            <span>
                              Nodo: <strong className="text-foreground">{item.node}</strong>
                            </span>
                            <span>
                              Líder: <strong className="text-foreground">{item.productLeader}</strong>
                            </span>
                            <span>
                              Valor:{" "}
                              <strong className="text-foreground font-mono">{formatCop(item.totalCostCop ?? 0)}</strong>
                            </span>
                            {item.deadline && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Entrega: {format(new Date(item.deadline), "yyyy-MM-dd")}
                              </span>
                            )}
                            {hasClientDocs && (
                              <span className="text-accent font-medium flex items-center gap-1">
                                <FileText className="h-3 w-3" /> {item.clientKamDocuments!.length} doc(s)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-1 sm:pt-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProposalModal(item)}
                            className="h-8 text-xs font-semibold gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver detalle
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-center">
              <p className="text-xs font-medium text-foreground">
                No se encontraron propuestas registradas para &ldquo;{consultedLabel}&rdquo;
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                No constan propuestas previas entregadas ni solicitudes en curso para esta entidad.
              </p>
            </div>
          )
        ) : (
          <div className="rounded-lg border border-dashed border-border/80 bg-secondary/15 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                Escribe en el buscador el NIT o el nombre exacto de la empresa para consultar sus propuestas entregadas
                y en proceso.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalle de Propuesta */}
      <Dialog
        open={!!selectedProposalModal}
        onOpenChange={(open) => {
          if (!open) setSelectedProposalModal(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {selectedProposalModal?.code ?? selectedProposalModal?.id}
              </span>
              {selectedProposalModal && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border",
                    STATUS_META[selectedProposalModal.status].tone,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[selectedProposalModal.status].dot)} />
                  {STATUS_META[selectedProposalModal.status].label}
                </span>
              )}
            </div>
            <DialogTitle className="text-base font-bold text-foreground mt-1">
              {selectedProposalModal?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Empresa: <strong className="text-foreground">{selectedProposalModal?.company}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedProposalModal && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Tipo de Requerimiento</span>
                  <span className="font-semibold text-foreground">{selectedProposalModal.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nivel de Urgencia</span>
                  <span className="font-semibold text-foreground capitalize">{selectedProposalModal.urgency}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nodo Asignado</span>
                  <span className="font-semibold text-foreground">{selectedProposalModal.node}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Líder de Producto</span>
                  <span className="font-semibold text-foreground">{selectedProposalModal.productLeader}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">KAM a cargo</span>
                  <span className="font-semibold text-foreground">{selectedProposalModal.kam}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Valor de la Oferta</span>
                  <span className="font-bold text-foreground font-mono text-sm">
                    {formatCop(selectedProposalModal.totalCostCop ?? 0)}
                  </span>
                </div>
              </div>

              {selectedProposalModal.clientKamDocuments && selectedProposalModal.clientKamDocuments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-accent" /> Documentos de la propuesta
                  </span>
                  <div className="space-y-1">
                    {selectedProposalModal.clientKamDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 rounded-md border border-border bg-card text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground truncate">{doc.name}</span>
                          <span className="text-muted-foreground text-[10px]">({doc.size})</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{doc.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedProposalModal(null)}
              className="text-xs"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
