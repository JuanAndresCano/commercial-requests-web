import { Home, FileText, PlusCircle, Network, GraduationCap } from "@/components/icons";
import type { UserRole } from "@/context/AuthContext";

export interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

/**
 * Main-menu links each role may visit. The shell renders exactly this list, so a
 * role never sees a link to a module it cannot use.
 */
export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  // Single unified board (4 states + quick "Sin docente" filter).
  "lider-producto": [{ to: "/dashboard", label: "Solicitudes", icon: FileText }],
  "lider-nodo": [
    { to: "/dashboard", label: "Inicio", icon: Home },
    { to: "/solicitudes", label: "Solicitudes de nodo", icon: Network },
  ],
  profesor: [
    { to: "/dashboard", label: "Inicio", icon: Home },
    { to: "/solicitudes", label: "Mis propuestas", icon: GraduationCap },
  ],
  kam: [
    { to: "/dashboard", label: "Solicitudes", icon: FileText },
    { to: "/solicitudes/nueva", label: "Nueva solicitud", icon: PlusCircle },
  ],
  administrador: [{ to: "/dashboard", label: "Inicio", icon: Home }],
};

export function getNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS[role];
}

/** Whether a nav link is the current location (handles query strings and nested routes). */
export function isNavItemActive(itemTo: string, pathname: string, search: string): boolean {
  const [itemPath, itemQuery] = itemTo.split("?");

  if (itemQuery) return pathname === itemPath && search.includes(itemQuery);
  if (itemTo === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  if (itemTo === "/solicitudes/nueva") return pathname === "/solicitudes/nueva";
  if (itemTo === "/solicitudes") {
    if (pathname === "/solicitudes/nueva") return false;
    if (search.includes("filter=sin-profesor")) return false;
    return pathname.startsWith("/solicitudes");
  }
  return pathname === itemPath;
}
