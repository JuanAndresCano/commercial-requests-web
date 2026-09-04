import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Save, Send, Check, Building2, User,
  ClipboardList, GraduationCap, MessageSquare, CheckCircle2, X, Bell, Calendar,
  Search, Plus, Trash2, UploadCloud, FileText, CheckCircle, AlertCircle, Info, Sparkles,
  ChevronDown, ChevronUp, SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  KAMS,
  NODES,
  PRODUCT_LEADERS,
  NODE_DEFAULT_LEADERS,
  REQUEST_TYPES,
  MOCK_COMPANIES,
  type RequestType,
  type CompanyRecord,
} from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const STEPS = [
  { id: 1, title: "Empresa", icon: Building2 },
  { id: 2, title: "Contacto", icon: User },
  { id: 3, title: "Requerimiento", icon: ClipboardList },
  { id: 4, title: "Formación previa", icon: GraduationCap },
  { id: 5, title: "Observaciones y Documentos", icon: MessageSquare },
];

export interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface RequestFormData {
  // Paso 1 - Datos de la Empresa
  kam: string;
  nit: string;
  empresaNombre: string;
  direccion: string;
  telefonoEmpresa: string;
  correoEmpresa: string;
  ciiuPrincipal: string; // 4 dígitos obligatorios
  ciiuPrincipalDesc: string;
  ciiusSecundarios: string[]; // códigos adicionales opcionales
  tipoEmpresa: string;
  descripcion: string;
  web: string;

  // Paso 2 - Contacto del Cliente
  contactoNombre: string;
  telefono: string;
  telefonoSecundario: string; // opcional
  correo: string;
  correoAlternativo: string; // opcional
  cargo: string;
  area: string;

  // Paso 3 - Requerimiento del Servicio
  nodo: string; // Obligatorio, los 5 nodos
  ldp: string; // Líder de producto asignado
  nombreReq: string; // Obligatorio
  tipoReq: RequestType;
  tipoReqOtro: string; // Obligatorio condicional si tipoReq === 'Otro'
  participantes: string;
  horas: string; // Estrictamente opcional
  modalidad: string; // Estrictamente opcional
  alimentacion: string; // Estrictamente opcional
  necesidad: string; // Opcional diagnóstico
  competencias: string; // Opcional diagnóstico
  exito: string; // Opcional diagnóstico
  resultados: string; // Opcional diagnóstico
  areaParticipantes: string; // Opcional diagnóstico

  // Paso 4 - Formación Previa
  formacionPrevia: "Sí" | "No";
  descFormacion: string;
  empresaPrevia: string;
  fechaPrevia: string;

  // Paso 5 - Observaciones y Documentos
  observaciones: string;
  archivos: AttachedFile[]; // 100% opcional
}

