import { Link, useLocation } from "react-router-dom";
import { LogOut } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getNavItems, isNavItemActive } from "@/lib/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IcesiSymbol } from "@/components/IcesiLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarContentProps {
  /** Show the text labels next to the icons (always true inside the mobile drawer). */
  expanded: boolean;
  onLogout: () => void;
  /** Called after a link is followed, e.g. to close the mobile drawer. */
  onNavigate?: () => void;
}

const LABEL_TRANSITION =
  "transition-[max-width,opacity] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]";

/** Nav links, user menu and controls of the side menu; the links come from the session role. */
export function SidebarContent({ expanded, onLogout, onNavigate }: SidebarContentProps) {
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const navItems = getNavItems(user.role);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.roleLabel.slice(0, 2).toUpperCase();

  const labelClass = (maxWidth: string) =>
    cn(
      "overflow-hidden whitespace-nowrap",
      LABEL_TRANSITION,
      expanded ? `${maxWidth} opacity-100` : "max-w-0 opacity-0",
    );

  return (
    <div className="flex h-full w-full flex-col justify-between overflow-hidden py-4 select-none">
      <div className="flex w-full flex-col gap-4 px-2">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform hover:scale-105"
          title="Universidad Icesi - Solicitudes Comerciales"
          aria-label="Ir al inicio"
        >
          <IcesiSymbol size={32} color="currentColor" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-full items-center gap-3 rounded-lg px-0.5 whitespace-nowrap transition-colors hover:bg-sidebar-accent"
              title={`${user.name} (${user.roleLabel})`}
              aria-label="Menú de usuario y rol"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
                {initials}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-icesi-green ring-2 ring-sidebar" />
              </span>
              <span
                className={cn(
                  "flex flex-col items-start justify-center gap-0.5 leading-tight",
                  labelClass("max-w-[140px]"),
                )}
              >
                <span className="max-w-[140px] truncate text-xs font-bold">{user.name}</span>
                <span className="text-[10px] text-muted-foreground">{user.roleLabel}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="ml-2 w-60">
            <DropdownMenuLabel>
              <div className="text-sm font-bold text-foreground">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                Rol: {user.roleLabel}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-xs text-destructive">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="my-1 h-px w-full bg-sidebar-border" />

        <nav aria-label="Navegación principal" className="flex w-full flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item.to, pathname, search);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 w-full items-center gap-3 rounded-lg px-2.5 whitespace-nowrap transition-colors",
                  active
                    ? "bg-icesi-yellow font-bold text-black shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn("text-sm font-semibold", labelClass("max-w-[160px]"))}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex w-full flex-col gap-2.5 px-2">
        <ThemeToggle
          showLabel={expanded}
          className="h-11 w-full justify-start gap-3 whitespace-nowrap px-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        />
        <button
          type="button"
          onClick={onLogout}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 whitespace-nowrap text-sidebar-foreground/70 transition-all hover:bg-destructive/15 hover:text-destructive"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn("text-sm font-semibold", labelClass("max-w-[160px]"))}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
