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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NODE_DEFAULT_LEADERS, type RequestItem } from "@/lib/mock-data";
import type { SelectableOption } from "@/components/ReassignLeaderDialog";

export interface EditTeamParams {
  nodeId: string;
  productLeaderId: string;
}

interface EditTeamDialogProps {
  /** Solicitud a corregir. El diálogo está abierto mientras no sea null. */
  request: RequestItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (params: EditTeamParams) => void;
  /** value = id real del backend; mientras cargan, los selects quedan deshabilitados. */
  nodeOptions?: SelectableOption[];
  leaderOptions?: SelectableOption[];
  saving?: boolean;
}

/** Líder sugerido para un nodo (mismo catálogo que el asistente de creación), como id de las opciones. */
export function suggestedLeaderIdFor(
  nodeId: string,
  nodeOptions: SelectableOption[] | undefined,
  leaderOptions: SelectableOption[] | undefined,
): string | undefined {
  const nodeName = nodeOptions?.find((n) => n.id === nodeId)?.label;
  const leaderName = nodeName ? NODE_DEFAULT_LEADERS[nodeName] : undefined;
  return leaderName ? leaderOptions?.find((l) => l.label.toLowerCase() === leaderName.toLowerCase())?.id : undefined;
}

/**
 * Corrección del nodo o del Líder de Producto por parte del KAM, mientras la
 * solicitud sigue "Entregada al líder" y sin docente (decisión del dueño,
 * 2026-10-07). Al elegir un nodo se preselecciona su líder sugerido, igual que
 * en el asistente de creación. Sin motivo: el cambio queda en el historial.
 */
export function EditTeamDialog({
  request,
  onOpenChange,
  onConfirm,
  nodeOptions,
  leaderOptions,
  saving = false,
}: EditTeamDialogProps) {
  const [nodeId, setNodeId] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [initial, setInitial] = useState<EditTeamParams>({ nodeId: "", productLeaderId: "" });

  useEffect(() => {
    if (!request) return;
    const currentNode = nodeOptions?.find((n) => n.label === request.node)?.id ?? "";
    const currentLeader = leaderOptions?.find((l) => l.label === request.productLeader)?.id ?? "";
    setNodeId(currentNode);
    setLeaderId(currentLeader);
    setInitial({ nodeId: currentNode, productLeaderId: currentLeader });
  }, [request, nodeOptions, leaderOptions]);

  const suggestedLeaderId = suggestedLeaderIdFor(nodeId, nodeOptions, leaderOptions);

  // Como en el asistente: al elegir un nodo se preselecciona su líder sugerido.
  const handleNodeChange = (value: string) => {
    setNodeId(value);
    const suggested = suggestedLeaderIdFor(value, nodeOptions, leaderOptions);
    if (suggested) setLeaderId(suggested);
  };

  const loading = !nodeOptions || !leaderOptions;
  const changed = nodeId !== initial.nodeId || leaderId !== initial.productLeaderId;
  const canSave = !loading && !saving && !!nodeId && !!leaderId && changed;

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">Cambiar nodo o líder</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Corrige el nodo temático o el Líder de Producto mientras la solicitud sigue sin docente. El cambio queda
            registrado en el historial del equipo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="edit-team-node" className="text-xs font-semibold text-foreground">
              Nodo temático
            </Label>
            <Select value={nodeId} onValueChange={handleNodeChange} disabled={loading}>
              <SelectTrigger id="edit-team-node" className="bg-card">
                <SelectValue placeholder={loading ? "Cargando nodos..." : "Selecciona un nodo"} />
              </SelectTrigger>
              <SelectContent>
                {nodeOptions?.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-team-leader" className="text-xs font-semibold text-foreground">
              Líder de Producto
            </Label>
            <Select value={leaderId} onValueChange={setLeaderId} disabled={loading}>
              <SelectTrigger id="edit-team-leader" className="bg-card">
                <SelectValue placeholder={loading ? "Cargando líderes..." : "Selecciona un líder"} />
              </SelectTrigger>
              <SelectContent>
                {leaderOptions?.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.label}
                    {l.id === suggestedLeaderId ? " (sugerido para el nodo)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" disabled={!canSave} onClick={() => onConfirm({ nodeId, productLeaderId: leaderId })}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
