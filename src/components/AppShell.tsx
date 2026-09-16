import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  PlusCircle,
  LogOut,
  UserCheck,
  Network,
  GraduationCap,
  ChevronDown,
  Menu,
  X,
  RotateCcw,
} from "@/components/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth, UserRole, ROLE_CONFIGS } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IcesiLogo, IcesiSymbol, IcesiCenefa } from "@/components/IcesiLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
interface AppShellProps {
  children: React.ReactNode;
  role?: string;
}

export function AppShell({ children, role: overrideRole }: AppShellProps) {
  const location = useLocation();
  const { pathname, search } = location;
  const navigate = useNavigate();
  const { user, logout, switchRole, resetData } = useAuth();

  const handleResetData = () => {
    if (window.confirm("¿Restablecer todas las solicitudes a los datos de ejemplo? Se perderá cualquier cambio hecho en esta sesión de prueba.")) {
      resetData();
      // Los tableros guardan filtros/vista en su propio estado de React
      // (usePersistentState) que solo se relee de localStorage al montar el
      // componente — sin recargar, un filtro que ya estaba activo (ej. "Sin
      // docente") seguiría aplicado en memoria aunque los datos ya se hayan
      // restablecido. Recargar garantiza que todo arranque limpio.
      toast.success("Datos de ejemplo restablecidos");
      window.setTimeout(() => window.location.reload(), 400);
    }
  };
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeRoleLabel = overrideRole || user.roleLabel;
  const activeRole = user.role;

  // Function to accurately determine which nav item is active
  const isItemActive = (itemTo: string) => {
    const [itemPath, itemQuery] = itemTo.split("?");

    // 1. Items with query parameters (e.g. ?filter=sin-profesor)
    if (itemQuery) {
      return pathname === itemPath && search.includes(itemQuery);
    }

    // 2. Dashboard / Home
    if (itemTo === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }

    // 3. New request page
    if (itemTo === "/solicitudes/nueva") {
      return pathname === "/solicitudes/nueva";
    }

    // 4. Main Solicitudes tab
    if (itemTo === "/solicitudes") {
      if (pathname === "/solicitudes/nueva") {
        return false;
      }
      if (search.includes("filter=sin-profesor")) {
        return false;
      }
      return pathname.startsWith("/solicitudes");
    }

    return pathname === itemPath;
  };

  // Role-specific navigation items
  const navItems = (() => {
    if (activeRole === "lider-producto") {
      // Una sola vista de solicitudes (tablero unificado con los 4 estados +
      // filtro rápido "Sin docente" integrado) — ya no hay "Inicio" separado
      // del tablero ni un tablero genérico aparte para asignar docentes.
      return [
        { to: "/dashboard", label: "Solicitudes", icon: FileText },
      ];
    }
    if (activeRole === "lider-nodo") {
      return [
        { to: "/dashboard", label: "Inicio", icon: Home },
        { to: "/solicitudes", label: "Solicitudes de nodo", icon: Network },
      ];
    }
    if (activeRole === "profesor") {
      return [
        { to: "/dashboard", label: "Inicio", icon: Home },
        { to: "/solicitudes", label: "Mis propuestas", icon: GraduationCap },
      ];
    }
    // Default: KAM — una sola vista de solicitudes (KPIs + tabla, ya no hay
    // un "Inicio" separado del tablero: es la misma pantalla) + creación directa.
    return [
      { to: "/dashboard", label: "Solicitudes", icon: FileText },
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
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-[#5454e9] selection:text-white">
      {/* Institutional Top Blue Band (Pantone 2131 C #5454e9) */}
      <div className="h-1.5 w-full bg-[#5454e9] shrink-0" />

      <div className="flex flex-1 relative">
        {/* Left Navigation Rail */}
        <aside
          id="icesi-sidebar-rail"
          className="group fixed inset-y-0 left-0 z-30 hidden w-16 hover:w-64 flex-col justify-between overflow-hidden border-r border-border dark:border-[#1e202d] bg-[#090a0e] text-white py-4 lg:flex select-none transition-[width,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:shadow-2xl"
        >
          {/* Top Section: Icesi Sun Wheel Symbol & User Avatar */}
          <div className="flex flex-col gap-4 w-full px-2">
            <Link
              to="/dashboard"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform hover:scale-105"
              title="Universidad Icesi - Solicitudes Comerciales"
              aria-label="Ir al inicio"
            >
              <IcesiSymbol size={32} color="#ffffff" />
            </Link>

            {/* User Avatar with status — el nombre se revela cuando el rail
                se expande al pasar el cursor (igual al portal de estudiantes
                de Icesi: rail angosto con iconos, que se ensancha en hover
                mostrando las etiquetas completas). */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-full items-center gap-3 rounded-lg px-0.5 whitespace-nowrap hover:bg-white/5 transition-colors"
                  title={`${user.name} (${activeRoleLabel})`}
                  aria-label="Menú de usuario y rol"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e202d] border border-white/20 text-xs font-bold text-white">
                    {initials}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#4cb979] ring-2 ring-[#090a0e]" />
                  </span>
                  <span className="flex max-w-0 flex-col items-start justify-center gap-0.5 overflow-hidden opacity-0 leading-tight transition-[max-width,opacity] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:max-w-[140px] group-hover:opacity-100 group-hover:delay-75">
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">{user.name}</span>
                    <span className="text-[10px] text-zinc-400">{activeRoleLabel}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-60 ml-2">
                <DropdownMenuLabel>
                  <div className="font-bold text-foreground text-sm">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                  <div className="mt-1 inline-flex items-center gap-1 rounded bg-[#5454e9]/10 px-2 py-0.5 text-[11px] font-semibold text-[#5454e9]">
                    Rol: {activeRoleLabel}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleResetData} className="text-xs cursor-pointer">
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  Restablecer datos de ejemplo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive text-xs cursor-pointer">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Separator */}
            <div className="w-full h-px bg-white/10 my-1" />

            {/* Primary Nav Icons — misma fila fija (icono + etiqueta); la
                etiqueta queda recortada por el `overflow-hidden` del rail
                mientras esté colapsado, y aparece al expandirse. */}
            <nav className="flex flex-col gap-2 w-full">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "relative flex h-11 w-full items-center gap-3 rounded-lg px-2.5 whitespace-nowrap transition-colors",
                      active
                        ? "bg-[#e4eb60] text-black shadow-md font-bold"
                        : "text-zinc-400 hover:bg-white/10 hover:text-white"
                    )}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-[max-width,opacity] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:max-w-[160px] group-hover:opacity-100 group-hover:delay-75">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Controls of Rail (Theme Toggle, Logout) */}
          <div className="flex flex-col gap-2.5 w-full px-2">
            {/* Theme Toggle Button (Sol / Luna) */}
            <ThemeToggle
              showLabel
              className="w-full h-11 justify-start gap-3 px-2.5 whitespace-nowrap hover:bg-white/10 text-zinc-400 hover:text-white"
            />

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 whitespace-nowrap text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-[max-width,opacity] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:max-w-[160px] group-hover:opacity-100 group-hover:delay-75">
                Cerrar sesión
              </span>
            </button>
          </div>
        </aside>

        {/* Main Application Container (offset by left rail on desktop) */}
        <div className="flex-1 lg:pl-16 flex flex-col min-h-screen">
          {/* Top Brand Application Bar */}
          <header className="sticky top-0 z-20 border-b border-border dark:border-[#252838] bg-card/95 dark:bg-[#11121a]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 transition-colors">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              {/* Left: Mobile menu toggle + Logo + Current Context */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-md border border-border"
                  aria-label="Menú de navegación"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                <Link to="/dashboard" className="flex items-center gap-3 group">
                  <IcesiLogo variant="horizontal" size="sm" withDescriptor={true} />
                  <div className="hidden sm:flex flex-col border-l border-border pl-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#5454e9] dark:text-[#865cf0]">
                      Solicitudes Comerciales
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Dirección de Extensión y Consultoría
                    </span>
                  </div>
                </Link>
              </div>

              {/* Right: Role Switcher, Quick Actions & Theme Toggle */}
              <div className="flex items-center gap-2.5">
                {/* Role dropdown switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="hidden sm:flex items-center gap-2 rounded-lg border border-border dark:border-[#2b2d3e] bg-secondary/60 dark:bg-[#1a1c28] px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors shadow-xs"
                      title="Haz clic para cambiar el rol de usuario"
                    >
                      <span className="h-2 w-2 rounded-full bg-[#5454e9]" />
                      <span className="truncate max-w-[140px] md:max-w-[180px]">{activeRoleLabel}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Vista activa (simulación de rol)
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((rKey) => {
                      const cfg = ROLE_CONFIGS[rKey];
                      return (
                        <DropdownMenuItem
                          key={rKey}
                          onClick={() => switchRole(rKey)}
                          className={cn("text-xs cursor-pointer", activeRole === rKey && "bg-accent/10 font-bold text-[#5454e9]")}
                        >
                          <span>{cfg.label}</span>
                          {activeRole === rKey && <span className="ml-auto text-[10px] font-bold text-[#5454e9]">Activo</span>}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mobile drawer when open */}
            {mobileMenuOpen && (
              <div className="mt-3 pt-3 border-t border-border lg:hidden flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center justify-between px-2 py-1 text-xs">
                  <span className="text-muted-foreground">Rol activo:</span>
                  <span className="font-bold text-[#5454e9]">{activeRoleLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md text-xs font-medium border border-border",
                        isItemActive(item.to) ? "bg-[#e4eb60] text-black font-bold" : "bg-card text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <ThemeToggle variant="pill" />
                </div>
              </div>
            )}
          </header>

          {/* Sub-header visual strip in vibrant Azul Icesi #5454e9 */}
          <div className="bg-[#5454e9] text-white px-4 sm:px-6 lg:px-8 py-3 shadow-xs">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wide">Dirección de Extensión y Consultoría · Solicitudes Comerciales</span>
                <span className="hidden md:inline-block opacity-70">|</span>
                <span className="hidden md:inline-block opacity-90">
                  {activeRoleLabel} — {user.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <IcesiCenefa barsCount={16} height={7} color="#ffffff" className="opacity-60 hidden sm:flex" />
                <span className="font-semibold bg-white/20 px-2 py-0.5 rounded text-[11px]">
                  Llega más lejos · icesi.edu.co
                </span>
              </div>
            </div>
          </div>

          {/* Page Body */}
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {children}
          </main>

          {/* Official Footer with Brand Coordinates */}
          <footer className="border-t border-border dark:border-[#252838] bg-card dark:bg-[#0c0d12] mt-auto py-6 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground transition-colors">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <IcesiLogo variant="horizontal" size="sm" colorScheme="auto" />
                <div className="h-4 w-px bg-border hidden sm:block" />
                <p className="text-[11px]">
                  Universidad Icesi, Calle 18 No. 122–135, Cali - Colombia · Tel: +57 (602) 555 2334
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <a
                  href="https://www.icesi.edu.co"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#5454e9] dark:text-[#865cf0] font-semibold hover:underline"
                >
                  icesi.edu.co
                </a>
                <span>© {new Date().getFullYear()} Universidad Icesi</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
