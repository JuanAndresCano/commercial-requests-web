import {
  Home,
  FileText,
  PlusCircle,
  Network,
  Building2,
  TrendingUp,
  Users,
  FileSpreadsheet,
  UserCheck,
  LayoutGrid,
} from "@/components/icons";
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
  kam: [
    { to: "/dashboard", label: "Solicitudes", icon: FileText },
    { to: "/solicitudes/nueva", label: "Nueva solicitud", icon: PlusCircle },
  ],
  administrador: [
    { to: "/admin/dashboard", label: "Resumen Ejecutivo", icon: TrendingUp },
    { to: "/admin/kams", label: "Rendimiento KAMs", icon: Users },
    { to: "/admin/nodos", label: "Nodos y Portafolio", icon: Network },
    { to: "/admin/empresas", label: "Inteligencia Empresas", icon: Building2 },
    { to: "/admin/segmentos", label: "Segmentos", icon: LayoutGrid },
    { to: "/admin/solicitudes", label: "Gestión Solicitudes", icon: FileSpreadsheet },
    { to: "/admin/usuarios", label: "Gestión de Accesos", icon: UserCheck },
  ],
};

export function getNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS[role] ?? [];
}

/** Whether a nav link is the current location (handles query strings and nested routes). */
export function isNavItemActive(itemTo: string, pathname: string, search: string): boolean {
  const [itemPath, itemQuery] = itemTo.split("?");

  if (itemQuery) return pathname === itemPath && search.includes(itemQuery);

  // Admin submodules
  if (itemTo === "/admin/dashboard" || itemTo === "/admin/resumen") {
    if (pathname === "/admin/dashboard" || pathname === "/admin/resumen") return true;
    if ((pathname === "/dashboard" || pathname === "/") && !search.includes("tab=empresas")) {
      return true;
    }
    return false;
  }
  if (itemTo === "/admin/empresas") {
    if (pathname === "/admin/empresas" || pathname.startsWith("/admin/empresas/")) return true;
    if (pathname === "/dashboard" && search.includes("tab=empresas")) return true;
    return false;
  }
  if (itemTo === "/admin/segmentos") {
    return pathname === "/admin/segmentos" || pathname.startsWith("/admin/segmentos/");
  }
  if (itemTo === "/admin/kams") {
    return pathname === "/admin/kams" || pathname.startsWith("/admin/kams/");
  }
  if (itemTo === "/admin/nodos") {
    return pathname === "/admin/nodos" || pathname.startsWith("/admin/nodos/");
  }
  if (itemTo === "/admin/solicitudes") {
    return pathname === "/admin/solicitudes" || pathname.startsWith("/admin/solicitudes/");
  }
  if (itemTo === "/admin/usuarios") {
    return pathname === "/admin/usuarios" || pathname.startsWith("/admin/usuarios/");
  }

  // General dashboard
  if (itemTo === "/dashboard") {
    if (search.includes("tab=empresas")) return false;
    return pathname === "/dashboard" || pathname === "/";
  }
  if (itemTo === "/solicitudes/nueva") return pathname === "/solicitudes/nueva";
  if (itemTo === "/solicitudes") {
    if (pathname === "/solicitudes/nueva") return false;
    if (search.includes("filter=sin-profesor")) return false;
    return pathname.startsWith("/solicitudes");
  }

  return pathname === itemPath;
}
