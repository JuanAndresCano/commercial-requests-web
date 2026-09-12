import { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List, PlusCircle, UserCheck, Layers, Filter, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import { STATUS_META, REQUEST_TYPES, type RequestStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { IcesiCenefa } from "@/components/IcesiLogo";

const COLUMNS: RequestStatus[] = ["nueva", "en-experto", "en-costeo", "entregada"];

export default function RequestsBoard() {
  const [params, setParams] = useSearchParams();
  const { requests, user } = useAuth();
  const role = user.role;

  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [urgency, setUrgency] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "mine" | "sin-profesor">(() => {
    const f = params.get("filter");
    if (f === "sin-profesor") return "sin-profesor";
    if (role === "lider-producto") return "mine";
    return "all";
  });

  useEffect(() => {
    const f = params.get("filter");
    if (f === "sin-profesor") {
      setRoleFilter("sin-profesor");
    }
  }, [params]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (q && !`${r.title} ${r.applicant} ${r.id} ${r.company}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (status !== "all" && r.status !== status) return false;
      if (urgency !== "all" && r.urgency !== urgency) return false;
      if (type !== "all" && r.type !== type) return false;

      if (roleFilter === "mine") {
        if (role === "lider-producto" && r.productLeader !== user.name) return false;
        if (role === "kam" && r.kam !== user.name) return false;
        if (role === "profesor" && r.professor !== user.name) return false;
      }
      if (roleFilter === "sin-profesor" && (r.professor || r.status === "entregada")) {
        return false;
      }

      return true;
    });
  }, [requests, q, status, urgency, type, roleFilter, role, user.name]);

  const grouped = useMemo(() => {
    const g: Record<RequestStatus, typeof requests> = {
      nueva: [],
      "en-experto": [],
      "en-costeo": [],
      entregada: [],
    };
    filtered.forEach((r) => {
      if (g[r.status]) {
        g[r.status].push(r);
      }
    });
    return g;
  }, [filtered]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-sans">
                Tablero de Solicitudes
              </h1>
              <span className="rounded bg-[#5454e9]/10 px-2.5 py-0.5 text-xs font-bold text-[#5454e9] dark:text-[#865cf0]">
                {user.roleLabel}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "solicitud encontrada" : "solicitudes encontradas"} en el flujo comercial
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {role === "lider-producto" && (
              <Button
                variant={roleFilter === "sin-profesor" ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter(roleFilter === "sin-profesor" ? "all" : "sin-profesor")}
                className={cn(
                  "text-xs font-semibold h-9",
                  roleFilter === "sin-profesor"
                    ? "bg-[#e9683b] hover:bg-[#d85c32] text-white"
                    : "border-border dark:border-[#2b2d3d]"
                )}
              >
                <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                {roleFilter === "sin-profesor" ? "Mostrando sin docente" : "Pendientes de docente"}
              </Button>
            )}
            <Button asChild size="sm" className="bg-[#5454e9] hover:bg-[#4343d3] text-white text-xs font-bold h-9">
              <Link to="/solicitudes/nueva" className="gap-1.5">
                <PlusCircle className="h-3.5 w-3.5" /> Nueva solicitud
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Role Scope Selector */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border dark:border-[#252838] pb-3">
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              roleFilter === "all"
                ? "bg-[#5454e9] text-white shadow-xs"
                : "bg-secondary dark:bg-[#1a1c28] text-muted-foreground hover:text-foreground"
            )}
          >
            Todas ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("mine")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              roleFilter === "mine"
                ? "bg-[#5454e9] text-white shadow-xs"
                : "bg-secondary dark:bg-[#1a1c28] text-muted-foreground hover:text-foreground"
            )}
          >
            Asignadas a mi rol ({requests.filter((r) => {
              if (role === "lider-producto") return r.productLeader === user.name;
              if (role === "kam") return r.kam === user.name;
              if (role === "profesor") return r.professor === user.name;
              return true;
            }).length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("sin-profesor")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              roleFilter === "sin-profesor"
                ? "bg-[#e9683b] text-white shadow-xs"
                : "bg-secondary dark:bg-[#1a1c28] text-muted-foreground hover:text-foreground"
            )}
          >
            Sin profesor asignado ({requests.filter((r) => !r.professor && r.status !== "entregada").length})
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col gap-2 rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] p-3 lg:flex-row lg:items-center shadow-xs">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, empresa, líder o ID..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 h-9 text-xs border-border dark:border-[#2b2d3d] bg-background dark:bg-[#0e0f14] focus-visible:ring-[#5454e9]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="lg:w-[170px] h-9 text-xs border-border dark:border-[#2b2d3d] bg-background dark:bg-[#0e0f14]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {COLUMNS.map((c) => (
                  <SelectItem key={c} value={c}>{STATUS_META[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger className="lg:w-[140px] h-9 text-xs border-border dark:border-[#2b2d3d] bg-background dark:bg-[#0e0f14]">
                <SelectValue placeholder="Urgencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda urgencia</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="lg:w-[170px] h-9 text-xs border-border dark:border-[#2b2d3d] bg-background dark:bg-[#0e0f14]">
                <SelectValue placeholder="Tipo de servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {REQUEST_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border border-border dark:border-[#2b2d3d] p-0.5 bg-background dark:bg-[#0e0f14]">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === "board" ? "bg-[#5454e9] text-white" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Vista kanban"
              title="Vista tablero kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === "list" ? "bg-[#5454e9] text-white" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Vista lista"
              title="Vista cuadrícula"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Board View */}
        {view === "board" && (
          <div className="grid gap-3.5 lg:grid-cols-4">
            {COLUMNS.map((col) => {
              const meta = STATUS_META[col];
              const items = grouped[col] || [];
              return (
                <div
                  key={col}
                  className="flex flex-col rounded-xl border border-border dark:border-[#222434] bg-secondary/30 dark:bg-[#0f1017] p-2.5"
                >
                  <div className="mb-2.5 flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {meta.label}
                      </h3>
                    </div>
                    <span className="rounded-full bg-card dark:bg-[#1a1c28] border border-border dark:border-[#252838] px-2 py-0.5 text-[11px] font-bold text-foreground">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2.5">
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border dark:border-[#252838] p-6 text-center text-xs text-muted-foreground">
                        Sin solicitudes en esta fase
                      </div>
                    ) : (
                      items.map((r) => <RequestCard key={r.id} req={r} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List / Grid View */}
        {view === "list" && (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => <RequestCard key={r.id} req={r} />)}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-border dark:border-[#252838] p-12 text-center">
                <SlidersHorizontal className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-bold text-foreground">Sin resultados para esta búsqueda</p>
                <p className="mt-1 text-xs text-muted-foreground">Ajusta los filtros de estado o el término de búsqueda.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
