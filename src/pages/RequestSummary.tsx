import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, Printer, Building2, User, ClipboardList, GraduationCap, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { MOCK_REQUESTS } from "@/lib/mock-data";

const SECTIONS = [
  {
    icon: Building2,
    title: "Empresa",
    fields: [
      ["Nombre de la empresa", "Razón social S.A."],
      ["La empresa es", "Privada"],
      ["Sector o industria", "Financiero"],
      ["Descripción breve", "Descripción breve de la empresa"],
      ["Página web", "www.pagina.com"],
    ],
  },
  {
    icon: User,
    title: "Contacto",
    fields: [
      ["Nombre", "Juan Pérez"],
      ["Cargo", "Jefe de talento humano"],
      ["Teléfono", "+57 123 456 7890"],
      ["Correo institucional", "name@email.com"],
      ["Área o dependencia", "Talento humano"],
    ],
  },
  {
    icon: ClipboardList,
    title: "Requerimiento",
    fields: [
      ["Tipo de requerimiento", "Capacitación"],
      ["Nombre para la solicitud", "Nombre del programa"],
      ["Necesidad o problema", "—"],
      ["Horas de dedicación", "Más de 60"],
      ["Modalidad", "Híbrida"],
      ["Servicio de alimentación", "Sí"],
      ["Resultados esperados", "—"],
      ["Cómo se medirá el éxito", "—"],
      ["Competencias a fortalecer", "—"],
      ["Número de participantes", "1 - 5"],
      ["Área de los participantes", "Comercial"],
    ],
  },
  {
    icon: GraduationCap,
    title: "Formación previa",
    fields: [
      ["¿Han tenido formación previa?", "No"],
      ["Descripción", "—"],
      ["Empresa", "—"],
      ["Fecha", "—"],
    ],
  },
  {
    icon: MessageSquare,
    title: "Observaciones",
    fields: [["¿Alguna otra observación?", "—"]],
  },
];

export default function RequestSummary() {
  const { id } = useParams();
  const req = MOCK_REQUESTS.find((r) => r.id === id) ?? MOCK_REQUESTS[0];

  return (
    <AppShell>
      <div className="animate-fade-in">
        <Link to={`/solicitudes/${req.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al detalle
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">{req.id}</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{req.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={req.status} />
              <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {req.type}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline"><Printer className="h-4 w-4" /> Imprimir</Button>
            <Button variant="hero"><Edit3 className="h-4 w-4" /> Editar</Button>
          </div>
        </div>

        {/* Admin summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Nodo", req.node],
            ["Líder de Producto", req.productLeader],
            ["KAM responsable", req.kam],
            ["Profesor", req.professor ?? "Sin asignar"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-2 font-display text-sm font-bold leading-snug text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="mt-6 space-y-6">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <section
                key={s.title}
                style={{ animationDelay: `${i * 60}ms` }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8 animate-fade-in"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="font-display text-lg font-bold">{s.title}</h2>
                </div>
                <dl className="mt-5 divide-y divide-border">
                  {s.fields.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-1">
                        {label}
                      </dt>
                      <dd className="text-sm font-medium text-foreground sm:col-span-2">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
