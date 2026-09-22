import { useState, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Check,
  Building2,
  User,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  CheckCircle2,
  X,
  Bell,
  Calendar,
  Search,
  Plus,
  Trash2,
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Users,
  History,
  Clock,
  Eye,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  NODES,
  PRODUCT_LEADERS,
  NODE_DEFAULT_LEADERS,
  REQUEST_TYPES,
  STATUS_META,
  URGENCY_META,
  formatCop,
  type RequestType,
  type Urgency,
  type RequestItem,
  type ClientContact,
  type ProposalDocument,
} from "@/lib/mock-data";
import type { Company } from "@/lib/api/companies";
import { companyTypeLabel, formatNit } from "@/lib/company";
import { CompanyAutocomplete } from "@/components/CompanyAutocomplete";
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
  ciiuPrincipal: string; // Opcional
  ciiuPrincipalDesc: string;
  ciiusSecundarios: string[]; // códigos adicionales opcionales
  tipoEmpresa: string;
  descripcion: string;
  web: string;

  // Paso 2 - Contacto del Cliente
  contactoNombre: string; // Opcional
  telefono: string; // Opcional
  telefonoSecundario: string; // Opcional
  correo: string; // Opcional
  correoAlternativo: string; // Opcional
  cargo: string; // Opcional
  area: string; // Opcional
  contactosAdicionales: ClientContact[]; // Múltiples contactos en la empresa

  // Paso 3 - Requerimiento del Servicio
  nodo: string; // Opcional
  ldp: string; // Líder de producto asignado
  nombreReq: string; // Obligatorio
  tipoReq: RequestType | ""; // Obligatorio — arranca vacío, sin preselección
  tipoReqOtro: string; // Obligatorio condicional si tipoReq === 'Otro'
  urgencia: Urgency | ""; // Obligatorio — arranca vacío, sin preselección
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
  formacionPrevia: "Sí" | "No" | "No sé" | ""; // Obligatorio — arranca vacío, sin preselección
  descFormacion: string;
  empresaPrevia: string;
  fechaPrevia: string;

  // Paso 5 - Observaciones y Documentos
  observaciones: string;
  archivos: AttachedFile[]; // 100% opcional
}

const DRAFT_STORAGE_KEY = "icesi_kam_new_request_draft_v1";

function mapAttachedFileToDocumentType(fileName: string): ProposalDocument["type"] {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (["csv"].includes(ext)) return "sheet";
  if (["zip", "rar", "7z"].includes(ext)) return "archive";
  return "doc";
}

