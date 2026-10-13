import { useEffect } from "react";
import { usePathname } from "@/lib/app-router";

// Cada cambio de ruta vuelve al inicio de la página: si el Kanban quedó scrolleado hacia abajo, el detalle
// de la solicitud abría también scrolleado abajo, ocultando la cabecera, los botones de avance y cualquier
// aviso en la parte superior. Con Next.js hay que apagar además la restauración de scroll del navegador
// (history.scrollRestoration = "auto"): al volver atrás restauraba la posición vieja *después* de este
// componente (la página tiene scroll-behavior: smooth), y la pantalla anterior reaparecía scrolleada.
// Montado una sola vez en src/app/providers.tsx.
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
