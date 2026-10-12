import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RequestItem, ExternalProfessorData } from "@/lib/mock-data";
import { GraduationCap, Briefcase, UserCheck, Check, Mail, Phone, Building } from "@/components/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import type { Professor, ProfessorType } from "@/lib/api/professors";
import {
  EMPTY_PROFESSOR_FORM,
  professorToFormValues,
  toProfessorData,
  validateProfessorForm,
  type ProfessorFormErrors,
  type ProfessorFormValues,
} from "@/lib/professor-form";
import { ProfessorNameField } from "./ProfessorNameField";

interface AdvisorAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestItem;
  /**
   * Called with what the product leader typed or picked. `professorId` is set only when she picked an entry
   * of the directory; otherwise the page sends the typed data and the backend creates or reuses the entry.
   * May return a promise: the modal stays open (and disabled) until it settles, and a rejection is shown
   * as an error toast without closing it.
   */
  onSaveAssignment: (
    professorName: string,
    type: "planta" | "externo",
    data?: ExternalProfessorData,
    professorId?: string,
  ) => void | Promise<void>;
  /**
   * Only given while the request is still "nueva": it adds a "Guardar y avanzar a experto" button that saves the
   * assignment and then moves the request on, so the leader does it in one click. "Solo guardar" keeps the stage.
   */
  onAdvanceToExpert?: () => void | Promise<void>;
}

const KINDS: { value: ProfessorType; label: string; icon: typeof GraduationCap }[] = [
  { value: "STAFF", label: "Profesor de planta (Icesi)", icon: GraduationCap },
  { value: "EXTERNAL", label: "Consultor / docente externo", icon: Briefcase },
];

function describeSaveError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return "No tienes permiso para asignar el docente de esta solicitud.";
    if (error.status === 409) {
      return "La solicitud ya no permite cambiar el docente o asesor. Recarga la página e intenta de nuevo.";
    }
  }
  return "No pudimos asignar el docente o asesor. Revisa los datos e intenta de nuevo.";
}

