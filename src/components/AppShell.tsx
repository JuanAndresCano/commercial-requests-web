import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, FileText, PlusCircle, LogOut, Layers, UserCheck, Network, GraduationCap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, UserRole, ROLE_CONFIGS } from "@/context/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AppShellProps {
  children: React.ReactNode;
  role?: string;
}

export function AppShell({ children, role: overrideRole }: AppShellProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, switchRole } = useAuth();

  const activeRoleLabel = overrideRole || user.roleLabel;
  const activeRole = user.role;

  // Role-specific navigation items
  const navItems = (() => {
    if (activeRole === "lider-producto") {
      return [
        { to: "/dashboard", label: "Inicio", icon: LayoutGrid },
        { to: "/solicitudes", label: "Solicitudes", icon: FileText },
        { to: "/solicitudes?filter=sin-profesor", label: "Asignar profesores", icon: UserCheck },
      ];
    }
    if (activeRole === "lider-nodo") {
      return [
        { to: "/dashboard", label: "Inicio", icon: LayoutGrid },
        { to: "/solicitudes", label: "Solicitudes de nodo", icon: Network },
      ];
    }
    if (activeRole === "profesor") {
      return [
        { to: "/dashboard", label: "Inicio", icon: LayoutGrid },
        { to: "/solicitudes", label: "Mis propuestas", icon: GraduationCap },
      ];
    }
    // Default: KAM
    return [
      { to: "/dashboard", label: "Inicio", icon: LayoutGrid },
      { to: "/solicitudes", label: "Solicitudes", icon: FileText },
      { to: "/solicitudes/nueva", label: "Nueva solicitud", icon: PlusCircle },
    ];
  })();

  const initials = user.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : activeRoleLabel.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-foreground">Solicitudes Comerciales</p>
            <p className="text-[11px] text-muted-foreground">Universidad Icesi</p>
          </div>
        </div>

        {/* Role switcher header badge */}
        <div className="px-3 pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/60 px-3 py-1.5 text-left text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                  <span className="truncate">{activeRoleLabel}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar rol (vista)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((rKey) => {
                const cfg = ROLE_CONFIGS[rKey];
                return (
                  <DropdownMenuItem
                    key={rKey}
                    onClick={() => switchRole(rKey)}
                    className={cn(activeRole === rKey && "bg-secondary font-medium")}
                  >
                    <span>{cfg.label}</span>
                    {activeRole === rKey && <span className="ml-auto text-xs text-accent">Activo</span>}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.to.includes("?")
                ? `${pathname}${location.search}` === item.to
                : pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2.5 px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{activeRoleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile top */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold">Solicitudes</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-foreground">
            {activeRoleLabel}
          </span>
        </div>
        <button type="button" onClick={handleLogout} className="text-xs text-muted-foreground hover:text-foreground">
          Salir
        </button>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
