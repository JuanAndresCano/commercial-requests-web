import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, FileType, Send, Edit3 } from "lucide-react";
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
    { label: "Nodo asignado", value: req.node },
    { label: "Líder de Producto", value: req.productLeader },
    { label: "KAM responsable", value: req.kam },
    { label: "Profesor", value: req.professor ?? "Sin asignar" },
  ];

  return (
    <AppShell>
      <div>
        <Link to="/solicitudes" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a solicitudes
        </Link>

        {/* Header */}
        <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-card p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-muted-foreground">{req.id}</p>
            <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight">{req.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={req.status} />
              <span className="rounded border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
            <Button>
              <Send className="h-4 w-4" /> Enviar a cliente
            </Button>
          </div>
        </div>

        {/* Meta grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map((m) => (
            <div key={m.label} className="rounded-md border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Basic info */}
          <section className="lg:col-span-2 rounded-md border border-border bg-card p-5">
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-base font-bold">Información básica</h2>
              <p className="text-xs text-muted-foreground">Datos de la solicitud</p>
            </div>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
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
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Documentos de propuesta
              </h3>
              <div className="mt-2 space-y-2">
                {DOCS.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between rounded-md border border-border bg-background p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary text-muted-foreground">
                        {d.type === "pdf" ? <FileText className="h-4 w-4" /> : <FileType className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.name}</p>
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
          <aside className="space-y-4">
            <div className="rounded-md border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Costeo final</p>
              <p className="mt-1 text-xs text-muted-foreground">Costo total del programa (COP)</p>
              <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
                {formatCop(req.totalCostCop ?? 4_000_000)}
              </p>
              <Button className="mt-4 w-full">
                <Send className="h-4 w-4" /> Enviar a cliente
              </Button>
            </div>

            <div className="rounded-md border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Personas asignadas
              </h3>
              <div className="mt-3 space-y-2.5">
                {[
                  { role: "KAM", name: req.kam },
                  { role: "Líder de producto", name: req.productLeader },
                  { role: "Profesor", name: req.professor ?? "Sin asignar" },
                ].map((p) => (
                  <div key={p.role} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                      {p.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
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
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