export default function NewRequest() {
  const navigate = useNavigate();
  const { addRequest, user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState<null | "draft" | "sent">(null);

  const [data, setData] = useState<RequestFormData>({
    kam: user.role === "kam" ? user.name : (KAMS[0] || "Andrea Martínez"),
    nit: "",
    empresaNombre: "",
    direccion: "",
    telefonoEmpresa: "",
    correoEmpresa: "",
    ciiuPrincipal: "",
    ciiuPrincipalDesc: "",
    ciiusSecundarios: [],
    tipoEmpresa: "Privada",
    descripcion: "",
    web: "",

    contactoNombre: "",
    telefono: "",
    telefonoSecundario: "",
    correo: "",
    correoAlternativo: "",
    cargo: "",
    area: "",

    nodo: "",
    ldp: "",
    nombreReq: "",
    tipoReq: "Capacitación",
    tipoReqOtro: "",
    participantes: "11 - 15",
    horas: "",
    modalidad: "",
    alimentacion: "",
    necesidad: "",
    competencias: "",
    exito: "",
    resultados: "",
    areaParticipantes: "",

    formacionPrevia: "No",
    descFormacion: "",
    empresaPrevia: "",
    fechaPrevia: "",

    observaciones: "",
    archivos: [],
  });

  const update = <K extends keyof RequestFormData>(key: K, value: RequestFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = (kind: "draft" | "sent") => {
    // Validar requerimiento mínimo si es enviado
    if (kind === "sent") {
      if (!data.empresaNombre.trim()) {
        toast.error("Por favor ingresa o busca la Razón Social de la empresa en el Paso 1.");
        setStep(1);
        return;
      }
      if (!data.ciiuPrincipal.trim() || data.ciiuPrincipal.trim().length !== 4) {
        toast.error("El Código CIIU principal de 4 dígitos es obligatorio en el Paso 1.");
        setStep(1);
        return;
      }
      if (!data.contactoNombre.trim()) {
        toast.error("Por favor completa el nombre del contacto en el Paso 2.");
        setStep(2);
        return;
      }
      if (!data.nodo) {
        toast.error("El Nodo Asignado es obligatorio en el Paso 3.");
        setStep(3);
        return;
      }
      if (data.tipoReq === "Otro" && !data.tipoReqOtro.trim()) {
        toast.error("Por favor especifica el tipo de requerimiento en el Paso 3.");
        setStep(3);
        return;
      }
    }

    const finalTitle = data.nombreReq.trim()
      ? data.nombreReq.trim()
      : `${data.tipoReq === "Otro" && data.tipoReqOtro ? data.tipoReqOtro : data.tipoReq} - ${data.empresaNombre || "Empresa Aliada"}`;

    addRequest({
      title: finalTitle,
      applicant: data.contactoNombre.trim() || "Contacto Principal",
      type: data.tipoReq,
      status: kind === "draft" ? "borrador" : "nueva",
      urgency: "media",
      company: data.empresaNombre.trim() || "Empresa Aliada",
      node: data.nodo || NODES[1],
      productLeader: data.ldp || (data.nodo ? NODE_DEFAULT_LEADERS[data.nodo] : "") || "Por definir",
      kam: user.role === "kam" ? user.name : (data.kam || "Andrea Martínez"),
      totalCostCop: 4500000,
    });

    setSubmitted(kind);
  };

  if (submitted) return <SuccessScreen kind={submitted} onClose={() => navigate("/solicitudes")} />;

  return (
    <div className="min-h-screen bg-secondary/30 pb-12">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold tracking-tight">Registro de Solicitud Comercial</span>
            <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground hidden sm:inline-block">
              Paso {step} de 5
            </span>
          </div>
          <Link to="/dashboard" className="rounded p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Stepper - All steps clickable */}
        <nav aria-label="Progreso del formulario" className="mb-6">
          <ol className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-0 bg-card p-3 rounded-lg border border-border">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <li key={s.id} className="flex sm:flex-1 items-center min-w-0">
                  <button
                    type="button"
                    onClick={() => setStep(s.id)}
                    aria-current={active ? "step" : undefined}
                    className="group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                        done && "border-accent bg-accent text-accent-foreground",
                        active && "border-accent bg-accent/10 text-accent font-bold ring-2 ring-accent/30",
                        !done && !active && "border-border bg-secondary/50 text-muted-foreground group-hover:border-accent/50 group-hover:text-foreground"
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Paso {s.id}</span>
                      <span
                        className={cn(
                          "block truncate text-xs sm:text-sm transition-colors",
                          active ? "font-bold text-foreground" : done ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {s.title}
                      </span>
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <span className={cn("mx-2 hidden h-0.5 flex-1 sm:block", done ? "bg-accent" : "bg-border")} />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step container */}
        <div className="rounded-lg border border-border bg-card p-5 sm:p-8 shadow-xs">
          {step === 1 && <Step1 data={data} update={update} />}
          {step === 2 && <Step2 data={data} update={update} />}
          {step === 3 && <Step3 data={data} update={update} />}
          {step === 4 && <Step4 data={data} update={update} />}
          {step === 5 && <Step5 data={data} update={update} />}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={prev} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Anterior
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleFinish("draft")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Save className="h-4 w-4 mr-1.5" />
              Guardar borrador
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <Button onClick={next}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button onClick={() => handleFinish("sent")} className="px-6 font-semibold">
                <Send className="h-4 w-4 mr-1.5" />
                Enviar solicitud
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* -------------- Form Elements -------------- */

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 border-b border-border pb-4">
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
  hint,
  id,
  showOptionalBadge = false,
  badge,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: React.ReactNode;
  id?: string;
  showOptionalBadge?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground flex items-center justify-between gap-2">
        <span className="truncate">
          {label} {required && <span className="text-destructive font-semibold ml-0.5">*</span>}
        </span>
        {badge ? (
          badge
        ) : showOptionalBadge && !required ? (
          <span className="text-xs font-normal text-muted-foreground shrink-0">Opcional</span>
        ) : null}
      </Label>
      {children}
      {hint && <div className="text-xs text-muted-foreground leading-relaxed">{hint}</div>}
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: string[];
  value?: string;
  onChange: (v: string) => void;
  columns?: number;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
      )}
    >
      {options.map((o) => {
        const sel = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-all",
              sel
                ? "border-accent bg-accent/10 font-medium text-foreground ring-1 ring-accent/30"
                : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-secondary/40"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                sel ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card"
              )}
            >
              {sel && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <span className="text-xs sm:text-sm leading-snug whitespace-normal">{o}</span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------- Step 1: Datos de la Empresa -------------- */

function Step1({
  data,
  update,
}: {
  data: RequestFormData;
  update: <K extends keyof RequestFormData>(k: K, v: RequestFormData[K]) => void;
}) {
  const [matchedCompany, setMatchedCompany] = useState<CompanyRecord | null>(() => {
    if (!data.nit) return null;
    const clean = data.nit.replace(/[^0-9]/g, "");
    return MOCK_COMPANIES.find((c) => c.nit.replace(/[^0-9]/g, "") === clean) || null;
  });

  const handleNitChange = (val: string) => {
    update("nit", val);
    const clean = val.replace(/[^0-9]/g, "");
    if (clean.length >= 6) {
      const match = MOCK_COMPANIES.find((c) => c.nit.replace(/[^0-9]/g, "").includes(clean) || clean.includes(c.nit.replace(/[^0-9]/g, "")));
      if (match) {
        setMatchedCompany(match);
        // Autocompletar campos manteniendo 100% editables
        update("empresaNombre", match.nombre);
        update("direccion", match.direccion);
        update("telefonoEmpresa", match.telefono);
        update("correoEmpresa", match.correo);
        if (match.ciiuPrincipal) {
          update("ciiuPrincipal", match.ciiuPrincipal);
          update("ciiuPrincipalDesc", match.ciiuDescripcion || "");
        }
        if (match.web) update("web", match.web);
        if (match.tipoEmpresa) update("tipoEmpresa", match.tipoEmpresa);
        toast.success(`Datos de ${match.nombre} autocompletados. Puedes editarlos libremente.`);
      } else {
        setMatchedCompany(null);
      }
    } else {
      setMatchedCompany(null);
    }
  };

  const selectPredefinedCompany = (comp: CompanyRecord) => {
    update("nit", comp.nit);
    update("empresaNombre", comp.nombre);
    update("direccion", comp.direccion);
    update("telefonoEmpresa", comp.telefono);
    update("correoEmpresa", comp.correo);
    update("ciiuPrincipal", comp.ciiuPrincipal);
    update("ciiuPrincipalDesc", comp.ciiuDescripcion || "");
    if (comp.web) update("web", comp.web);
    if (comp.tipoEmpresa) update("tipoEmpresa", comp.tipoEmpresa);
    setMatchedCompany(comp);
    toast.success(`Empresa ${comp.nombre} seleccionada. Campos 100% editables.`);
  };

  const addSecondaryCiiu = () => {
    update("ciiusSecundarios", [...data.ciiusSecundarios, ""]);
  };

  const updateSecondaryCiiu = (index: number, val: string) => {
    const updated = [...data.ciiusSecundarios];
    updated[index] = val.replace(/[^0-9]/g, "").slice(0, 4);
    update("ciiusSecundarios", updated);
  };

  const removeSecondaryCiiu = (index: number) => {
    const updated = data.ciiusSecundarios.filter((_, i) => i !== index);
    update("ciiusSecundarios", updated);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="1. Datos de la Empresa"
        description="Búsqueda por NIT y datos tributarios corporativos del cliente. Los campos autocompletados pueden sobreescribirse libremente."
      />

      {/* Búsqueda principal por NIT */}
      <div className="rounded-lg border-2 border-accent/20 bg-accent/5 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="nit-input" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Search className="h-4 w-4 text-accent" />
              Búsqueda de Empresa por NIT <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="nit-input"
                placeholder="Ej. 890900608-9 o 890300279-4"
                value={data.nit}
                onChange={(e) => handleNitChange(e.target.value)}
                className="bg-card font-mono text-sm tracking-wide"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresa el NIT de la organización para buscar coincidencias automáticas en la base de datos de convenios.
            </p>
          </div>
        </div>

        {/* Suggestions chips */}
        <div className="mt-3 pt-3 border-t border-border/60">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-accent" /> Coincidencias rápidas disponibles en base de datos:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MOCK_COMPANIES.slice(0, 5).map((c) => (
              <button
                key={c.nit}
                type="button"
                onClick={() => selectPredefinedCompany(c)}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs transition-colors",
                  data.nit === c.nit
                    ? "border-accent bg-accent text-accent-foreground font-semibold"
                    : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground"
                )}
              >
                {c.nombre} <span className="font-mono text-[10px] opacity-75">({c.nit})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alerta de coincidencia */}
        {matchedCompany && (
          <div className="mt-3 flex items-start gap-2.5 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-foreground">
            <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-success">Empresa encontrada en base de datos</p>
              <p className="text-muted-foreground">
                Se autocompletaron Razón Social, Dirección, Teléfono, Correo y Código CIIU ({matchedCompany.ciiuPrincipal} - {matchedCompany.ciiuDescripcion}).
                Todos los campos continúan <strong className="text-foreground">100% editables</strong> para permitir sobreescritura.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nombre del KAM Asignado" required id="kam-select">
          <Select value={data.kam} onValueChange={(v) => update("kam", v)}>
            <SelectTrigger id="kam-select"><SelectValue placeholder="Seleccionar KAM" /></SelectTrigger>
            <SelectContent>
              {KAMS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Razón Social / Nombre de la empresa"
          required
          hint="Nombre legal completo registrado ante Cámara de Comercio"
          id="empresa-nombre"
        >
          <Input
            id="empresa-nombre"
            placeholder="Ej. Bancolombia S.A."
            value={data.empresaNombre}
            onChange={(e) => update("empresaNombre", e.target.value)}
          />
        </Field>

        <Field label="Dirección corporativa" hint="Sede principal de la organización" id="empresa-dir">
          <Input
            id="empresa-dir"
            placeholder="Ej. Carrera 48 # 26-85, Medellín"
            value={data.direccion}
            onChange={(e) => update("direccion", e.target.value)}
          />
        </Field>

        <Field label="Teléfono corporativo" hint="Línea principal de la empresa" id="empresa-tel">
          <Input
            id="empresa-tel"
            placeholder="Ej. (604) 510 9000"
            value={data.telefonoEmpresa}
            onChange={(e) => update("telefonoEmpresa", e.target.value)}
          />
        </Field>

        <Field label="Correo corporativo" hint="Buzón institucional de contacto" id="empresa-correo">
          <Input
            id="empresa-correo"
            type="email"
            placeholder="Ej. contacto@empresa.com"
            value={data.correoEmpresa}
            onChange={(e) => update("correoEmpresa", e.target.value)}
          />
        </Field>

        <Field label="Página web corporativa" hint="URL del portal de la empresa" id="empresa-web">
          <Input
            id="empresa-web"
            placeholder="https://www.empresa.com"
            value={data.web}
            onChange={(e) => update("web", e.target.value)}
          />
        </Field>

        {/* CIIU Principal Obligatorio */}
        <div className="md:col-span-2 rounded-md border border-border bg-secondary/30 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Actividad Económica Principal (Código CIIU)"
              required
              hint="Código numérico de exactamente 4 dígitos (CIIU Rev. 4 A.C.)"
              id="ciiu-principal"
            >
              <div className="relative">
                <Input
                  id="ciiu-principal"
                  placeholder="Ej. 8544"
                  maxLength={4}
                  value={data.ciiuPrincipal}
                  onChange={(e) => {
                    const cleanNum = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                    update("ciiuPrincipal", cleanNum);
                  }}
                  className="font-mono text-base font-semibold tracking-wider"
                />
              </div>
            </Field>

            <Field label="Descripción de la actividad principal" hint="Opcional: detalle de la actividad económica">
              <Input
                placeholder="Ej. Educación superior / Servicios financieros"
                value={data.ciiuPrincipalDesc}
                onChange={(e) => update("ciiuPrincipalDesc", e.target.value)}
              />
            </Field>
          </div>

          {/* Códigos CIIU Secundarios Opcionales */}
          {data.ciiusSecundarios.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Códigos CIIU Secundarios (Opcionales)
              </Label>
              <div className="space-y-2">
                {data.ciiusSecundarios.map((ciiu, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-36">
                      <Input
                        placeholder={`CIIU #${idx + 2} (4 dígitos)`}
                        maxLength={4}
                        value={ciiu}
                        onChange={(e) => updateSecondaryCiiu(idx, e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">Actividad complementaria #{idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSecondaryCiiu(idx)}
                      className="text-destructive hover:bg-destructive/10 ml-auto h-8 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSecondaryCiiu}
            className="text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            + Agregar otra actividad económica
          </Button>
        </div>

        <div className="md:col-span-2">
          <Field label="Naturaleza jurídica de la empresa" required>
            <RadioGroup
              options={["Pública", "Privada", "Mixta", "Sin ánimo de lucro"]}
              value={data.tipoEmpresa}
              onChange={(v) => update("tipoEmpresa", v)}
              columns={4}
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Descripción breve de la empresa" hint="Resumen de su modelo de negocio y tamaño">
            <Textarea
              rows={2}
              placeholder="Descripción breve de actividades principales..."
              value={data.descripcion}
              onChange={(e) => update("descripcion", e.target.value)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* -------------- Step 2: Contacto del Cliente -------------- */

function Step2({
  data,
  update,
}: {
  data: RequestFormData;
  update: <K extends keyof RequestFormData>(k: K, v: RequestFormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="2. Contacto del Cliente"
        description="Datos del interlocutor comercial y canales de comunicación alternativos."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nombre completo del contacto" required id="contacto-nombre">
          <Input
            id="contacto-nombre"
            placeholder="Ej. Carlos Arturo Ramírez"
            value={data.contactoNombre}
            onChange={(e) => update("contactoNombre", e.target.value)}
          />
        </Field>

        <Field label="Cargo del contacto" hint="Posición dentro de la empresa" id="contacto-cargo">
          <Input
            id="contacto-cargo"
            placeholder="Ej. Gerente de Talento Humano"
            value={data.cargo}
            onChange={(e) => update("cargo", e.target.value)}
          />
        </Field>

        <Field label="Teléfono de contacto principal" required hint="Celular o teléfono directo" id="contacto-tel">
          <Input
            id="contacto-tel"
            placeholder="Ej. +57 315 889 4433"
            value={data.telefono}
            onChange={(e) => update("telefono", e.target.value)}
          />
        </Field>

        <Field label="Teléfono de contacto secundario" hint="Línea alternativa o de oficina (opcional)" id="contacto-tel2">
          <Input
            id="contacto-tel2"
            placeholder="Ej. +57 (602) 667 5000 ext. 124"
            value={data.telefonoSecundario}
            onChange={(e) => update("telefonoSecundario", e.target.value)}
          />
        </Field>

        <Field label="Correo electrónico institucional" required hint="Email principal para cotizaciones" id="contacto-email">
          <Input
            id="contacto-email"
            type="email"
            placeholder="carlos.ramirez@empresa.com"
            value={data.correo}
            onChange={(e) => update("correo", e.target.value)}
          />
        </Field>

        <Field label="Correo electrónico alternativo" hint="Email secundario o asistente (opcional)" id="contacto-email2">
          <Input
            id="contacto-email2"
            type="email"
            placeholder="asistente.rrhh@empresa.com"
            value={data.correoAlternativo}
            onChange={(e) => update("correoAlternativo", e.target.value)}
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Área o dependencia" hint="Dirección, gerencia o departamento solicitante" id="contacto-area">
            <Input
              id="contacto-area"
              placeholder="Ej. Dirección de Desarrollo Organizacional y Cultura"
              value={data.area}
              onChange={(e) => update("area", e.target.value)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* -------------- Step 3: Requerimiento del Servicio -------------- */

function Step3({
  data,
  update,
}: {
  data: RequestFormData;
  update: <K extends keyof RequestFormData>(k: K, v: RequestFormData[K]) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(() => {
    return Boolean(
      data.horas ||
      data.modalidad ||
      data.alimentacion ||
      data.necesidad ||
      data.competencias ||
      data.areaParticipantes ||
      data.resultados ||
      data.exito
    );
  });

  const filledAdvancedCount = [
    data.horas,
    data.modalidad,
    data.alimentacion,
    data.necesidad,
    data.competencias,
    data.areaParticipantes,
    data.resultados,
    data.exito,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="3. Requerimiento del Servicio"
        description="Definición esencial de la propuesta comercial y articulación académica institucional."
      />

      {/* BLOQUE ESENCIAL (Directo y secuencial) */}
      <div className="space-y-5">
        {/* Asignación Institucional */}
        <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Asignación Académica Institucional
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nodo Asignado"
              required
              hint="Nodo temático de la Universidad Icesi"
              id="nodo-select"
            >
              <Select
                value={data.nodo}
                onValueChange={(v) => {
                  update("nodo", v);
                  // Asociación inteligente por Nodo: preselecciona automáticamente el líder sugerido para este nodo
                  if (NODE_DEFAULT_LEADERS[v]) {
                    update("ldp", NODE_DEFAULT_LEADERS[v]);
                  }
                }}
              >
                <SelectTrigger id="nodo-select" className="bg-card">
                  <SelectValue placeholder="Selecciona un nodo de la universidad" />
                </SelectTrigger>
                <SelectContent>
                  {NODES.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {(() => {
              const suggestedLeader = data.nodo ? NODE_DEFAULT_LEADERS[data.nodo] : "";
              const isDefaultSuggested = Boolean(suggestedLeader && data.ldp === suggestedLeader);
              const isCustomLeader = Boolean(data.ldp && suggestedLeader && data.ldp !== suggestedLeader);

              return (
                <Field
                  label="Líder de Producto sugerido"
                  id="ldp-select"
                  badge={
                    isDefaultSuggested ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent shrink-0">
                        <Sparkles className="h-3 w-3 text-accent" />
                        Sugerido por nodo
                      </span>
                    ) : isCustomLeader ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground shrink-0">
                        Personalizado
                      </span>
                    ) : (
                      <span className="text-xs font-normal text-muted-foreground shrink-0">Opcional</span>
                    )
                  }
                  hint={
                    isDefaultSuggested ? (
                      <span className="flex items-center gap-1.5 text-accent font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                        Preseleccionado automáticamente según el nodo temático asignado
                      </span>
                    ) : isCustomLeader ? (
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span>Líder sugerido por el nodo: <strong>{suggestedLeader}</strong>.</span>
                        <button
                          type="button"
                          onClick={() => update("ldp", suggestedLeader)}
                          className="text-accent underline font-medium hover:text-accent/80 transition-colors"
                        >
                          Restablecer sugerido
                        </button>
                      </span>
                    ) : suggestedLeader ? (
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span>Sugerido para este nodo: <strong>{suggestedLeader}</strong>.</span>
                        <button
                          type="button"
                          onClick={() => update("ldp", suggestedLeader)}
                          className="text-accent underline font-medium hover:text-accent/80 transition-colors"
                        >
                          Aplicar sugerido
                        </button>
                      </span>
                    ) : (
                      "Responsable técnico sugerido (se preseleccionará automáticamente al asignar el nodo)"
                    )
                  }
                >
                  <Select
                    value={data.ldp || ""}
                    onValueChange={(v) => update("ldp", v === "none" ? "" : v)}
                  >
                    <SelectTrigger id="ldp-select" className="bg-card">
                      <SelectValue placeholder="Seleccionar líder sugerido (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.ldp && (
                        <SelectItem value="none" className="text-muted-foreground italic">
                          -- Sin líder sugerido (opcional / por definir) --
                        </SelectItem>
                      )}
                      {PRODUCT_LEADERS.map((p) => {
                        const isThisSuggested = Boolean(suggestedLeader === p);
                        return (
                          <SelectItem
                            key={p}
                            value={p}
                            extra={
                              isThisSuggested ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent shrink-0">
                                  <Sparkles className="h-2.5 w-2.5" /> Sugerido
                                </span>
                              ) : null
                            }
                          >
                            {p}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </Field>
              );
            })()}
          </div>
        </div>

        {/* Título o nombre de la propuesta */}
        <Field
          label="Título o nombre de la propuesta"
          required
          hint="Nombre de referencia comercial (ej. Programa Ejecutivo en Liderazgo y Toma de Decisiones)"
          id="nombre-req"
        >
          <Input
            id="nombre-req"
            placeholder="Ej. Diplomado en Inteligencia Artificial y Eficiencia Operacional"
            value={data.nombreReq}
            onChange={(e) => update("nombreReq", e.target.value)}
          />
        </Field>

        {/* Tipo de Requerimiento */}
        <Field
          label="Tipo de Requerimiento"
          required
          hint="Modalidad formal de relacionamiento y oferta de valor"
          id="tipo-req"
        >
          <Select
            value={data.tipoReq}
            onValueChange={(v) => update("tipoReq", v as RequestType)}
          >
            <SelectTrigger id="tipo-req">
              <SelectValue placeholder="Seleccione el tipo de requerimiento" />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Condicional 'Otro' */}
        {data.tipoReq === "Otro" && (
          <div className="rounded-md border border-accent/40 bg-accent/10 p-4">
            <Field
              label="Especifique el tipo de requerimiento"
              required
              hint="Indique con claridad el formato del servicio que no encaja en las categorías estándar"
              id="tipo-otro-input"
            >
              <Input
                id="tipo-otro-input"
                placeholder="Ej. Hackathon empresarial, Rueda de negocios, Pasantía tecnológica..."
                value={data.tipoReqOtro}
                onChange={(e) => update("tipoReqOtro", e.target.value)}
                className="bg-card"
              />
            </Field>
          </div>
        )}
      </div>

      {/* BLOQUE DE REVELACIÓN PROGRESIVA: Información complementaria opcional */}
      <div className="rounded-lg border border-border bg-card overflow-hidden transition-all shadow-2xs">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Detalles logísticos y de diagnóstico
                </span>
                {filledAdvancedCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    {filledAdvancedCount} dato{filledAdvancedCount > 1 ? "s" : ""} agregado{filledAdvancedCount > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground font-normal">
                    (Opcional)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {showAdvanced
                  ? "Plegar sección de parámetros secundarios"
                  : "Cupo, intensidad horaria, modalidad, logística y objetivos esperados"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md">
            <span>{showAdvanced ? "Ocultar" : "Desplegar"}</span>
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        </button>

        {showAdvanced && (
          <div className="border-t border-border p-5 space-y-6 bg-secondary/10">
            {/* Parámetros Logísticos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Parámetros logísticos y de ejecución
                </h4>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Intensidad horaria estimada"
                  hint="Horas aproximadas del programa (ej. 16, 24, 40)"
                  id="horas-est"
                >
                  <Input
                    id="horas-est"
                    type="number"
                    placeholder="Ej. 24"
                    value={data.horas}
                    onChange={(e) => update("horas", e.target.value)}
                    className="bg-card"
                  />
                </Field>

                <Field
                  label="Cupo o participantes proyectados"
                  hint="Rango estimado de asistentes"
                  id="participantes-select"
                >
                  <Select value={data.participantes} onValueChange={(v) => update("participantes", v)}>
                    <SelectTrigger id="participantes-select" className="bg-card">
                      <SelectValue placeholder="Seleccionar rango de cupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 - 5">1 a 5 participantes</SelectItem>
                      <SelectItem value="6 - 10">6 a 10 participantes</SelectItem>
                      <SelectItem value="11 - 15">11 a 15 participantes</SelectItem>
                      <SelectItem value="15 - 20">15 a 20 participantes</SelectItem>
                      <SelectItem value="20 - 25">20 a 25 participantes</SelectItem>
                      <SelectItem value="Más de 25">Más de 25 participantes</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label="Modalidad de ejecución"
                  hint="Lugar y dinámica de las sesiones"
                  id="modalidad-select"
                >
                  <Select value={data.modalidad} onValueChange={(v) => update("modalidad", v)}>
                    <SelectTrigger id="modalidad-select" className="bg-card">
                      <SelectValue placeholder="Seleccionar modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Presencial en campus Icesi">Presencial en campus Icesi</SelectItem>
                      <SelectItem value="Presencial en sede cliente">Presencial en sede cliente</SelectItem>
                      <SelectItem value="Virtual sincrónica">Virtual sincrónica</SelectItem>
                      <SelectItem value="Híbrida">Híbrida</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label="Servicio de alimentación y logística"
                  hint="Refrigerios, comidas de trabajo o kits"
                  id="alimentacion-select"
                >
                  <Select value={data.alimentacion} onValueChange={(v) => update("alimentacion", v)}>
                    <SelectTrigger id="alimentacion-select" className="bg-card">
                      <SelectValue placeholder="Seleccionar requerimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No requiere">No requiere</SelectItem>
                      <SelectItem value="Requiere refrigerios / almuerzos">Requiere refrigerios / almuerzos</SelectItem>
                      <SelectItem value="Requiere kit de materiales">Requiere kit de materiales</SelectItem>
                      <SelectItem value="Por definir en formulación">Por definir en formulación</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            {/* Diagnóstico y Objetivos */}
            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Diagnóstico y objetivos del proceso
                </h4>
              </div>

              <div className="space-y-4">
                <Field
                  label="Necesidad u oportunidad identificada"
                  hint="Reto u oportunidad que la empresa busca abordar"
                >
                  <Textarea
                    rows={2}
                    placeholder="Describa brevemente la situación o motivación principal de la organización..."
                    value={data.necesidad}
                    onChange={(e) => update("necesidad", e.target.value)}
                    className="bg-card"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Competencias a fortalecer"
                    hint="Habilidades o conocimientos prioritarios"
                  >
                    <Input
                      placeholder="Ej. Pensamiento analítico, Negociación..."
                      value={data.competencias}
                      onChange={(e) => update("competencias", e.target.value)}
                      className="bg-card"
                    />
                  </Field>

                  <Field
                    label="Perfil o área de los participantes"
                    hint="Público o cargos a quienes va dirigido"
                  >
                    <Input
                      placeholder="Ej. Directores de planta, Analistas comerciales..."
                      value={data.areaParticipantes}
                      onChange={(e) => update("areaParticipantes", e.target.value)}
                      className="bg-card"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Entregables o resultados esperados"
                    hint="Cambios tangibles al concluir la intervención"
                  >
                    <Textarea
                      rows={2}
                      placeholder="Entregables o cambios esperados en el equipo..."
                      value={data.resultados}
                      onChange={(e) => update("resultados", e.target.value)}
                      className="bg-card"
                    />
                  </Field>

                  <Field
                    label="Criterios de éxito / Medición de impacto"
                    hint="Indicadores clave (KPIs) o método de evaluación"
                  >
                    <Textarea
                      rows={2}
                      placeholder="Indicadores clave de desempeño, encuestas..."
                      value={data.exito}
                      onChange={(e) => update("exito", e.target.value)}
                      className="bg-card"
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------- Step 4: Formación Previa -------------- */

function Step4({
  data,
  update,
}: {
  data: RequestFormData;
  update: <K extends keyof RequestFormData>(k: K, v: RequestFormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="4. Formación Previa"
        description="Antecedentes y capacitaciones recibidas con anterioridad por el equipo o la empresa."
      />

      <div className="space-y-5">
        <Field label="¿La empresa o equipo ha tenido formación previa sobre esta temática?" required>
          <RadioGroup
            options={["Sí", "No"]}
            value={data.formacionPrevia}
            onChange={(v) => update("formacionPrevia", v as "Sí" | "No")}
            columns={2}
          />
        </Field>

        {data.formacionPrevia === "Sí" ? (
          <div className="rounded-md border border-border bg-secondary/30 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <GraduationCap className="h-4 w-4 text-accent" />
              Detalle de los antecedentes de formación
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Descripción del programa anterior" hint="Nombre o temática del curso/consultoría previa">
                  <Textarea
                    rows={2}
                    placeholder="Ej. Taller introductorio a metodologías ágiles y Scrum"
                    value={data.descFormacion}
                    onChange={(e) => update("descFormacion", e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Empresa o institución proveedora previa" hint="Entidad que impartió la formación">
                <Input
                  placeholder="Ej. Centro de Consultoría / Universidad..."
                  value={data.empresaPrevia}
                  onChange={(e) => update("empresaPrevia", e.target.value)}
                />
              </Field>

              <Field label="Fecha aproximada o período" hint="Año o fecha estimada de realización">
                <Input
                  type="date"
                  value={data.fechaPrevia}
                  onChange={(e) => update("fechaPrevia", e.target.value)}
                />
              </Field>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-border/80 bg-secondary/20 p-4 text-xs text-muted-foreground flex items-center gap-2">
            <Check className="h-4 w-4 text-muted-foreground" />
            No se registran antecedentes previos. Se formulará la propuesta desde nivel inicial/diagnóstico.
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------- Step 5: Observaciones y Documentos -------------- */

function Step5({
  data,
  update,
}: {
  data: RequestFormData;
  update: <K extends keyof RequestFormData>(k: K, v: RequestFormData[K]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles: AttachedFile[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      type: f.type || "document",
    }));
    update("archivos", [...data.archivos, ...newFiles]);
    toast.success(`${newFiles.length} archivo(s) añadido(s) exitosamente.`);
  };

  const removeFile = (id: string) => {
    update("archivos", data.archivos.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="5. Observaciones y Documentos de Apoyo"
        description="Agrega consideraciones finales y adjunta opcionalmente términos de referencia, cartas o RFP."
      />

      {/* Observaciones generales */}
      <Field label="Observaciones adicionales" hint="Instrucciones comerciales, plazos clave o condiciones especiales">
        <Textarea
          rows={3}
          placeholder="Ingrese comentarios adicionales para el Líder de Producto o el equipo de diseño..."
          value={data.observaciones}
          onChange={(e) => update("observaciones", e.target.value)}
        />
      </Field>

      {/* Zona de Carga de Archivos - 100% Opcional */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <UploadCloud className="h-4 w-4 text-accent" />
            Zona de carga de archivos
          </Label>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            100% Opcional
          </span>
        </div>

        {/* Dropzone container */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFilesAdded(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all",
            isDragging
              ? "border-accent bg-accent/10 scale-[0.99]"
              : "border-border bg-secondary/20 hover:border-accent/50 hover:bg-secondary/40"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-accent mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Arrastra tus documentos aquí o <span className="text-accent underline font-semibold">haz clic para examinar</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Soporta PDF, Word, Excel, PowerPoint e imágenes (hasta 25 MB por archivo)
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] text-muted-foreground">
            <Info className="h-3 w-3 text-accent" />
            No es obligatorio adjuntar archivos para registrar y enviar la solicitud
          </div>
        </div>

        {/* Lista de archivos adjuntos */}
        {data.archivos.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Documentos adjuntados ({data.archivos.length}):
            </p>
            <div className="divide-y divide-border rounded-md border border-border bg-card">
              {data.archivos.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground text-xs sm:text-sm">{file.name}</p>
                      <p className="text-[11px] text-muted-foreground">{file.size}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resumen de validación rápida antes de enviar */}
      <div className="rounded-md border border-border bg-secondary/30 p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Resumen de la Solicitud
        </h4>
        <dl className="grid gap-2 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Empresa / Razón Social:</dt>
            <dd className="font-semibold text-foreground truncate">{data.empresaNombre || "Sin especificar"}</dd>
            <dt className="text-muted-foreground mt-1">NIT:</dt>
            <dd className="font-mono text-foreground">{data.nit || "No registrado"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Contacto:</dt>
            <dd className="font-medium text-foreground truncate">{data.contactoNombre || "Sin especificar"}</dd>
            <dt className="text-muted-foreground mt-1">Nodo Asignado:</dt>
            <dd className="font-medium text-accent truncate">{data.nodo || "Sin asignar"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tipo de Requerimiento:</dt>
            <dd className="font-medium text-foreground">
              {data.tipoReq === "Otro" && data.tipoReqOtro ? `Otro (${data.tipoReqOtro})` : data.tipoReq}
            </dd>
            <dt className="text-muted-foreground mt-1">CIIU Principal:</dt>
            <dd className="font-mono font-semibold text-foreground">{data.ciiuPrincipal || "Sin código"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* -------------- Success Screen -------------- */

function SuccessScreen({ kind, onClose }: { kind: "draft" | "sent"; onClose: () => void }) {
  const isDraft = kind === "draft";
  return (
    <div className="min-h-screen bg-secondary/40">
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-xl border border-border bg-card p-6 sm:p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
            {isDraft ? "Borrador guardado exitosamente" : "Solicitud registrada con éxito"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isDraft
              ? "Tu borrador comercial fue almacenado. Puedes retomarlo o editarlo cuando desees."
              : "La solicitud fue vinculada al Nodo Asignado y notificada al Líder de Producto para formulación."}
          </p>

          {!isDraft && (
            <div className="mt-6 space-y-2.5 text-left">
              <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/40 p-3">
                <Calendar className="h-4 w-4 shrink-0 text-accent" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-foreground">Fecha límite de formulación</p>
                  <p className="text-muted-foreground">El sistema asignó el plazo estándar de respuesta técnica.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/40 p-3">
                <Bell className="h-4 w-4 shrink-0 text-accent" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-foreground">Notificación al Líder de Producto</p>
                  <p className="text-muted-foreground">El docente y líder asignados recibirán la alerta en su tablero.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" asChild>
              <Link to="/dashboard">Ir al tablero principal</Link>
            </Button>
            <Button onClick={onClose}>Ver lista de solicitudes</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
