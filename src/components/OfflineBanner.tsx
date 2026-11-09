import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

const getSnapshot = () => navigator.onLine;
// On the server (or before hydration) assume there is a connection: nothing to warn about.
const getServerSnapshot = () => true;

/**
 * Visible system status when the browser loses its connection (Nielsen 1).
 * Without it, a failed save only shows up as a generic error toast.
 */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (online) return null;
  return (
    <div
      role="status"
      className="border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
    >
      Sin conexión. Tus cambios no se guardarán hasta que vuelva internet.
    </div>
  );
}
