import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, FileType, Send, Edit3, Building2, User, GraduationCap, Briefcase, Network, Layers } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { MOCK_REQUESTS, formatCop } from "@/lib/mock-data";

const DOCS = [
  { name: "Propuesta_Programa_Capacitacion_v2.pdf", size: "2.4 MB", date: "15/03/2026", type: "pdf" as const },
  { name: "Anexo_Cronograma.docx", size: "856 KB", date: "15/03/2026", type: "doc" as const },
];

export default function RequestDetail() {
  const { id } = useParams();
  const req = MOCK_REQUESTS.find((r) => r.id === id) ?? MOCK_REQUESTS[3];

  const meta = [
    { icon: Network, label: "Nodo asignado", value: req.node },
    { icon: Layers, label: "Líder de Producto", value: req.productLeader },
    { icon: Briefcase, label: "KAM responsable", value: req.kam },
    { icon: GraduationCap, label: "Profesor responsable", value: req.professor ?? "—" },
  ];

  return (
    <AppShell>
      <div className="animate-fade-in">
        <Link to="/solicitudes" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a solicitudes
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">{req.id}</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{req.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={req.status} />
              <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {req.type}
              </span>
              <span className="text-xs text-muted-foreground">
                Creada {format(new Date(req.createdAt), "d MMM yyyy", { locale: es })}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" asChild>
              <Link to={`/solicitudes/${req.id}/resumen`}><Edit3 className="h-4 w-4" /> Ver resumen</Link>
            </Button>
            <Button variant="hero">
              <Send className="h-4 w-4" /> Enviar a cliente
            </Button>
          </div>
        </div>

        {/* Meta grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-accent" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
                </div>
                <p className="mt-2 font-display text-base font-bold leading-snug text-foreground">{m.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Basic info */}
          <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">Información básica</h2>
                <p className="text-xs text-muted-foreground">Datos de la solicitud</p>
              </div>
            </div>
            <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Info label="Empresa" value={req.company} />
              <Info label="Tipo de empresa" value="Privada" />
              <Info label="Sector" value="Financiero" />
              <Info label="Solicitante" value={req.applicant} />
              <Info label="Modalidad" value="Híbrida" />
              <Info label="Participantes" value="11 - 15" />
              <Info label="Horas estimadas" value="60 horas" />
              <Info label="Servicio de alimentación" value="Sí" />
            </dl>

            {/* Documents */}
            <div className="mt-8">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Documentos de propuesta
              </h3>
              <div className="mt-3 space-y-2">
                {DOCS.map((d) => (
                  <div
                    key={d.name}
                    className="group flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-all hover:border-accent/40 hover:bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${d.type === "pdf" ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info"}`}>
                        {d.type === "pdf" ? <FileText className="h-5 w-5" /> : <FileType className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.size} · {d.date}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Descargar</Button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Cost */}
          <aside className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-gradient-navy p-6 text-white shadow-lg">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Costeo final</p>
              <p className="mt-2 text-xs text-white/70">Costo total del programa (COP)</p>
              <p className="mt-3 font-display text-4xl font-bold tracking-tight">
                {formatCop(req.totalCostCop ?? 4_000_000)}
              </p>
              <Button variant="hero" className="mt-6 w-full">
                <Send className="h-4 w-4" /> Enviar a cliente
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Personas asignadas
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  { role: "KAM", name: req.kam },
                  { role: "Líder de producto", name: req.productLeader },
                  { role: "Profesor", name: req.professor ?? "Sin asignar" },
                ].map((p) => (
                  <div key={p.role} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-xs font-bold text-white">
                      {p.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
