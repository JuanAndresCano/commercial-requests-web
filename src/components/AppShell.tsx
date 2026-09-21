import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Menu } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { SidebarContent } from "@/components/SidebarContent";
import { IcesiLogo, IcesiCenefa } from "@/components/IcesiLogo";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

interface AppShellProps {
  children: React.ReactNode;
}

export const SIDEBAR_STORAGE_KEY = "icesi_sidebar_expanded";

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // Desktop menu: expanded/collapsed is remembered across pages and reloads.
  const [expanded, setExpanded] = usePersistentState(SIDEBAR_STORAGE_KEY, false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeRoleLabel = user.roleLabel;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-[#5454e9] selection:text-white">
      {/* Institutional Top Blue Band (Pantone 2131 C #5454e9) */}
      <div className="h-1.5 w-full bg-[#5454e9] shrink-0" />

      <div className="flex flex-1 relative">
        {/* Desktop side menu: fixed, expandable with a button, keeps its state. */}
        <aside
          id="icesi-sidebar-rail"
          aria-label="Menú lateral"
          data-expanded={expanded}
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex",
            "transition-[width] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
            expanded ? "w-64" : "w-16",
          )}
        >
          <SidebarContent expanded={expanded} onLogout={handleLogout} />
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls="icesi-sidebar-rail"
            aria-label={expanded ? "Contraer menú" : "Expandir menú"}
            title={expanded ? "Contraer menú" : "Expandir menú"}
            className="absolute -right-3 top-20 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md transition-colors hover:bg-sidebar-accent"
          >
            {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </aside>

        {/* Mobile menu: drawer that mirrors the same role-based links. */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent
            side="left"
            className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground lg:hidden"
          >
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <SheetDescription className="sr-only">Enlaces principales según tu rol</SheetDescription>
            <SidebarContent expanded onLogout={handleLogout} onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Application Container (offset by the side menu on desktop) */}
        <div
          className={cn(
            "flex-1 flex flex-col min-h-screen min-w-0 transition-[padding] duration-300",
            expanded ? "lg:pl-64" : "lg:pl-16",
          )}
        >
          {/* Top Brand Application Bar */}
          <header className="sticky top-0 z-20 border-b border-border dark:border-[#252838] bg-card/95 dark:bg-[#11121a]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 transition-colors">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              {/* Left: Mobile menu toggle + Logo + Current Context */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-md border border-border"
                  aria-label="Menú de navegación"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <Link to="/dashboard" className="flex items-center gap-3 group">
                  <IcesiLogo variant="horizontal" size="sm" withDescriptor={true} />
                  <div className="hidden sm:flex flex-col border-l border-border pl-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#5454e9] dark:text-[#865cf0]">
                      Solicitudes Comerciales
                    </span>
                    <span className="text-[10px] text-muted-foreground">Dirección de Extensión y Consultoría</span>
                  </div>
                </Link>
              </div>

              {/* Right: active role (read-only — it comes from the session) */}
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border dark:border-[#2b2d3e] bg-secondary/60 dark:bg-[#1a1c28] px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs">
                <span className="h-2 w-2 rounded-full bg-[#5454e9]" />
                <span className="truncate max-w-[140px] md:max-w-[180px]">{activeRoleLabel}</span>
              </div>
            </div>
          </header>

          {/* Sub-header visual strip in vibrant Azul Icesi #5454e9 */}
          <div className="bg-[#5454e9] text-white px-4 sm:px-6 lg:px-8 py-3 shadow-xs">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wide">
                  Dirección de Extensión y Consultoría · Solicitudes Comerciales
                </span>
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
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">{children}</main>

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
