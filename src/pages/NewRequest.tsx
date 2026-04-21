import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Save, Send, Check, Building2, User, Sparkles,
  ClipboardList, GraduationCap, MessageSquare, CheckCircle2, X, Bell, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { KAMS, NODES, PRODUCT_LEADERS } from "@/lib/mock-data";

const STEPS = [
  { id: 1, title: "Empresa", icon: Building2 },
  { id: 2, title: "Contacto", icon: User },
  { id: 3, title: "Requerimiento", icon: ClipboardList },
  { id: 4, title: "Formación previa", icon: GraduationCap },
  { id: 5, title: "Observaciones", icon: MessageSquare },
];

type FormData = Record<string, string>;

export default function NewRequest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>({});
  const [submitted, setSubmitted] = useState<null | "draft" | "sent">(null);

  const update = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));
  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  if (submitted) return <SuccessScreen kind={submitted} onClose={() => navigate("/solicitudes")} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Ingresar solicitud
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-sm font-bold">Nueva solicitud</span>
          </div>
          <Link to="/dashboard" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Stepper */}
        <ol className="mb-10 flex flex-wrap items-center gap-2 sm:gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <li key={s.id} className="flex flex-1 items-center min-w-fit">
                <button
                  type="button"
                  onClick={() => s.id < step && setStep(s.id)}
                  className="flex items-center gap-3"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                      done && "border-accent bg-accent text-white",
                      active && "border-accent bg-accent/10 text-accent shadow-glow",
                      !done && !active && "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span
                    className={cn(
                      "hidden text-sm font-semibold transition-colors sm:block",
                      active ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.title}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className={cn("mx-3 hidden h-px flex-1 sm:block", done ? "bg-accent" : "bg-border")} />
                )}
              </li>
            );
          })}
        </ol>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10 animate-fade-in">
          {step === 1 && <Step1 data={data} update={update} />}
          {step === 2 && <Step2 data={data} update={update} />}
          {step === 3 && <Step3 data={data} update={update} />}
          {step === 4 && <Step4 data={data} update={update} />}
          {step === 5 && <Step5 data={data} update={update} />}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
            {step === 5 && (
              <Button variant="outline" onClick={() => setSubmitted("draft")}>
                <Save className="h-4 w-4" />
                Guardar borrador
              </Button>
            )}
            {step < 5 ? (
              <Button variant="hero" onClick={next}>
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="hero" onClick={() => setSubmitted("sent")}>
                <Send className="h-4 w-4" />
                Enviar solicitud
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* -------------- Steps -------------- */

function SectionHeader({ title, description, icon: Icon }: { title: string; description: string; icon: any }) {
  return (
    <div className="mb-8 flex items-start gap-4 border-b border-border pb-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function RadioGroup({
  options, value, onChange, columns = 2,
}: { options: string[]; value?: string; onChange: (v: string) => void; columns?: number }) {
  return (
    <div className={cn("grid gap-2", columns === 2 ? "sm:grid-cols-2" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4")}>
      {options.map((o) => {
        const sel = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all",
              sel
                ? "border-accent bg-accent/5 text-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                sel ? "border-accent bg-accent" : "border-border"
              )}
            >
              {sel && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Step1({ data, update }: { data: FormData; update: (k: string, v: string) => void }) {
  return (
    <div>
      <SectionHeader title="Empresa" description="Información del cliente que solicita el servicio." icon={Building2} />
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Nombre del KAM" required>
          <Select value={data.kam} onValueChange={(v) => update("kam", v)}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Seleccionar KAM" /></SelectTrigger>
            <SelectContent>{KAMS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Nombre de la empresa" required>
          <Input className="h-11" placeholder="Buscar empresa" value={data.empresa ?? ""} onChange={(e) => update("empresa", e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Descripción breve de la empresa" required>
            <Textarea rows={3} placeholder="Descripción breve" value={data.descripcion ?? ""} onChange={(e) => update("descripcion", e.target.value)} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="La empresa es" required>
            <RadioGroup
              options={["Pública", "Privada", "Mixta", "Sin ánimo de lucro"]}
              value={data.tipoEmpresa}
              onChange={(v) => update("tipoEmpresa", v)}
              columns={4}
            />
          </Field>
        </div>
        <Field label="Sector o industria">
          <Input className="h-11" placeholder="Ej. Financiero" value={data.sector ?? ""} onChange={(e) => update("sector", e.target.value)} />
        </Field>
        <Field label="Página web">
          <Input className="h-11" placeholder="https://" value={data.web ?? ""} onChange={(e) => update("web", e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Asignar nodo" required>
            <Select value={data.nodo} onValueChange={(v) => update("nodo", v)}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Selecciona un nodo" /></SelectTrigger>
              <SelectContent>{NODES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Nombre líder de producto" required>
            <Select value={data.ldp} onValueChange={(v) => update("ldp", v)}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Seleccionar líder de producto" /></SelectTrigger>
              <SelectContent>{PRODUCT_LEADERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    </div>
  );
}

function Step2({ data, update }: { data: FormData; update: (k: string, v: string) => void }) {
  return (
    <div>
      <SectionHeader title="Contacto" description="Datos de la persona que realiza la solicitud." icon={User} />
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Nombre" required>
          <Input className="h-11" placeholder="Ingrese nombre" value={data.contactoNombre ?? ""} onChange={(e) => update("contactoNombre", e.target.value)} />
        </Field>
        <Field label="Teléfono" required>
          <Input className="h-11" placeholder="Ingrese teléfono" value={data.telefono ?? ""} onChange={(e) => update("telefono", e.target.value)} />
        </Field>
        <Field label="Correo institucional" required>
          <Input className="h-11" type="email" placeholder="nombre@empresa.com" value={data.correo ?? ""} onChange={(e) => update("correo", e.target.value)} />
        </Field>
        <Field label="Cargo">
          <Input className="h-11" placeholder="Ingrese cargo" value={data.cargo ?? ""} onChange={(e) => update("cargo", e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Área o dependencia">
            <Input className="h-11" placeholder="Ingrese área" value={data.area ?? ""} onChange={(e) => update("area", e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Step3({ data, update }: { data: FormData; update: (k: string, v: string) => void }) {
  return (
    <div>
      <SectionHeader title="Requerimiento" description="Detalles del servicio solicitado." icon={ClipboardList} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Tipo de requerimiento" required>
            <RadioGroup
              options={["Capacitación", "Consultoría", "Mentoría"]}
              value={data.tipoReq}
              onChange={(v) => update("tipoReq", v)}
              columns={3}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Número de participantes" required>
            <RadioGroup
              options={["1 - 5", "6 - 10", "11 - 15", "15 - 20", "20 - 25", "Otro"]}
              value={data.participantes}
              onChange={(v) => update("participantes", v)}
              columns={3}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Nombre para la solicitud" required>
            <Input className="h-11" placeholder="Ej. Capacitación interna - Marketing" value={data.nombreReq ?? ""} onChange={(e) => update("nombreReq", e.target.value)} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="¿Cuál es la necesidad o problema que motiva esta solicitud?">
            <Textarea rows={3} placeholder="Ingrese información" value={data.necesidad ?? ""} onChange={(e) => update("necesidad", e.target.value)} />
          </Field>
        </div>
        <Field label="Horas estimadas" hint="Ingrese solo números">
          <Input className="h-11" type="number" placeholder="0" value={data.horas ?? ""} onChange={(e) => update("horas", e.target.value)} />
        </Field>
        <Field label="Servicio de alimentación">
          <RadioGroup options={["Sí", "No"]} value={data.alimentacion} onChange={(v) => update("alimentacion", v)} columns={2} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Modalidad del programa">
            <RadioGroup
              options={["Virtual", "Presencial en Icesi", "Presencial en cliente", "Híbrida"]}
              value={data.modalidad}
              onChange={(v) => update("modalidad", v)}
              columns={2}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="¿Qué resultados espera lograr al finalizar?">
            <Textarea rows={2} value={data.resultados ?? ""} onChange={(e) => update("resultados", e.target.value)} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="¿Cómo se medirá el éxito del proceso?">
            <Textarea rows={2} value={data.exito ?? ""} onChange={(e) => update("exito", e.target.value)} />
          </Field>
        </div>
        <Field label="Competencias a fortalecer">
          <Input className="h-11" value={data.competencias ?? ""} onChange={(e) => update("competencias", e.target.value)} />
        </Field>
        <Field label="Área de los participantes">
          <Input className="h-11" value={data.areaParticipantes ?? ""} onChange={(e) => update("areaParticipantes", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Step4({ data, update }: { data: FormData; update: (k: string, v: string) => void }) {
  return (
    <div>
      <SectionHeader title="Formación previa" description="Información sobre formación recibida anteriormente." icon={GraduationCap} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="¿Han tenido formación previa?">
            <RadioGroup options={["Sí", "No"]} value={data.formacionPrevia} onChange={(v) => update("formacionPrevia", v)} columns={2} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Descripción de la formación">
            <Textarea rows={3} placeholder="Ingrese nombre del programa" value={data.descFormacion ?? ""} onChange={(e) => update("descFormacion", e.target.value)} />
          </Field>
        </div>
        <Field label="Empresa que dictó la formación">
          <Input className="h-11" value={data.empresaPrevia ?? ""} onChange={(e) => update("empresaPrevia", e.target.value)} />
        </Field>
        <Field label="Fecha">
          <Input className="h-11" type="date" value={data.fechaPrevia ?? ""} onChange={(e) => update("fechaPrevia", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Step5({ data, update }: { data: FormData; update: (k: string, v: string) => void }) {
  return (
    <div>
      <SectionHeader title="Observaciones" description="Información adicional relevante para la solicitud." icon={MessageSquare} />
      <Field label="¿Alguna otra observación?">
        <Textarea rows={6} placeholder="Ingrese información" value={data.observaciones ?? ""} onChange={(e) => update("observaciones", e.target.value)} />
      </Field>
    </div>
  );
}

/* -------------- Success -------------- */

function SuccessScreen({ kind, onClose }: { kind: "draft" | "sent"; onClose: () => void }) {
  const isDraft = kind === "draft";
  return (
    <div className="relative min-h-screen bg-hero">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.3] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
        <div className="w-full animate-scale-in rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand shadow-glow">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            {isDraft ? "Solicitud guardada" : "Solicitud creada"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isDraft
              ? "Tu borrador fue guardado. Puedes continuar editándolo más tarde."
              : "Tu solicitud fue enviada correctamente al sistema."}
          </p>

          {!isDraft && (
            <div className="mt-8 space-y-3 text-left">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4">
                <Calendar className="h-5 w-5 shrink-0 text-accent" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Fecha límite calculada</p>
                  <p className="text-xs text-muted-foreground">El sistema asignó la fecha límite para cambio de estado.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4">
                <Bell className="h-5 w-5 shrink-0 text-accent" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Alerta enviada al LDP</p>
                  <p className="text-xs text-muted-foreground">El líder de producto fue notificado.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Button variant="outline" asChild><Link to="/dashboard">Ir al inicio</Link></Button>
            <Button variant="hero" onClick={onClose}>Ver solicitudes</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
