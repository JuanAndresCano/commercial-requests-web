import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, FileText, PlusCircle, LogOut, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-bold text-foreground">Solicitudes</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Universidad Icesi</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", active && "text-accent")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-secondary p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-navy text-xs font-semibold text-white">
              {role.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">Usuario {role}</p>
              <p className="truncate text-xs text-muted-foreground">{role}</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Mobile top */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-brand">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-display text-sm font-bold">Solicitudes</span>
        </div>
        <Link to="/" className="text-xs text-muted-foreground">Salir</Link>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