export default function NewRequest() {
  const navigate = useNavigate();
  const { addRequest, user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState<null | "draft" | "sent">(null);
  const [restoredDraftInfo, setRestoredDraftInfo] = useState<{ company: string; timestamp: string } | null>(null);

  const initialFormData: RequestFormData = {
    kam: user.name, // El KAM asignado siempre es quien envía la solicitud — no es seleccionable
    nit: "",
    empresaNombre: "",
    direccion: "",
    telefonoEmpresa: "",
    correoEmpresa: "",
    ciiuPrincipal: "",
    ciiuPrincipalDesc: "",
    ciiusSecundarios: [],
    tipoEmpresa: "",
    descripcion: "",
    web: "",

    contactoNombre: "",
    telefono: "",
    telefonoSecundario: "",
    correo: "",
    correoAlternativo: "",
    cargo: "",
    area: "",
    contactosAdicionales: [],

    nodo: "",
    ldp: "",
    nombreReq: "",
    tipoReq: "",
    tipoReqOtro: "",
    urgencia: "",
    participantes: "",
    horas: "",
    modalidad: "",
    alimentacion: "",
    necesidad: "",
    competencias: "",
    exito: "",
    resultados: "",
    areaParticipantes: "",

    formacionPrevia: "",
    descFormacion: "",
    empresaPrevia: "",
    fechaPrevia: "",

    observaciones: "",
    archivos: [],
  };

  const [data, setData] = useState<RequestFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Verificar si existe un borrador guardado en localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.data?.empresaNombre?.trim() || parsed?.data?.nombreReq?.trim()) {
          setRestoredDraftInfo({
            company: parsed.data.empresaNombre || parsed.data.nombreReq || "Empresa en trámite",
            timestamp: parsed.timestamp || "reciente",
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Autoguardado silencioso cada vez que cambia data
  useEffect(() => {
    // Solo guardar si hay información significativa
    if (data.empresaNombre.trim() || data.nombreReq.trim() || data.necesidad.trim()) {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            data,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }),
        );
      } catch {
        // ignore
      }
    }
  }, [data]);

  const loadSavedDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.data) {
          setData(parsed.data);
          toast.success("Borrador recuperado correctamente");
        }
      }
    } catch {
      toast.error("No se pudo cargar el borrador");
    } finally {
      setRestoredDraftInfo(null);
    }
  };

  const discardSavedDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    setRestoredDraftInfo(null);
    toast.info("Borrador descartado. Comenzando desde cero.");
  };

  const update = <K extends keyof RequestFormData>(key: K, value: RequestFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    // Cualquier interacción con un campo limpia su error visual de inmediato
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const { [key as string]: _removed, ...rest } = prev;
      return rest;
    });
  };

  // Lleva la vista suavemente al campo indicado y lo enfoca si es posible
  const scrollToField = (id: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof (el as HTMLElement & { focus?: () => void }).focus === "function") {
        (el as HTMLElement).focus({ preventScroll: true });
      }
    });
  };

  // Mapa campo -> id del elemento en pantalla, para el auto-scroll de validación
  const FIELD_SCROLL_TARGETS: Record<string, string> = {
    empresaNombre: "empresa-nombre",
    tipoEmpresa: "tipo-empresa-group",
    nombreReq: "nombre-req",
    tipoReq: "tipo-req",
    tipoReqOtro: "tipo-otro-input",
    formacionPrevia: "formacion-previa-group",
    urgencia: "urgencia-group",
  };

  // Validación estricta al avanzar entre pasos: nunca deja pasar un campo obligatorio sin marcar
  const validateCurrentStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!data.empresaNombre.trim()) {
        newErrors.empresaNombre = "Ingresa o selecciona la Razón Social de la empresa para continuar.";
      }
      if (!data.tipoEmpresa) {
        newErrors.tipoEmpresa = "Selecciona la naturaleza jurídica de la empresa para continuar.";
      }
    } else if (currentStep === 2) {
      // Paso 2 (Contactos) es 100% opcional según directriz de Líder de Producto
      return true;
    } else if (currentStep === 3) {
      if (!data.nombreReq.trim()) {
        newErrors.nombreReq = "Ingresa un título o nombre de la propuesta para continuar.";
      }
      if (!data.tipoReq) {
        newErrors.tipoReq = "Selecciona el tipo de requerimiento para continuar.";
      } else if (data.tipoReq === "Otro" && !data.tipoReqOtro.trim()) {
        newErrors.tipoReqOtro = "Especifica el tipo de requerimiento.";
      }
    } else if (currentStep === 4) {
      if (!data.formacionPrevia) {
        newErrors.formacionPrevia = "Indica si ha habido formación previa sobre esta temática.";
      }
      if (!data.urgencia) {
        newErrors.urgencia = "Selecciona el nivel de urgencia de la solicitud.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...newErrors }));
      const firstKey = Object.keys(newErrors)[0];
      toast.error(newErrors[firstKey]);
      scrollToField(FIELD_SCROLL_TARGETS[firstKey] || firstKey);
      return false;
    }

    return true;
  };

  const handleStepClick = (targetStep: number) => {
    // Si intenta avanzar más allá del paso actual sin validar lo obligatorio
    if (targetStep > step) {
      if (!validateCurrentStep(step)) return;
    }
    setStep(targetStep);
  };

  const next = () => {
    if (!validateCurrentStep(step)) return;
    setStep((s) => Math.min(5, s + 1));
  };

  const prev = () => setStep((s) => Math.max(1, s - 1));

  // Desplazamiento suave al inicio de la pantalla en cada cambio de paso
  // (Continuar, Anterior o clic directo en el Stepper), para que el KAM
  // no tenga que subir manualmente hasta el botón que quedó abajo.
  const isFirstStepRender = useRef(true);
  useEffect(() => {
    if (isFirstStepRender.current) {
      isFirstStepRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleFinish = (kind: "draft" | "sent") => {
    if (kind === "sent") {
      if (!data.empresaNombre.trim()) {
        toast.error("Por favor ingresa o busca la Razón Social de la empresa en el Paso 1.");
        setFieldErrors((prev) => ({
          ...prev,
          empresaNombre: "Ingresa o selecciona la Razón Social de la empresa para continuar.",
        }));
        setStep(1);
        return;
      }
      if (!data.tipoEmpresa) {
        toast.error("Por favor selecciona la Naturaleza Jurídica de la empresa en el Paso 1.");
        setFieldErrors((prev) => ({
          ...prev,
          tipoEmpresa: "Selecciona la naturaleza jurídica de la empresa para continuar.",
        }));
        setStep(1);
        return;
      }
      if (!data.nombreReq.trim()) {
        toast.error("Por favor ingresa el título de la propuesta en el Paso 3.");
        setFieldErrors((prev) => ({
          ...prev,
          nombreReq: "Ingresa un título o nombre de la propuesta para continuar.",
        }));
        setStep(3);
        return;
      }
      if (!data.tipoReq) {
        toast.error("Por favor selecciona el tipo de requerimiento en el Paso 3.");
        setFieldErrors((prev) => ({ ...prev, tipoReq: "Selecciona el tipo de requerimiento para continuar." }));
        setStep(3);
        return;
      }
      if (data.tipoReq === "Otro" && !data.tipoReqOtro.trim()) {
        toast.error("Por favor especifica el tipo de requerimiento en el Paso 3.");
        setFieldErrors((prev) => ({ ...prev, tipoReqOtro: "Especifica el tipo de requerimiento." }));
        setStep(3);
        return;
      }
      if (!data.formacionPrevia) {
        toast.error("Por favor indica si ha habido formación previa en el Paso 4.");
        setFieldErrors((prev) => ({
          ...prev,
          formacionPrevia: "Indica si ha habido formación previa sobre esta temática.",
        }));
        setStep(4);
        return;
      }
      if (!data.urgencia) {
        toast.error("Por favor selecciona el nivel de urgencia en el Paso 4.");
        setFieldErrors((prev) => ({ ...prev, urgencia: "Selecciona el nivel de urgencia de la solicitud." }));
        setStep(4);
        return;
      }
    }

    const finalTitle = data.nombreReq.trim()
      ? data.nombreReq.trim()
      : `${data.tipoReq === "Otro" && data.tipoReqOtro ? data.tipoReqOtro : data.tipoReq || "Solicitud"} - ${data.empresaNombre || "Empresa Aliada"}`;

    const contactName =
      data.contactoNombre.trim() ||
      (data.contactosAdicionales.length > 0 && data.contactosAdicionales[0].nombre.trim()
        ? data.contactosAdicionales[0].nombre.trim()
        : "Contacto de la Empresa");

    const clientKamDocuments: ProposalDocument[] = data.archivos.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      date: new Date().toISOString().split("T")[0],
      type: mapAttachedFileToDocumentType(f.name),
      category: "client_kam",
      uploadedBy: user.name,
    }));

    addRequest({
      title: finalTitle,
      applicant: contactName,
      type: (data.tipoReq || "Otro") as RequestType,
      status: "nueva", // Siempre ingresa formalmente en estado nueva para asignación
      urgency: (data.urgencia || "media") as Urgency,
      company: data.empresaNombre.trim() || "Empresa Aliada",
      node: data.nodo || "Por definir",
      productLeader: data.ldp || (data.nodo ? NODE_DEFAULT_LEADERS[data.nodo] : "") || "Por definir",
      kam: user.name, // Siempre el remitente real de la solicitud, nunca un KAM distinto
      participantes: data.participantes || undefined,
      modalidad: data.modalidad || undefined,
      horas: data.horas || undefined,
      tipoOtro: data.tipoReq === "Otro" ? data.tipoReqOtro.trim() || undefined : undefined,
      // Sin costing/totalCostCop: el precio lo define el Líder de Producto,
      // nunca llega ya definido desde el KAM.

      // Empresa (paso 1)
      companyNit: data.nit || undefined,
      companyDireccion: data.direccion || undefined,
      companyTelefono: data.telefonoEmpresa || undefined,
      companyCorreo: data.correoEmpresa || undefined,
      companyCiiuPrincipal: data.ciiuPrincipal || undefined,
      companyCiiuPrincipalDesc: data.ciiuPrincipalDesc || undefined,
      companyCiiusSecundarios: data.ciiusSecundarios.length > 0 ? data.ciiusSecundarios : undefined,
      companyTipo: data.tipoEmpresa || undefined,
      companyDescripcion: data.descripcion || undefined,
      companyWeb: data.web || undefined,

      // Contacto (paso 2)
      contactTelefono: data.telefono || undefined,
      contactTelefonoSecundario: data.telefonoSecundario || undefined,
      contactCorreo: data.correo || undefined,
      contactCorreoAlternativo: data.correoAlternativo || undefined,
      contactCargo: data.cargo || undefined,
      contactArea: data.area || undefined,
      additionalContacts: data.contactosAdicionales.length > 0 ? data.contactosAdicionales : undefined,

      // Diagnóstico del requerimiento (paso 3)
      alimentacion: data.alimentacion || undefined,
      necesidad: data.necesidad || undefined,
      competencias: data.competencias || undefined,
      exito: data.exito || undefined,
      resultados: data.resultados || undefined,
      areaParticipantes: data.areaParticipantes || undefined,

      // Formación previa (paso 4)
      formacionPrevia: data.formacionPrevia || undefined,
      descFormacion: data.descFormacion || undefined,
      empresaPrevia: data.empresaPrevia || undefined,
      fechaPrevia: data.fechaPrevia || undefined,

      // Observaciones y documentos (paso 5)
      observaciones: data.observaciones || undefined,
      clientKamDocuments: clientKamDocuments.length > 0 ? clientKamDocuments : undefined,
    });

    // Limpiar borrador local tras envío exitoso
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }

    setSubmitted(kind);
  };

  if (submitted)
    return (
      <SuccessScreen
        kind={submitted}
        onClose={() => navigate(user.role === "kam" || user.role === "lider-producto" ? "/dashboard" : "/solicitudes")}
      />
    );

  return (
    <div className="min-h-screen bg-background dark:bg-[#090a0e] pb-12">
      {/* Top bar with Icesi Cenefa bar */}
      <header className="sticky top-0 z-30 border-b border-border dark:border-[#252838] bg-card/95 dark:bg-[#12131d]/95 backdrop-blur">
        <div className="h-1 w-full bg-linear-to-r from-[#5454e9] via-[#865cf0] to-[#e4eb60]" />
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold tracking-tight text-foreground font-sans">
              Registro de Solicitud Comercial
            </span>
            <span className="rounded bg-[#5454e9]/10 px-2.5 py-0.5 text-xs font-bold text-[#5454e9] dark:text-[#865cf0] hidden sm:inline-block">
              Paso {step} de 5
            </span>
          </div>
          <Link
            to="/dashboard"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary dark:hover:bg-[#1a1c28]"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Banner de recuperación de borrador automático */}
        {restoredDraftInfo && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Solicitud en curso detectada</p>
                <p className="text-muted-foreground mt-0.5">
                  Existe una solicitud previa guardada automáticamente para{" "}
                  <strong className="text-foreground">{restoredDraftInfo.company}</strong> (guardada a las{" "}
                  {restoredDraftInfo.timestamp}).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={discardSavedDraft}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Descartar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={loadSavedDraft}
                className="h-8 bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-bold"
              >
                Recuperar datos
              </Button>
            </div>
          </div>
        )}

        {/* Stepper - All steps clickable with validation */}
        <nav aria-label="Progreso del formulario" className="mb-6">
          <ol className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-0 bg-card dark:bg-[#141622] p-3 rounded-xl border border-border dark:border-[#252838] shadow-xs">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <li key={s.id} className="flex sm:flex-1 items-center min-w-0">
                  <button
                    type="button"
                    onClick={() => handleStepClick(s.id)}
                    aria-current={active ? "step" : undefined}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left focus:outline-none"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all",
                        done && "border-[#4cb979] bg-[#4cb979] text-white",
                        active && "border-[#5454e9] bg-[#5454e9] text-white ring-2 ring-[#5454e9]/30",
                        !done &&
                          !active &&
                          "border-border dark:border-[#2b2d3d] bg-secondary/50 dark:bg-[#1a1c28] text-muted-foreground group-hover:border-[#5454e9]/50 group-hover:text-foreground",
                      )}
                    >
                      {done ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Paso {s.id}
                      </span>
                      <span
                        className={cn(
                          "block truncate text-xs sm:text-sm font-sans transition-colors",
                          active
                            ? "font-bold text-[#5454e9] dark:text-[#865cf0]"
                            : done
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {s.title}
                      </span>
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <span
                      className={cn(
                        "mx-2 hidden h-0.5 flex-1 sm:block",
                        done ? "bg-[#4cb979]" : "bg-border dark:bg-[#252838]",
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step container */}
        <div className="rounded-xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] p-5 sm:p-8 shadow-xs">
          {step === 1 && <Step1 data={data} update={update} errors={fieldErrors} />}
          {step === 2 && <Step2 data={data} update={update} />}
          {step === 3 && <Step3 data={data} update={update} errors={fieldErrors} />}
          {step === 4 && <Step4 data={data} update={update} errors={fieldErrors} />}
          {step === 5 && <Step5 data={data} update={update} />}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={prev} disabled={step === 1} className="h-10 text-xs font-medium">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Anterior
            </Button>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground pl-1">
              <CheckCircle className="h-3.5 w-3.5 text-success" />
              Guardado automático en segundo plano
            </span>
          </div>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <Button
                onClick={next}
                className="bg-[#5454e9] hover:bg-[#4343d3] text-white h-10 px-5 text-xs font-bold shadow-xs"
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={() => handleFinish("sent")}
                className="bg-[#4cb979] hover:bg-[#3ea569] text-white px-6 h-10 text-xs font-bold shadow-xs"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Enviar solicitud a Líder de Producto
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

// Marco de resaltado en rojo para campos obligatorios sin diligenciar.
// Se usa alrededor del control (no de todo el Field) para que solo el
// control quede enmarcado, sin desplazar el resto del layout cuando no hay error.
function FieldErrorFrame({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 border-transparent transition-colors",
        show && "border-destructive bg-destructive/5 ring-2 ring-destructive/20 p-2.5 -m-0.5",
      )}
    >
      {children}
    </div>
  );
}

function FieldErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {children}
    </p>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
  columns = 2,
  id,
}: {
  options: string[];
  value?: string;
  onChange: (v: string) => void;
  columns?: number;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "grid gap-2",
        columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
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
                : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-secondary/40",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                sel ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card",
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
  errors,
}: {
  data: RequestFormData;
  update: <K extends keyof RequestFormData>(k: K, v: RequestFormData[K]) => void;
  errors: Record<string, string>;
}) {
  const [matchedCompany, setMatchedCompany] = useState<Company | null>(null);

  // El directorio del backend solo guarda nombre, NIT, sitio web y tipo: la
  // dirección, el teléfono, el correo y el CIIU se siguen diligenciando a mano.
  const selectCompany = (comp: Company) => {
    update("empresaNombre", comp.name);
    if (comp.nit) update("nit", formatNit(comp.nit));
    if (comp.website) update("web", comp.website);
    const tipoEmpresa = companyTypeLabel(comp.type);
    if (tipoEmpresa) update("tipoEmpresa", tipoEmpresa);
    setMatchedCompany(comp);
    toast.success(`Datos de ${comp.name} cargados. Todos los campos continúan 100% editables.`);
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
        description="Búsqueda por nombre de empresa o NIT (opcional). Los campos autocompletados pueden sobreescribirse libremente."
      />

      {/* Búsqueda principal por Nombre de Empresa o NIT (Opcional) */}
      <div className="rounded-lg border-2 border-accent/20 bg-accent/5 p-4 sm:p-5">
        <CompanyAutocomplete onSelect={selectCompany} />

        {/* Alerta de coincidencia */}
        {matchedCompany && (
          <div className="mt-3 flex items-start gap-2.5 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-foreground">
            <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-success">Empresa identificada en base de datos</p>
              <p className="text-muted-foreground mt-0.5">
                Razón Social: <strong className="text-foreground">{matchedCompany.name}</strong> | NIT:{" "}
                <span className="font-mono">
                  {matchedCompany.nit ? formatNit(matchedCompany.nit) : "sin registrar"}
                </span>
                . Todos los datos continúan <strong className="text-foreground">100% editables</strong> para
                sobreescritura.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="KAM Asignado" hint="La solicitud siempre queda a tu nombre como remitente — no es editable.">
          <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm text-foreground">
            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="font-medium truncate">{data.kam}</span>
          </div>
        </Field>

        <Field
          label="Razón Social / Nombre de la empresa"
          required
          hint={!errors.empresaNombre ? "Nombre comercial o legal completo de la organización" : undefined}
          id="empresa-nombre"
        >
          <FieldErrorFrame show={!!errors.empresaNombre}>
            <Input
              id="empresa-nombre"
              placeholder="Ej. Bancolombia S.A."
              value={data.empresaNombre}
              onChange={(e) => update("empresaNombre", e.target.value)}
            />
          </FieldErrorFrame>
          {errors.empresaNombre && <FieldErrorText>{errors.empresaNombre}</FieldErrorText>}
        </Field>

        <Field
          label="NIT de la Empresa"
          showOptionalBadge
          hint="Número de Identificación Tributaria (opcional si aún no se tiene)"
          id="empresa-nit"
        >
          <Input
            id="empresa-nit"
            placeholder="Ej. 890900608-9 (opcional)"
            value={data.nit}
            onChange={(e) => update("nit", e.target.value)}
            className="font-mono text-sm"
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

        {/* CIIU Principal Opcional */}
        <div className="md:col-span-2 rounded-md border border-border bg-secondary/30 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Actividad Económica Principal (Código CIIU)"
              showOptionalBadge
              hint="Código numérico opcional (CIIU Rev. 4 A.C.)"
              id="ciiu-principal"
            >
              <div className="relative">
                <Input
                  id="ciiu-principal"
                  placeholder="Ej. 8544 (opcional)"
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

          <Button type="button" variant="outline" size="sm" onClick={addSecondaryCiiu} className="text-xs font-medium">
            <Plus className="h-3.5 w-3.5 mr-1.5" />+ Agregar otra actividad económica
          </Button>
        </div>

        <div className="md:col-span-2">
          <Field
            label="Naturaleza jurídica de la empresa"
            required
            hint={
              !errors.tipoEmpresa
                ? "Selección consciente: para empresas nuevas no se asume un valor por defecto"
                : undefined
            }
          >
            <FieldErrorFrame show={!!errors.tipoEmpresa}>
              <RadioGroup
                id="tipo-empresa-group"
                options={["Pública", "Privada", "Mixta", "Sin ánimo de lucro"]}
                value={data.tipoEmpresa}
                onChange={(v) => update("tipoEmpresa", v)}
                columns={4}
              />
            </FieldErrorFrame>
            {errors.tipoEmpresa && <FieldErrorText>{errors.tipoEmpresa}</FieldErrorText>}
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
  const addAdditionalContact = () => {
    const newContact: ClientContact = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombre: "",
      cargo: "",
      telefono: "",
      correo: "",
      area: "",
    };
    update("contactosAdicionales", [...(data.contactosAdicionales || []), newContact]);
    toast.success("Nuevo contacto añadido para la empresa.");
  };

  const removeAdditionalContact = (id: string) => {
    update(
      "contactosAdicionales",
      (data.contactosAdicionales || []).filter((c) => c.id !== id),
    );
  };

  const updateAdditionalContact = (id: string, field: keyof ClientContact, val: string) => {
    update(
      "contactosAdicionales",
      (data.contactosAdicionales || []).map((c) => (c.id === id ? { ...c, [field]: val } : c)),
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="2. Contacto del Cliente"
        description="Datos del interlocutor comercial y equipo de la empresa. Los campos no son obligatorios al inicio y puedes registrar múltiples contactos según las áreas involucradas."
      />

      {/* Tarjeta de Contacto Principal */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">
              1
            </div>
            <h3 className="text-sm font-semibold text-foreground">Contacto Principal / Interlocutor</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
            Opcional
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nombre completo del contacto" showOptionalBadge id="contacto-nombre">
            <Input
              id="contacto-nombre"
              placeholder="Ej. Carlos Arturo Ramírez (opcional)"
              value={data.contactoNombre}
              onChange={(e) => update("contactoNombre", e.target.value)}
            />
          </Field>

          <Field label="Cargo del contacto" showOptionalBadge hint="Posición dentro de la empresa" id="contacto-cargo">
            <Input
              id="contacto-cargo"
              placeholder="Ej. Gerente de Talento Humano"
              value={data.cargo}
              onChange={(e) => update("cargo", e.target.value)}
            />
          </Field>

          <Field
            label="Teléfono de contacto principal"
            showOptionalBadge
            hint="Celular o teléfono directo"
            id="contacto-tel"
          >
            <Input
              id="contacto-tel"
              placeholder="Ej. +57 315 889 4433"
              value={data.telefono}
              onChange={(e) => update("telefono", e.target.value)}
            />
          </Field>

          <Field
            label="Teléfono de contacto secundario"
            showOptionalBadge
            hint="Línea alternativa o de oficina"
            id="contacto-tel2"
          >
            <Input
              id="contacto-tel2"
              placeholder="Ej. +57 (602) 667 5000 ext. 124"
              value={data.telefonoSecundario}
              onChange={(e) => update("telefonoSecundario", e.target.value)}
            />
          </Field>

          <Field
            label="Correo electrónico institucional"
            showOptionalBadge
            hint="Email para cotizaciones o seguimiento"
            id="contacto-email"
          >
            <Input
              id="contacto-email"
              type="email"
              placeholder="carlos.ramirez@empresa.com"
              value={data.correo}
              onChange={(e) => update("correo", e.target.value)}
            />
          </Field>

          <Field
            label="Correo electrónico alternativo"
            showOptionalBadge
            hint="Email secundario o asistente"
            id="contacto-email2"
          >
            <Input
              id="contacto-email2"
              type="email"
              placeholder="asistente.rrhh@empresa.com"
              value={data.correoAlternativo}
              onChange={(e) => update("correoAlternativo", e.target.value)}
            />
          </Field>

          <div className="md:col-span-2">
            <Field
              label="Área o dependencia"
              showOptionalBadge
              hint="Dirección, gerencia o departamento solicitante"
              id="contacto-area"
            >
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

      {/* Sección de Múltiples Contactos */}
      <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              Contactos adicionales de la empresa{" "}
              {data.contactosAdicionales && data.contactosAdicionales.length > 0
                ? `(${data.contactosAdicionales.length})`
                : ""}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              En una misma empresa puedes gestionar solicitudes con diferentes contactos, áreas o tomadores de decisión.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAdditionalContact}
            className="text-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto bg-card"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar otro contacto
          </Button>
        </div>

        {data.contactosAdicionales && data.contactosAdicionales.length > 0 ? (
          <div className="space-y-3 pt-2">
            {data.contactosAdicionales.map((c, idx) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4 space-y-3 relative shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-foreground text-[11px] font-bold border border-border">
                      {idx + 2}
                    </span>
                    Contacto adicional {c.nombre ? `· ${c.nombre}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAdditionalContact(c.id)}
                    className="text-xs text-destructive hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nombre completo</Label>
                    <Input
                      placeholder="Ej. Ana María Gómez"
                      value={c.nombre}
                      onChange={(e) => updateAdditionalContact(c.id, "nombre", e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cargo</Label>
                    <Input
                      placeholder="Ej. Líder de Formación"
                      value={c.cargo}
                      onChange={(e) => updateAdditionalContact(c.id, "cargo", e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Área / Dependencia</Label>
                    <Input
                      placeholder="Ej. Gestión Humana"
                      value={c.area}
                      onChange={(e) => updateAdditionalContact(c.id, "area", e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Teléfono / Celular</Label>
                    <Input
                      placeholder="Ej. +57 310 555 1234"
                      value={c.telefono}
                      onChange={(e) => updateAdditionalContact(c.id, "telefono", e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Correo electrónico</Label>
                    <Input
                      type="email"
                      placeholder="ana.gomez@empresa.com"
                      value={c.correo}
                      onChange={(e) => updateAdditionalContact(c.id, "correo", e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* -------------- Step 3: Requerimiento del Servicio -------------- */

function Step3({
  data,
  update,
  errors,
}: {
  data: RequestFormData;
  update: <K extends keyof RequestFormData>(k: K, v: RequestFormData[K]) => void;
  errors: Record<string, string>;
}) {
  // Autofoco + scroll suave al campo de texto al elegir "Otro", sin clics extra
  const otroInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (data.tipoReq === "Otro") {
      otroInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      otroInputRef.current?.focus({ preventScroll: true });
    }
  }, [data.tipoReq]);

  const [showAdvanced, setShowAdvanced] = useState(() => {
    return Boolean(
      data.horas ||
      data.modalidad ||
      data.alimentacion ||
      data.necesidad ||
      data.competencias ||
      data.areaParticipantes ||
      data.resultados ||
      data.exito,
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
            <h3 className="text-sm font-semibold text-foreground">Asignación Académica Institucional</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nodo Asignado"
              showOptionalBadge
              hint="Nodo temático de la Universidad Icesi (opcional / por definir)"
              id="nodo-select"
            >
              <Select
                value={data.nodo}
                onValueChange={(v) => {
                  const val = v === "none" ? "" : v;
                  update("nodo", val);
                  // Asociación inteligente por Nodo: preselecciona automáticamente el líder sugerido para este nodo
                  if (val && NODE_DEFAULT_LEADERS[val]) {
                    update("ldp", NODE_DEFAULT_LEADERS[val]);
                  }
                }}
              >
                <SelectTrigger id="nodo-select" className="bg-card">
                  <SelectValue placeholder="Selecciona un nodo (opcional / por definir)" />
                </SelectTrigger>
                <SelectContent>
                  {data.nodo && (
                    <SelectItem value="none" className="text-muted-foreground italic">
                      -- Por definir / Sin asignar --
                    </SelectItem>
                  )}
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
                        <span>
                          Líder sugerido por el nodo: <strong>{suggestedLeader}</strong>.
                        </span>
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
                        <span>
                          Sugerido para este nodo: <strong>{suggestedLeader}</strong>.
                        </span>
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
                  <Select value={data.ldp || ""} onValueChange={(v) => update("ldp", v === "none" ? "" : v)}>
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
          hint={
            !errors.nombreReq
              ? "Nombre de referencia comercial (ej. Programa Ejecutivo en Liderazgo y Toma de Decisiones)"
              : undefined
          }
          id="nombre-req"
        >
          <FieldErrorFrame show={!!errors.nombreReq}>
            <Input
              id="nombre-req"
              placeholder="Ej. Diplomado en Inteligencia Artificial y Eficiencia Operacional"
              value={data.nombreReq}
              onChange={(e) => update("nombreReq", e.target.value)}
            />
          </FieldErrorFrame>
          {errors.nombreReq && <FieldErrorText>{errors.nombreReq}</FieldErrorText>}
        </Field>

        {/* Tipo de Requerimiento */}
        <Field
          label="Tipo de Requerimiento"
          required
          hint={!errors.tipoReq ? "Modalidad formal de relacionamiento y oferta de valor" : undefined}
          id="tipo-req"
        >
          <FieldErrorFrame show={!!errors.tipoReq}>
            <Select value={data.tipoReq} onValueChange={(v) => update("tipoReq", v as RequestType)}>
              <SelectTrigger id="tipo-req" className="bg-card">
                <SelectValue placeholder="Seleccione el tipo de requerimiento..." />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldErrorFrame>
          {errors.tipoReq && <FieldErrorText>{errors.tipoReq}</FieldErrorText>}
        </Field>

        {/* Condicional 'Otro' */}
        {data.tipoReq === "Otro" && (
          <div className="rounded-md border border-accent/40 bg-accent/10 p-4">
            <Field
              label="Especifique el tipo de requerimiento"
              required
              hint={
                !errors.tipoReqOtro
                  ? "Indique con claridad el formato del servicio que no encaja en las categorías estándar"
                  : undefined
              }
              id="tipo-otro-input"
            >
              <FieldErrorFrame show={!!errors.tipoReqOtro}>
                <Input
                  id="tipo-otro-input"
                  ref={otroInputRef}
                  placeholder="Ej. Hackathon empresarial, Rueda de negocios, Pasantía tecnológica..."
                  value={data.tipoReqOtro}
                  onChange={(e) => update("tipoReqOtro", e.target.value)}
                  className="bg-card"
                />
              </FieldErrorFrame>
              {errors.tipoReqOtro && <FieldErrorText>{errors.tipoReqOtro}</FieldErrorText>}
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
                <span className="text-sm font-semibold text-foreground">Detalles logísticos y de diagnóstico</span>
                {filledAdvancedCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    {filledAdvancedCount} dato{filledAdvancedCount > 1 ? "s" : ""} agregado
                    {filledAdvancedCount > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
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

                <Field label="Modalidad de ejecución" hint="Lugar y dinámica de las sesiones" id="modalidad-select">
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

                <div className="sm:col-span-2">
                  <Field
                    label="Servicio de alimentación y logística"
                    showOptionalBadge
                    hint="Campo abierto: detalle requerimientos de refrigerios, almuerzos, estación de café permanente, transporte o kits especiales"
                    id="alimentacion-input"
                  >
                    <Textarea
                      id="alimentacion-input"
                      rows={2}
                      placeholder="Ej. Refrigerio am y pm para 25 participantes, estación de café y agua permanente durante los 3 días, y kit de bienvenida institucional..."
                      value={data.alimentacion}
                      onChange={(e) => update("alimentacion", e.target.value)}
                      className="bg-card text-sm resize-y"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] font-medium text-muted-foreground">Sugerencias rápidas:</span>
                      {[
                        "Refrigerios AM/PM",
                        "Almuerzos de trabajo",
                        "Estación de café y agua",
                        "Kit de materiales / bienvenida",
                        "Salón con proyector y audio",
                        "No requiere logística",
                      ].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const cur = data.alimentacion.trim();
                            if (!cur) {
                              update("alimentacion", item);
                            } else if (!cur.toLowerCase().includes(item.toLowerCase())) {
                              update("alimentacion", `${cur}, ${item}`);
                            }
                          }}
                          className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground hover:border-accent/40 hover:text-foreground transition-colors"
                        >
                          + {item}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            </div>

            {/* Diagnóstico y Objetivos */}
            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Diagnóstico y objetivos del proceso
                  </h4>
                </div>
                <span className="text-[11px] text-muted-foreground">Sin límite de caracteres</span>
              </div>

              <div className="space-y-4">
                <Field
                  label="Necesidad u oportunidad identificada"
                  showOptionalBadge
                  hint="Situación, motivación o reto estratégico que la empresa busca abordar (puedes pegar textos o diagnósticos extensos sin restricción)"
                >
                  <div className="space-y-1.5">
                    <Textarea
                      rows={4}
                      placeholder="Describa la situación o motivación principal de la organización (diagnóstico, expectativas, contexto del reto comercial, requerimientos del cliente)..."
                      value={data.necesidad}
                      onChange={(e) => update("necesidad", e.target.value)}
                      className="bg-card resize-y min-h-[100px] text-sm"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        Campo libre y expansible para especificaciones completas
                      </span>
                      {data.necesidad.length > 0 && (
                        <span className="font-mono text-muted-foreground">
                          {data.necesidad.length} caracteres redactados
                        </span>
                      )}
                    </div>
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Competencias a fortalecer" hint="Habilidades o conocimientos prioritarios">
                    <Input
                      placeholder="Ej. Pensamiento analítico, Negociación..."
                      value={data.competencias}
                      onChange={(e) => update("competencias", e.target.value)}
                      className="bg-card"
                    />
                  </Field>

                  <Field label="Perfil o área de los participantes" hint="Público o cargos a quienes va dirigido">
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
  errors,
}: {
  data: RequestFormData;
  update: <K extends keyof RequestFormData>(k: K, v: RequestFormData[K]) => void;
  errors: Record<string, string>;
}) {
  const { requests } = useAuth();
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [proposalTab, setProposalTab] = useState<"todas" | "entregadas" | "en_proceso">("todas");
  const [selectedProposalModal, setSelectedProposalModal] = useState<RequestItem | null>(null);

  // Coincidencias de propuestas de la empresa activa o buscada
  const activeCompanyQuery = (historySearchTerm.trim() || data.empresaNombre.trim()).toLowerCase();

  const companyProposals = useMemo(() => {
    if (!activeCompanyQuery || activeCompanyQuery.length < 2) return [];
    const tokens = activeCompanyQuery.split(/\s+/).filter((w) => w.length >= 2);

    return requests.filter((r) => {
      const comp = (r.company || "").toLowerCase();
      if (comp.includes(activeCompanyQuery) || activeCompanyQuery.includes(comp)) return true;
      if (tokens.length > 1 && tokens.every((term) => comp.includes(term))) return true;
      if (tokens.some((term) => term.length >= 4 && comp.includes(term))) return true;
      return false;
    });
  }, [requests, activeCompanyQuery]);

  const deliveredProposals = useMemo(
    () => companyProposals.filter((p) => p.status === "entregada"),
    [companyProposals],
  );
  const inProgressProposals = useMemo(
    () => companyProposals.filter((p) => p.status !== "entregada"),
    [companyProposals],
  );

  const displayedProposals = useMemo(() => {
    if (proposalTab === "entregadas") return deliveredProposals;
    if (proposalTab === "en_proceso") return inProgressProposals;
    return companyProposals;
  }, [proposalTab, deliveredProposals, inProgressProposals, companyProposals]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="4. Formación Previa"
        description="Antecedentes y capacitaciones recibidas con anterioridad por el equipo o la empresa."
      />

      <div className="space-y-6">
        {/* 1. Opción Sí / No / No sé */}
        <div className="space-y-4">
          <Field label="¿La empresa o equipo ha tenido formación previa sobre esta temática?" required>
            <FieldErrorFrame show={!!errors.formacionPrevia}>
              <RadioGroup
                id="formacion-previa-group"
                options={["Sí", "No", "No sé"]}
                value={data.formacionPrevia}
                onChange={(v) => update("formacionPrevia", v as "Sí" | "No" | "No sé")}
                columns={3}
              />
            </FieldErrorFrame>
            {errors.formacionPrevia && <FieldErrorText>{errors.formacionPrevia}</FieldErrorText>}
          </Field>

          {data.formacionPrevia === "Sí" ? (
            <div className="rounded-md border border-border bg-secondary/30 p-4 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <GraduationCap className="h-4 w-4 text-accent" />
                Detalle de los antecedentes de formación
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Descripción del programa anterior"
                    hint="Nombre o temática del curso/consultoría previa"
                  >
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
                  <Input type="date" value={data.fechaPrevia} onChange={(e) => update("fechaPrevia", e.target.value)} />
                </Field>
              </div>
            </div>
          ) : data.formacionPrevia === "No sé" ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-foreground flex items-start gap-3">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  Información previa no disponible o por verificar
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  El KAM no tiene certeza sobre antecedentes previos de capacitación en la empresa. Este aspecto se
                  verificará durante la etapa de diagnóstico o en la sesión de alineación técnica con el cliente.
                </p>
              </div>
            </div>
          ) : data.formacionPrevia === "No" ? (
            <div className="rounded-md border border-border/80 bg-secondary/20 p-4 text-xs text-muted-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-muted-foreground" />
              No se registran antecedentes previos. Se formulará la propuesta desde nivel inicial/diagnóstico.
            </div>
          ) : null}
        </div>

        {/* 2. Nivel de urgencia en que requieren la solicitud */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-xs">
          <Field
            label="Nivel de urgencia en que requieren la solicitud"
            required
            hint={
              !errors.urgencia
                ? "Identifica la prioridad y tiempos de respuesta esperados para la formulación y entrega de la propuesta"
                : undefined
            }
            id="urgencia-select"
          >
            <FieldErrorFrame show={!!errors.urgencia}>
              <div id="urgencia-group" className="grid grid-cols-3 gap-3 pt-1">
                {[
                  {
                    id: "baja" as const,
                    label: "Bajo",
                    desc: "Tiempos estándar de formulación",
                    activeClasses:
                      "border-muted-foreground/50 bg-secondary text-foreground font-bold ring-2 ring-muted-foreground/30",
                    dot: "bg-muted-foreground",
                  },
                  {
                    id: "media" as const,
                    label: "Medio",
                    desc: "Prioridad habitual / 5-7 días hábiles",
                    activeClasses:
                      "border-[#e4eb60] bg-[#e4eb60]/25 text-foreground dark:text-[#e4eb60] font-bold ring-2 ring-[#e4eb60]/40",
                    dot: "bg-[#e4eb60]",
                  },
                  {
                    id: "alta" as const,
                    label: "Alto",
                    desc: "Urgente / Licitación / Fecha fija inmediata",
                    activeClasses: "border-[#e9683b] bg-[#e9683b]/15 text-[#e9683b] font-bold ring-2 ring-[#e9683b]/30",
                    dot: "bg-[#e9683b]",
                  },
                ].map((opt) => {
                  const isSelected = data.urgencia === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => update("urgencia", opt.id)}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all text-xs cursor-pointer",
                        isSelected
                          ? opt.activeClasses
                          : "border-border bg-card text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2.5 w-2.5 rounded-full", opt.dot)} />
                        <span className="text-sm font-semibold">{opt.label}</span>
                      </div>
                      <span className="text-[11px] opacity-75 mt-1">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </FieldErrorFrame>
            {errors.urgencia && <FieldErrorText>{errors.urgencia}</FieldErrorText>}
          </Field>
        </div>

        {/* 3. Buscador de propuestas entregadas y en proceso de la empresa */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5454e9]/10 text-[#5454e9] dark:text-[#865cf0]">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Buscador de Propuestas Entregadas y en Proceso
                  {companyProposals.length > 0 && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                      {companyProposals.length} encontrada{companyProposals.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Identifica las propuestas que Icesi ya entregó o tiene en proceso para esta empresa (ej. antecedentes
                  o evitar duplicidades).
                </p>
              </div>
            </div>

            {/* Buscador directo por nombre de empresa */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa (ej. Gases de Occidente)..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="h-8.5 pl-8 pr-7 text-xs bg-secondary/30"
              />
              {historySearchTerm && (
                <button
                  type="button"
                  onClick={() => setHistorySearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Resultados del buscador */}
          {activeCompanyQuery ? (
            companyProposals.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground font-medium">Filtrar estado:</span>
                    <div className="inline-flex rounded-lg border border-border p-0.5 bg-secondary/30">
                      <button
                        type="button"
                        onClick={() => setProposalTab("todas")}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs transition-colors",
                          proposalTab === "todas"
                            ? "bg-card text-foreground shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        Todas ({companyProposals.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProposalTab("entregadas")}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs transition-colors",
                          proposalTab === "entregadas"
                            ? "bg-[#865cf0]/15 text-[#7344e8] dark:text-[#865cf0] shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        Entregadas ({deliveredProposals.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProposalTab("en_proceso")}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs transition-colors",
                          proposalTab === "en_proceso"
                            ? "bg-[#4cb979]/15 text-[#2d8f55] dark:text-[#4cb979] shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        En Proceso ({inProgressProposals.length})
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Empresa consultada:{" "}
                    <strong className="text-foreground">{data.empresaNombre || historySearchTerm}</strong>
                  </div>
                </div>

                {/* Lista de propuestas encontradas */}
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {displayedProposals.map((item) => {
                    const statusInfo = STATUS_META[item.status];
                    const urgencyInfo = URGENCY_META[item.urgency];
                    const hasClientDocs = item.clientKamDocuments && item.clientKamDocuments.length > 0;

                    return (
                      <div
                        key={item.id}
                        className="group rounded-lg border border-border bg-card p-3.5 transition-all hover:border-accent/40 hover:shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-foreground">{item.id}</span>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border",
                                  statusInfo.tone,
                                )}
                              >
                                <span className={cn("h-1.5 w-1.5 rounded-full", statusInfo.dot)} />
                                {statusInfo.label}
                              </span>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-1.5 py-0.2 text-[10px] font-medium border",
                                  urgencyInfo.tone,
                                )}
                              >
                                Urgencia: {urgencyInfo.label}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-medium bg-secondary px-2 py-0.5 rounded">
                                {item.type}
                              </span>
                            </div>

                            <h4 className="text-sm font-semibold text-foreground truncate">{item.title}</h4>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>
                                Empresa: <strong className="text-foreground">{item.company}</strong>
                              </span>
                              <span>
                                Nodo: <strong className="text-foreground">{item.node}</strong>
                              </span>
                              <span>
                                Líder: <strong className="text-foreground">{item.productLeader}</strong>
                              </span>
                              <span>
                                Valor:{" "}
                                <strong className="text-foreground font-mono">
                                  {formatCop(item.totalCostCop ?? 0)}
                                </strong>
                              </span>
                              {item.deadline && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Entrega: {item.deadline}
                                </span>
                              )}
                              {hasClientDocs && (
                                <span className="text-accent font-medium flex items-center gap-1">
                                  <FileText className="h-3 w-3" /> {item.clientKamDocuments!.length} doc(s)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-1 sm:pt-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProposalModal(item)}
                              className="h-8 text-xs font-semibold gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Ver detalle
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-center">
                <p className="text-xs font-medium text-foreground">
                  No se encontraron propuestas registradas para &ldquo;{data.empresaNombre || historySearchTerm}&rdquo;
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  No constan propuestas previas entregadas ni solicitudes en curso para esta entidad.
                </p>
              </div>
            )
          ) : (
            <div className="rounded-lg border border-dashed border-border/80 bg-secondary/15 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  Escribe en el buscador el nombre de la empresa para consultar sus propuestas entregadas y en proceso.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[11px] text-muted-foreground mr-1">Ejemplos:</span>
                {["Gases de Occidente", "Bancolombia", "Grupo Argos"].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setHistorySearchTerm(name)}
                    className="rounded border border-border bg-card px-2 py-0.5 text-[11px] hover:border-accent hover:text-foreground transition-colors cursor-pointer"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal de Detalle de Propuesta */}
        <Dialog
          open={!!selectedProposalModal}
          onOpenChange={(open) => {
            if (!open) setSelectedProposalModal(null);
          }}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-muted-foreground">{selectedProposalModal?.id}</span>
                {selectedProposalModal && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border",
                      STATUS_META[selectedProposalModal.status].tone,
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[selectedProposalModal.status].dot)} />
                    {STATUS_META[selectedProposalModal.status].label}
                  </span>
                )}
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-1">
                {selectedProposalModal?.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Empresa: <strong className="text-foreground">{selectedProposalModal?.company}</strong>
              </DialogDescription>
            </DialogHeader>

            {selectedProposalModal && (
              <div className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Tipo de Requerimiento</span>
                    <span className="font-semibold text-foreground">{selectedProposalModal.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Nivel de Urgencia</span>
                    <span className="font-semibold text-foreground capitalize">{selectedProposalModal.urgency}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Nodo Asignado</span>
                    <span className="font-semibold text-foreground">{selectedProposalModal.node}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Líder de Producto</span>
                    <span className="font-semibold text-foreground">{selectedProposalModal.productLeader}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">KAM a cargo</span>
                    <span className="font-semibold text-foreground">{selectedProposalModal.kam}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Valor de la Oferta</span>
                    <span className="font-bold text-foreground font-mono text-sm">
                      {formatCop(selectedProposalModal.totalCostCop ?? 0)}
                    </span>
                  </div>
                </div>

                {selectedProposalModal.clientKamDocuments && selectedProposalModal.clientKamDocuments.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-accent" /> Documentos de la propuesta
                    </span>
                    <div className="space-y-1">
                      {selectedProposalModal.clientKamDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 rounded-md border border-border bg-card text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground truncate">{doc.name}</span>
                            <span className="text-muted-foreground text-[10px]">({doc.size})</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{doc.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedProposalModal(null)}
                className="text-xs"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
    update(
      "archivos",
      data.archivos.filter((f) => f.id !== id),
    );
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
              : "border-border bg-secondary/20 hover:border-accent/50 hover:bg-secondary/40",
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
            Arrastra tus documentos aquí o{" "}
            <span className="text-accent underline font-semibold">haz clic para examinar</span>
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
        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Resumen de la Solicitud</h4>
        <dl className="grid gap-2 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Empresa / Razón Social:</dt>
            <dd className="font-semibold text-foreground truncate">{data.empresaNombre || "Sin especificar"}</dd>
            <dt className="text-muted-foreground mt-1">NIT:</dt>
            <dd className="font-mono text-foreground">{data.nit || "No registrado"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Contacto:</dt>
            <dd className="font-medium text-foreground truncate">
              {data.contactoNombre ||
                (data.contactosAdicionales.length > 0 ? data.contactosAdicionales[0].nombre : "Por definir")}
              {data.contactosAdicionales.length > 0
                ? ` (+${data.contactosAdicionales.length} adicional${data.contactosAdicionales.length > 1 ? "es" : ""})`
                : ""}
            </dd>
            <dt className="text-muted-foreground mt-1">Nodo Asignado:</dt>
            <dd className="font-medium text-accent truncate">{data.nodo || "Sin asignar"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tipo de Requerimiento:</dt>
            <dd className="font-medium text-foreground">
              {data.tipoReq === "Otro" && data.tipoReqOtro
                ? `Otro (${data.tipoReqOtro})`
                : data.tipoReq || "Sin especificar"}
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
                  <p className="text-muted-foreground">
                    El docente y líder asignados recibirán la alerta en su tablero.
                  </p>
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
