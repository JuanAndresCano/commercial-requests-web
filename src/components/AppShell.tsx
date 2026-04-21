import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, FileText, PlusCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Inicio", icon: LayoutGrid },
  { to: "/solicitudes", label: "Solicitudes", icon: FileText },
  { to: "/solicitudes/nueva", label: "Nueva solicitud", icon: PlusCircle },
];

interface AppShellProps {
  children: React.ReactNode;
  role?: string;
}

export function AppShell({ children, role = "KAM" }: AppShellProps) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b border-border px-5">
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-foreground">Solicitudes</p>
            <p className="text-[11px] text-muted-foreground">Universidad Icesi</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
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
              {role.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">Usuario {role}</p>
              <p className="truncate text-xs text-muted-foreground">{role}</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Mobile top */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <span className="font-display text-sm font-bold">Solicitudes</span>
        <Link to="/" className="text-xs text-muted-foreground">Salir</Link>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
