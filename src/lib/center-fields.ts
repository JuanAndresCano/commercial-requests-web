import type { SetCenterPayload } from "@/lib/api/requests";

/** The two free-text fields the Product Leader types (C-07). */
export interface CenterValues {
  center?: string;
  costCenter?: string;
}

export interface CenterDraft {
  center: string;
  costCenter: string;
}

/** Initial content of the two inputs. */
export function centerDraftOf(values: CenterValues): CenterDraft {
  return { center: values.center ?? "", costCenter: values.costCenter ?? "" };
}

/** True when the request has a center or a cost center to show. */
export function hasCenterData(values: CenterValues): boolean {
  return Boolean(values.center?.trim() || values.costCenter?.trim());
}

/**
 * Body of PATCH /requests/:id/center for what was typed, or `null` when nothing changed. Only the changed
 * fields go; a field that was emptied goes as `null` so the backend clears it.
 */
export function centerPatchFor(current: CenterValues, draft: CenterDraft): SetCenterPayload | null {
  const patch: SetCenterPayload = {};
  const nextCenter = draft.center.trim();
  const nextCostCenter = draft.costCenter.trim();
  if (nextCenter !== (current.center?.trim() ?? "")) patch.center = nextCenter || null;
  if (nextCostCenter !== (current.costCenter?.trim() ?? "")) patch.costCenter = nextCostCenter || null;
  return Object.keys(patch).length > 0 ? patch : null;
}
