import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import { MOCK_REQUESTS, STATUS_META, type RequestStatus, type RequestType, type Urgency } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const COLUMNS: RequestStatus[] = ["nueva", "lista", "borrador", "entregada"];

export default function RequestsBoard() {
  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [urgency, setUrgency] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const filtered = useMemo(() => {
    return MOCK_REQUESTS.filter((r) => {
      if (q && !`${r.title} ${r.applicant} ${r.id}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (status !== "all" && r.status !== status) return false;
      if (urgency !== "all" && r.urgency !== urgency) return false;
      if (type !== "all" && r.type !== type) return false;
      return true;
    });
  }, [q, status, urgency, type]);

  const grouped = useMemo(() => {
    const g: Record<RequestStatus, typeof MOCK_REQUESTS> = { nueva: [], lista: [], borrador: [], entregada: [] };
    filtered.forEach((r) => g[r.status].push(r));
    return g;
  }, [filtered]);

  return (
    <AppShell>
      <div className="animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Tablero</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Solicitudes</h1>
            <p className="mt-1 text-sm text-muted-foreground">{filtered.length} solicitudes encontradas</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/solicitudes/nueva"><PlusCircle className="h-4 w-4" /> Nueva solicitud</Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Busca por nombre de solicitud o solicitante..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 lg:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {COLUMNS.map((c) => <SelectItem key={c} value={c}>{STATUS_META[c].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger className="h-10 lg:w-[150px]"><SelectValue placeholder="Urgencia" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda urgencia</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-10 lg:w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Capacitación">Capacitación</SelectItem>
                <SelectItem value="Consultoría">Consultoría</SelectItem>
                <SelectItem value="Mentoría">Mentoría</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <button
              onClick={() => setView("board")}
              className={cn("rounded-md p-1.5 text-muted-foreground transition-all", view === "board" && "bg-accent/10 text-accent")}
              aria-label="Vista kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("rounded-md p-1.5 text-muted-foreground transition-all", view === "list" && "bg-accent/10 text-accent")}
              aria-label="Vista lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Board */}
        {view === "board" && (
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {COLUMNS.map((col) => {
              const meta = STATUS_META[col];
              const items = grouped[col];
              return (
                <div key={col} className="flex flex-col rounded-xl border border-border bg-secondary/30 p-3">
                  <div className="mb-3 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                      <h3 className="font-display text-sm font-bold">{meta.label}</h3>
                    </div>
                    <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    {items.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                        Sin solicitudes
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

        {/* List */}
        {view === "list" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => <RequestCard key={r.id} req={r} />)}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center">
                <SlidersHorizontal className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-display text-lg font-bold">Sin resultados</p>
                <p className="mt-1 text-sm text-muted-foreground">Intenta ajustar los filtros o la búsqueda.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
