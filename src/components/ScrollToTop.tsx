import { useEffect } from "react";
import { usePathname } from "@/lib/app-router";

// React Router no resetea el scroll entre rutas por defecto (es un cambio de
// contenido en la misma página, no una carga real) — si el Kanban quedó
// scrolleado hacia abajo, el detalle de la solicitud abría también scrolleado
// abajo, ocultando la cabecera, los botones de avance y cualquier aviso en la
// parte superior. Montado una sola vez en App.tsx, dentro del Router.
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
