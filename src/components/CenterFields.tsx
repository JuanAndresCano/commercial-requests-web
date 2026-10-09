import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { centerDraftOf, centerPatchFor, hasCenterData } from "@/lib/center-fields";
import type { SetCenterPayload } from "@/lib/api/requests";

interface CenterFieldsProps {
  center?: string;
  costCenter?: string;
  /** The Product Leader (owner) types both fields; anyone else only reads them. */
  editable: boolean;
  saving?: boolean;
  /** Body of PATCH /requests/:id/center, with only the fields that changed. */
  onSave: (patch: SetCenterPayload) => void;
}

/**
 * "Centro" and "CENCO (centro de costos)" of "Equipo Asignado" (C-07), two optional free-text fields: the
 * business goes out through a center (Eduteka, OEM...) so the cost center gets loaded there; the Leader
 * types it "when it applies". The KAM sees them read-only, and nothing at all when they are empty.
 */
export function CenterFields({ center, costCenter, editable, saving = false, onSave }: CenterFieldsProps) {
  const [draft, setDraft] = useState(() => centerDraftOf({ center, costCenter }));

  // Pick up what the backend holds after a save or a refresh.
  useEffect(() => {
    setDraft(centerDraftOf({ center, costCenter }));
  }, [center, costCenter]);

  if (!editable) {
    if (!hasCenterData({ center, costCenter })) return null;
    return (
      <>
        {center?.trim() && (
          <div className="space-y-0.5 pt-2 border-t border-border dark:border-[#252838]">
            <span className="text-[11px] font-medium text-muted-foreground">Centro</span>
            <p className="font-semibold text-foreground">{center}</p>
          </div>
        )}
        {costCenter?.trim() && (
          <div className="space-y-0.5 pt-2 border-t border-border dark:border-[#252838]">
            <span className="text-[11px] font-medium text-muted-foreground">CENCO (centro de costos)</span>
            <p className="font-semibold text-foreground">{costCenter}</p>
          </div>
        )}
      </>
    );
  }

  const patch = centerPatchFor({ center, costCenter }, draft);

  return (
    <div className="space-y-2 pt-2 border-t border-border dark:border-[#252838]">
      <div className="space-y-1">
        <Label htmlFor="request-center" className="text-[11px] font-medium text-muted-foreground">
          Centro
        </Label>
        <Input
          id="request-center"
          value={draft.center}
          onChange={(e) => setDraft((d) => ({ ...d, center: e.target.value }))}
          placeholder="Ej. Eduteka, OEM (opcional)"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="request-cost-center" className="text-[11px] font-medium text-muted-foreground">
          CENCO (centro de costos)
        </Label>
        <Input
          id="request-cost-center"
          value={draft.costCenter}
          onChange={(e) => setDraft((d) => ({ ...d, costCenter: e.target.value }))}
          placeholder="Opcional"
          className="h-8 text-xs"
        />
      </div>
      <div className="flex justify-end">
        <Button size="sm" className="h-7 text-xs" disabled={!patch || saving} onClick={() => patch && onSave(patch)}>
          {saving ? "Guardando..." : "Guardar centro"}
        </Button>
      </div>
    </div>
  );
}
