import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone } from "@/components/icons";
import type { RequestItem } from "@/lib/mock-data";

interface AdvisorContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RequestItem;
  /** The Product Leader sees everything she typed (including the identity document); the KAM only the contact fields. */
  isLeader: boolean;
  /** The assignment can still be changed (`canEditProfessor`): shows the action that reopens the form. */
  canChange: boolean;
  onChange: () => void;
}

const LABEL = "text-[10px] font-medium uppercase tracking-wider text-slate-400 block";

/** Quick read-only view of the assigned professor/advisor's data (either kind). */
export function AdvisorContactDialog({
  open,
  onOpenChange,
  request,
  isLeader,
  canChange,
  onChange,
}: AdvisorContactDialogProps) {
  const data = request.externalProfessorData;
  const isExternal = request.professorType === "externo";
  const organization = isExternal ? data?.empresaConsultora : data?.facultad;
  const hasContact = Boolean(data?.correo || data?.telefono || data?.perfil || (isLeader && data?.identificacion));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl border border-slate-200/80 p-6 shadow-lg dark:border-border dark:bg-card">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {isExternal ? "Contacto del Asesor Externo" : "Contacto del Docente"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isLeader
              ? "Datos registrados del docente o asesor para coordinación académica y administrativa."
              : "Datos de contacto del docente o asesor en modo solo lectura."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-xs">
          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 space-y-2.5 dark:border-border dark:bg-secondary/20">
            <div>
              <span className={LABEL}>Nombre Completo</span>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {data?.nombre || request.professor}
              </p>
            </div>

            {organization && (
              <div>
                <span className={LABEL}>{isExternal ? "Empresa / Consultora" : "Facultad"}</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{organization}</p>
              </div>
            )}

            {isLeader && data?.identificacion && (
              <div>
                <span className={LABEL}>Cédula / Identificación / NIT</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{data.identificacion}</p>
              </div>
            )}

            {data?.correo && (
              <div className="pt-1">
                <span className={LABEL}>Correo Electrónico</span>
                <a
                  href={`mailto:${data.correo}`}
                  className="text-primary hover:underline font-medium flex items-center gap-1.5"
                >
                  <Mail className="h-3 w-3" />
                  {data.correo}
                </a>
              </div>
            )}

            {data?.telefono && (
              <div className="pt-1">
                <span className={LABEL}>Teléfono de Contacto</span>
                <a
                  href={`tel:${data.telefono}`}
                  className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 hover:text-primary"
                >
                  <Phone className="h-3 w-3" />
                  {data.telefono}
                </a>
              </div>
            )}

            {data?.perfil && (
              <div className="pt-1">
                <span className={LABEL}>Perfil Profesional</span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{data.perfil}</p>
              </div>
            )}

            {!hasContact && (
              <p className="pt-1 italic text-slate-500">Aún no hay datos de contacto registrados para esta persona.</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {isLeader && !canChange && (
              <span
                className="mr-auto self-center text-[10px] italic text-muted-foreground"
                title='No editable: la solicitud ya pasó por "En proceso por experto"'
              >
                No editable
              </span>
            )}
            {isLeader && canChange && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium"
                onClick={() => {
                  onOpenChange(false);
                  onChange();
                }}
              >
                Cambiar docente / asesor
              </Button>
            )}
            <Button size="sm" className="h-8 text-xs font-medium" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
