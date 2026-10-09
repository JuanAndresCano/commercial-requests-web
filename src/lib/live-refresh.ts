// The prototype shared one in-memory state, so a Product Leader saw a KAM's change at
// once. With a real backend each browser only learns about it when it asks again.
// Boards and the request detail re-fetch on this interval (React Query pauses it while
// the tab is hidden) so a delivery, a return with observations or an assignment shows up
// for the other role without a manual reload. This slow polling is the safety net: the
// instant updates come from the real-time channel (use-realtime.ts), which also polls
// every few seconds while its connection is down.
export const LIVE_REFRESH_MS = 20_000;
