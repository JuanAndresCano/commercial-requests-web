import { clearPersistentState } from "@/hooks/use-persistent-state";

/**
 * Board selections remembered by usePersistentState (stage card, filters, search,
 * view), plus the leftover key of the old button-driven side menu.
 */
const DASHBOARD_UI_KEYS = ["icesi_kam_dashboard_", "icesi_lp_dashboard_", "icesi_sidebar_expanded"] as const;

/**
 * Every session starts with clean boards: no stage card selected, no filters and
 * the default (Kanban) view. Selections are still remembered while the session lasts.
 */
export function resetDashboardUiState(): void {
  clearPersistentState(DASHBOARD_UI_KEYS);
}
