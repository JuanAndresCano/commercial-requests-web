/**
 * Brings back a draft saved in this device. Drafts written by older versions of the wizard may lack fields
 * that exist now (or carry ones that no longer do), so only the fields of the current form are taken, and
 * only when they have the same kind of value; everything else keeps its initial value. Nothing is invented:
 * a draft that never had a leader (or a node) comes back without one.
 */
export function restoreDraftData<T extends object>(saved: unknown, initial: T): T | null {
  if (typeof saved !== "object" || saved === null || Array.isArray(saved)) return null;
  const source = saved as Record<string, unknown>;
  const restored: Record<string, unknown> = { ...(initial as Record<string, unknown>) };
  for (const [key, initialValue] of Object.entries(initial as Record<string, unknown>)) {
    const value = source[key];
    if (value === undefined) continue;
    const sameKind = Array.isArray(initialValue) ? Array.isArray(value) : typeof value === typeof initialValue;
    if (sameKind) restored[key] = value;
  }
  return restored as T;
}
