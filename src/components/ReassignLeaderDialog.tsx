import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NODES, NODE_DEFAULT_LEADERS, PRODUCT_LEADERS, type RequestItem } from "@/lib/mock-data";

export const REASSIGN_REASONS = [
  "Temática no afín / Corresponde a otro nodo",
  "Asignada por error por el KAM",
  "Redistribución por sobrecarga operativa",
  "Especialidad técnica específica",
  "Otro motivo",
] as const;

export interface ReassignConfirmParams {
  newLeader: string;
  newNode: string;
  reason: string;
  notes: string;
}

interface ReassignLeaderDialogProps {
  /** Solicitud a reasignar. El diálogo está abierto mientras no sea null. */
  request: RequestItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (params: ReassignConfirmParams) => void;
}

/**
 * Modal de "Reasignar Líder de Producto" — antes triplicado en
 * RequestDetail.tsx, ProductLeaderDashboard.tsx y una tercera copia muerta
 * en Dashboard.tsx (docs/03). Se extrae aquí como componente
 * compartido antes de habilitar la reasignación también desde "En Experto",
 * para no volver a duplicar la lógica una tercera vez.
 *
 * `reassignReason`/`reassignNotes` se capturan pero, igual que antes de esta
 * extracción, no se persisten en `RequestItem` — queda fuera de alcance
 * (docs/03).
 */
export function ReassignLeaderDialog({ request, onOpenChange, onConfirm }: ReassignLeaderDialogProps) {
  const [selectedNewLeader, setSelectedNewLeader] = useState("");
  const [selectedNewNode, setSelectedNewNode] = useState("");
  const [reassignReason, setReassignReason] = useState<string>(REASSIGN_REASONS[0]);
  const [reassignNotes, setReassignNotes] = useState("");

  // Reinicia el formulario cada vez que se abre para una solicitud distinta.
  useEffect(() => {
    if (request) {
      setSelectedNewLeader("");
      setSelectedNewNode(request.node);
      setReassignReason(REASSIGN_REASONS[0]);
      setReassignNotes("");
    }
  }, [request]);

  const handleConfirm = () => {
    if (!request || !selectedNewLeader) return;
    onConfirm({
      newLeader: selectedNewLeader,
      newNode: selectedNewNode || request.node,
      reason: reassignReason,
      notes: reassignNotes,
    });
  };

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">{request?.id}</span>
            <span className="rounded bg-[#5454e9]/10 px-2 py-0.5 text-[10px] font-bold text-[#5454e9] dark:text-[#865cf0]">
              {request?.node}
            </span>
          </div>
          <DialogTitle className="text-base font-bold text-foreground mt-1">Reasignar Líder de Producto</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Transfiere la gestión de esta solicitud comercial a otro líder si no corresponde a tu área temática.
            {request?.status === "en-experto" && (
              <> La solicitud volverá a la fase "Nueva" para que el nuevo líder reinicie la asignación de docente.</>
            )}
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-4 py-2 text-xs">
            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1.5">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Propuesta:</span>
                <span className="font-semibold text-foreground text-right truncate">{request.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Empresa:</span>
                <span className="font-semibold text-foreground">{request.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Líder asignado actualmente:</span>
                <span className="font-semibold text-[#e9683b]">{request.productLeader}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reassign-new-leader" className="text-xs font-semibold text-foreground">
                Nuevo Líder de Producto destinatario *
              </Label>
              <Select
                value={selectedNewLeader}
                onValueChange={(val) => {
                  setSelectedNewLeader(val);
                  const foundNode = Object.entries(NODE_DEFAULT_LEADERS).find(([, leader]) => leader === val);
                  if (foundNode) {
                    setSelectedNewNode(foundNode[0]);
                  }
                }}
              >
                <SelectTrigger id="reassign-new-leader" className="text-xs h-9">
                  <SelectValue placeholder="Seleccionar nuevo líder de producto" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_LEADERS.map((leader) => {
                    const isCurrent = leader === request.productLeader;
                    const leaderNode = Object.entries(NODE_DEFAULT_LEADERS).find(([, l]) => l === leader)?.[0];
                    return (
                      <SelectItem key={leader} value={leader} disabled={isCurrent}>
                        {leader}{" "}
                        {isCurrent ? "(Líder actual)" : leaderNode ? `· Nodo: ${leaderNode.split(",")[0]}` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reassign-new-node" className="text-xs font-semibold text-foreground">
                Nodo Temático sugerido
              </Label>
              <Select value={selectedNewNode} onValueChange={setSelectedNewNode}>
                <SelectTrigger id="reassign-new-node" className="text-xs h-9">
                  <SelectValue placeholder="Seleccionar nodo temático" />
                </SelectTrigger>
                <SelectContent>
                  {NODES.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reassign-reason" className="text-xs font-semibold text-foreground">
                Motivo de la reasignación
              </Label>
              <Select value={reassignReason} onValueChange={setReassignReason}>
                <SelectTrigger id="reassign-reason" className="text-xs h-9">
                  <SelectValue placeholder="Seleccionar motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {REASSIGN_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reassign-notes" className="text-xs font-semibold text-muted-foreground">
                Nota o mensaje para el nuevo líder (opcional)
              </Label>
              <Textarea
                id="reassign-notes"
                rows={2}
                placeholder="Ej. Esta solicitud corresponde al área de Inteligencia Artificial..."
                value={reassignNotes}
                onChange={(e) => setReassignNotes(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!selectedNewLeader || selectedNewLeader === request?.productLeader}
            onClick={handleConfirm}
            className="text-xs bg-[#5454e9] hover:bg-[#4343d0] text-white"
          >
            Confirmar Reasignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