export function AdvisorAssignmentModal({
  isOpen,
  onClose,
  request,
  onSaveAssignment,
  onAdvanceToExpert,
}: AdvisorAssignmentModalProps) {
  const [values, setValues] = useState<ProfessorFormValues>(EMPTY_PROFESSOR_FORM);
  // The directory entry whose data fills the form; while set, the fields are read-only.
  const [selected, setSelected] = useState<Professor | null>(null);
  const [errors, setErrors] = useState<ProfessorFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [focusName, setFocusName] = useState(false);

  // Every time the modal opens the form starts empty: the backend never updates an existing entry, so the
  // current assignment is only shown as a hint, never loaded as editable data.
  useEffect(() => {
    if (isOpen) {
      setValues(EMPTY_PROFESSOR_FORM);
      setSelected(null);
      setErrors({});
      setFocusName(false);
    }
  }, [isOpen]);

  const readOnly = selected !== null;
  const disabled = isSaving;

  const setField = <K extends keyof ProfessorFormValues>(key: K, value: ProfessorFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "fullName" || key === "email") setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSelect = (professor: Professor) => {
    setSelected(professor);
    setValues(professorToFormValues(professor));
    setErrors({});
  };

  // "Cambiar": drop the picked entry and type again from scratch (the kind stays as it was).
  const handleClearSelection = () => {
    setSelected(null);
    setValues((current) => ({ ...EMPTY_PROFESSOR_FORM, type: current.type }));
    setErrors({});
    setFocusName(true);
  };

  const handleKindKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (readOnly || disabled) return;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const next: ProfessorType = values.type === "STAFF" ? "EXTERNAL" : "STAFF";
    setField("type", next);
    document.getElementById(`advisor-kind-${next}`)?.focus();
  };

  const submit = async (advance: boolean) => {
    if (isSaving) return;

    const found = validateProfessorForm(values);
    setErrors(found);
    const firstError = found.fullName ?? found.email;
    if (firstError) {
      toast.error(firstError);
      return;
    }

    const kind = values.type === "STAFF" ? "planta" : "externo";
    const data = toProfessorData(values);
    setIsSaving(true);
    try {
      await onSaveAssignment(data.nombre, kind, data, selected?.id);
    } catch (error) {
      toast.error(describeSaveError(error));
      setIsSaving(false);
      return;
    }
    if (advance && onAdvanceToExpert) {
      try {
        await onAdvanceToExpert();
      } catch {
        // The professor is already saved: say so, and let the leader advance from the detail page.
        setIsSaving(false);
        toast.error(
          `${data.nombre} quedó asignado, pero no se pudo avanzar a "En proceso por experto". Inténtalo desde el botón de la solicitud.`,
        );
        onClose();
        return;
      }
      setIsSaving(false);
      toast.success(`${data.nombre} asignado y solicitud en "En proceso por experto"`);
      onClose();
      return;
    }
    setIsSaving(false);
    toast.success(`${data.nombre} asignado como docente o asesor`);
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(false);
  };

  const readOnlyClass = readOnly ? "bg-muted/40" : undefined;
  const isStaff = values.type === "STAFF";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <UserCheck className="h-5 w-5" />
            <DialogTitle className="text-lg">Asignación del Docente / Consultor</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Escribe los datos del docente o asesor que liderará esta propuesta. Si ya está en el directorio, elígelo
            mientras escribes el nombre y se reutiliza su registro sin modificarlo.{" "}
            {onAdvanceToExpert
              ? "Puedes guardar y avanzar a experto de una vez, o solo guardar."
              : "Guardar asigna el docente; el estado de la solicitud no cambia."}
          </DialogDescription>
        </DialogHeader>

        <form id="advisor-assignment-form" onSubmit={handleSubmit} noValidate className="mt-2 space-y-3.5">
          {request.professor && (
            <p className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              Asignado actualmente: <strong className="text-foreground">{request.professor}</strong>
              {request.professorType === "externo" ? " (externo)" : " (planta)"}. Al guardar se reemplaza y queda en el
              historial.
            </p>
          )}

          <div role="radiogroup" aria-label="Tipo de docente o asesor" className="grid grid-cols-2 gap-1.5">
            {KINDS.map(({ value, label, icon: Icon }) => {
              const checked = values.type === value;
              return (
                <button
                  key={value}
                  id={`advisor-kind-${value}`}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={checked ? 0 : -1}
                  disabled={readOnly || disabled}
                  onClick={() => setField("type", value)}
                  onKeyDown={handleKindKeyDown}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
                    checked
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent/10",
                    !checked && (readOnly || disabled) && "opacity-50",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          {readOnly && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-accent/20 bg-accent/5 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                Registro existente del directorio: sus datos se muestran sin edición.
              </span>
              <Button type="button" variant="outline" size="sm" onClick={handleClearSelection} disabled={disabled}>
                Cambiar
              </Button>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {readOnly ? (
                <div className="space-y-1.5">
                  <Label htmlFor="advisor-name-selected" className="text-xs font-semibold">
                    Nombre completo *
                  </Label>
                  <Input
                    id="advisor-name-selected"
                    readOnly
                    value={values.fullName}
                    className={cn("text-xs", readOnlyClass)}
                  />
                </div>
              ) : (
                <ProfessorNameField
                  value={values.fullName}
                  onChange={(name) => setField("fullName", name)}
                  onSelect={handleSelect}
                  disabled={disabled}
                  error={errors.fullName}
                  autoFocus={focusName}
                />
              )}
            </div>

            {isStaff ? (
              <div className="space-y-1.5">
                <Label htmlFor="advisor-faculty" className="text-xs font-semibold">
                  Facultad
                </Label>
                <div className="relative">
                  <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="advisor-faculty"
                    placeholder="Ej: Ingeniería"
                    className={cn("pl-8 text-xs", readOnlyClass)}
                    value={values.faculty}
                    readOnly={readOnly}
                    disabled={disabled}
                    onChange={(e) => setField("faculty", e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="advisor-company" className="text-xs font-semibold">
                  Firma consultora o Institución
                </Label>
                <div className="relative">
                  <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="advisor-company"
                    placeholder="Ej: Valora Consultoría, Independiente"
                    className={cn("pl-8 text-xs", readOnlyClass)}
                    value={values.company}
                    readOnly={readOnly}
                    disabled={disabled}
                    onChange={(e) => setField("company", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="advisor-id" className="text-xs font-semibold">
                Cédula / Identificación / NIT
              </Label>
              <Input
                id="advisor-id"
                placeholder="Ej: CC 94.456.789 o Pasaporte"
                className={cn("text-xs", readOnlyClass)}
                value={values.identityDocument}
                readOnly={readOnly}
                disabled={disabled}
                onChange={(e) => setField("identityDocument", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="advisor-email" className="text-xs font-semibold">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="advisor-email"
                  type="email"
                  placeholder="correo@dominio.com"
                  className={cn("pl-8 text-xs", readOnlyClass)}
                  value={values.email}
                  readOnly={readOnly}
                  disabled={disabled}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "advisor-email-error" : undefined}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
              {errors.email && (
                <p id="advisor-email-error" role="alert" className="text-[11px] font-medium text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="advisor-phone" className="text-xs font-semibold">
                Teléfono / WhatsApp
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="advisor-phone"
                  placeholder="+57 315 123 4567"
                  className={cn("pl-8 text-xs", readOnlyClass)}
                  value={values.phone}
                  readOnly={readOnly}
                  disabled={disabled}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="advisor-profile" className="text-xs font-semibold">
                Especialidad / Perfil profesional
              </Label>
              <Textarea
                id="advisor-profile"
                rows={2}
                placeholder="Ej: Especialista en transformación digital y automatización de procesos."
                className={cn("text-xs resize-none", readOnlyClass)}
                value={values.profile}
                readOnly={readOnly}
                disabled={disabled}
                onChange={(e) => setField("profile", e.target.value)}
              />
            </div>
          </div>
        </form>

        {onAdvanceToExpert && (
          <p className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            <strong className="text-foreground">Guardar y avanzar a experto:</strong> el docente asignado queda como
            responsable de formular la temática y el cronograma antes del costeo. <strong>Solo guardar</strong> asigna
            el docente y no cambia la etapa.
          </p>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={disabled}>
            Cancelar
          </Button>
          {onAdvanceToExpert ? (
            <>
              <Button type="submit" form="advisor-assignment-form" variant="outline" size="sm" disabled={disabled}>
                Solo guardar
              </Button>
              <Button type="button" size="sm" disabled={disabled} onClick={() => void submit(true)}>
                <Check className="h-4 w-4 mr-1" />
                {isSaving ? "Guardando…" : "Guardar y avanzar a experto"}
              </Button>
            </>
          ) : (
            <Button type="submit" form="advisor-assignment-form" size="sm" disabled={disabled}>
              <Check className="h-4 w-4 mr-1" />
              {isSaving ? "Guardando…" : "Guardar asignación"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
