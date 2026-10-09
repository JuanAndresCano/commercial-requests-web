import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { SelectableOption } from "@/components/ReassignLeaderDialog";
import { NO_NODE_LABEL, NO_NODE_VALUE, nodeLabel, nodePatchFor, selectValueForNode } from "@/lib/node-selection";

interface TeamNodeEditorProps {
  /** Name of the node of the request; `null` when it has none (C-06). */
  nodeName: string | null;
  /** Real id of the node; `null` when it has none. */
  nodeId: string | null | undefined;
  /** value = real backend id; while they load, the select stays disabled. */
  nodeOptions?: SelectableOption[];
  /** The Product Leader (owner) can put or remove the node. */
  editable: boolean;
  saving?: boolean;
  /** Body of PATCH /requests/:id/node. Only called when the choice differs from the current node. */
  onSave: (patch: { nodeId: string | null }) => void;
  /** Extra control on the label row for a viewer who cannot edit here (e.g. the KAM's "Cambiar" link). */
  headerAction?: ReactNode;
}

/**
 * "Nodo Temático" of "Equipo Asignado". The node is optional (C-06): without one it reads "Sin nodo". The
 * Product Leader can put, change or remove it; a native select keeps it light (a Radix Select is slow to
 * open in the tests) and "Sin nodo" is one of its options.
 */
export function TeamNodeEditor({
  nodeName,
  nodeId,
  nodeOptions,
  editable,
  saving = false,
  onSave,
  headerAction,
}: TeamNodeEditorProps) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(NO_NODE_VALUE);

  const startEditing = () => {
    setSelected(selectValueForNode(nodeId));
    setEditing(true);
  };

  const patch = nodePatchFor(nodeId, selected);

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">Nodo Temático</span>
        {editable && !editing && (
          <button
            type="button"
            onClick={startEditing}
            aria-label="Cambiar nodo temático"
            className="text-[11px] font-semibold text-[#5454e9] dark:text-[#865cf0] hover:underline cursor-pointer"
          >
            {nodeName ? "Cambiar" : "Asignar"}
          </button>
        )}
        {!editable && headerAction}
      </div>

      {editing ? (
        <div className="space-y-2">
          <select
            aria-label="Nodo temático"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={!nodeOptions || saving}
            className="h-8 w-full rounded-md border border-input bg-card px-2 text-xs text-foreground disabled:opacity-60"
          >
            <option value={NO_NODE_VALUE}>{NO_NODE_LABEL}</option>
            {nodeOptions?.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={!patch || !nodeOptions || saving}
              onClick={() => {
                if (patch) onSave(patch);
                setEditing(false);
              }}
            >
              {saving ? "Guardando..." : "Guardar nodo"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="font-semibold text-foreground leading-snug">{nodeLabel(nodeName)}</p>
      )}
    </div>
  );
}
