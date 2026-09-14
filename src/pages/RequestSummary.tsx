import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, Printer } from "@/components/icons";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";

const SECTIONS = [
  {
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
    title: "Formación previa",
    fields: [
      ["¿Han tenido formación previa?", "No"],
      ["Descripción", "—"],
      ["Empresa", "—"],
      ["Fecha", "—"],
    ],
  },
  {
    title: "Observaciones",
    fields: [["¿Alguna otra observación?", "—"]],
  },
];

export default function RequestSummary() {
  const { id } = useParams();
  const { requests } = useAuth();
  const req = requests.find((r) => r.id === id) ?? requests[0];

  return (
    <AppShell>
      <div>
        <Link to={`/solicitudes/${req.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al detalle
        </Link>

        {/* Header */}
        <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-card p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{req.id}</p>
            <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight">{req.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={req.status} />
              <span className="rounded border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {req.type}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline"><Printer className="h-4 w-4" /> Imprimir</Button>
            <Button><Edit3 className="h-4 w-4" /> Editar</Button>
          </div>
        </div>

        {/* Admin summary */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Nodo", req.node],
            ["Líder de Producto", req.productLeader],
            ["KAM responsable", req.kam],
            ["Profesor", req.professor ?? "Sin asignar"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="mt-4 space-y-4">
          {SECTIONS.map((s) => (
            <section key={s.title} className="rounded-md border border-border bg-card p-5">
              <h2 className="border-b border-border pb-3 font-display text-base font-bold">{s.title}</h2>
              <dl className="mt-4 divide-y divide-border">
                {s.fields.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-medium text-muted-foreground sm:col-span-1">
                      {label}
                    </dt>
                    <dd className="text-sm text-foreground sm:col-span-2">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
