import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RequestItem, ExternalProfessorData } from "@/lib/mock-data";
import { GraduationCap, Briefcase, UserCheck, Check, Mail, Phone, Building, User } from "@/components/icons";
import { toast } from "sonner";
import { ProfessorPicker } from "@/components/ProfessorPicker";
import { useRegisterExternalProfessor } from "@/hooks/use-professor-search";
import { ApiError } from "@/lib/api/client";
import type { Professor } from "@/lib/api/professors";

interface AdvisorAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestItem;
  /**
   * `professorId` is the id of the professor directory entry. The board still keeps
   * the assignment locally (by name), so callers may ignore it until it talks to the API.
   */
  onSaveAssignment: (
    professorName: string,
    type: "planta" | "externo",
    externalData?: ExternalProfessorData,
    professorId?: string,
  ) => void;
}

export function AdvisorAssignmentModal({ isOpen, onClose, request, onSaveAssignment }: AdvisorAssignmentModalProps) {
  const [activeTab, setActiveTab] = useState<"planta" | "externo">(
    request.professorType === "externo" ? "externo" : "planta",
  );
  const registerExternal = useRegisterExternalProfessor();

  // Planta: the pick comes from the directory; the current assignment (if any) is only shown.
  const [selectedStaff, setSelectedStaff] = useState<Professor | null>(null);
  const currentPlantaProf = request.professorType === "planta" ? request.professor : undefined;

  // Externo: either a registered advisor picked from the directory (id set) or a new one typed by hand.
  const [selectedExternalId, setSelectedExternalId] = useState<string | null>(null);
  const [externoNombre, setExternoNombre] = useState(
    request.externalProfessorData?.nombre ?? (request.professorType === "externo" ? (request.professor ?? "") : ""),
  );
  const [externoIdentificacion, setExternoIdentificacion] = useState(
    request.externalProfessorData?.identificacion ?? "",
  );
  const [externoEmpresa, setExternoEmpresa] = useState(request.externalProfessorData?.empresaConsultora ?? "");
  const [externoCorreo, setExternoCorreo] = useState(request.externalProfessorData?.correo ?? "");
  const [externoTelefono, setExternoTelefono] = useState(request.externalProfessorData?.telefono ?? "");
  const [externoPerfil, setExternoPerfil] = useState(request.externalProfessorData?.perfil ?? "");

  // Sync state when request changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStaff(null);
      setSelectedExternalId(null);
      if (request.professorType === "externo") {
        setActiveTab("externo");
        setExternoNombre(request.externalProfessorData?.nombre ?? request.professor ?? "");
        setExternoIdentificacion(request.externalProfessorData?.identificacion ?? "");
        setExternoEmpresa(request.externalProfessorData?.empresaConsultora ?? "");
        setExternoCorreo(request.externalProfessorData?.correo ?? "");
        setExternoTelefono(request.externalProfessorData?.telefono ?? "");
        setExternoPerfil(request.externalProfessorData?.perfil ?? "");
      } else {
        setActiveTab("planta");
      }
    }
  }, [isOpen, request]);

  // Picking a registered advisor fills its contact fields; the 4 contact inputs are then
  // disabled (see below) since `createExternal` has no update path — editing them here
  // would look saved (toast) but never reach the backend.
  const handleSelectExternal = (professor: Professor) => {
    setSelectedExternalId(professor.id);
    setExternoNombre(professor.fullName);
    setExternoEmpresa(professor.company ?? "");
    setExternoIdentificacion(professor.identityDocument ?? "");
    setExternoCorreo(professor.email ?? "");
    setExternoTelefono(professor.phone ?? "");
    setExternoPerfil(professor.profile ?? "");
  };

  const handleSave = async () => {
    if (activeTab === "planta") {
      if (selectedStaff) {
        onSaveAssignment(selectedStaff.fullName, "planta", undefined, selectedStaff.id);
        toast.success(`Docente de planta ${selectedStaff.fullName} asignado con éxito`);
        onClose();
      } else if (currentPlantaProf) {
        // Nothing new picked: keep the current assignment.
        onClose();
      } else {
        toast.error("Por favor selecciona un profesor de planta");
      }
      return;
    }

    if (!externoNombre.trim()) {
      toast.error("Ingresa el nombre completo del consultor o docente externo");
      return;
    }

    // A new external advisor is registered once in the directory so it can be reused next time.
    let professorId = selectedExternalId ?? undefined;
    if (!professorId) {
      try {
        const created = await registerExternal.mutateAsync({
          fullName: externoNombre.trim(),
          company: externoEmpresa.trim() || undefined,
          identityDocument: externoIdentificacion.trim() || undefined,
          email: externoCorreo.trim() || undefined,
          phone: externoTelefono.trim() || undefined,
          profile: externoPerfil.trim() || undefined,
        });
        professorId = created.id;
      } catch (error) {
        toast.error(
          error instanceof ApiError && error.status === 409
            ? "Ese consultor ya está registrado en el directorio. Búscalo arriba para seleccionarlo."
            : "No pudimos registrar al consultor en el directorio. Intenta de nuevo.",
        );
        return;
      }
    }

    const extData: ExternalProfessorData = {
      nombre: externoNombre.trim(),
      identificacion: externoIdentificacion.trim() || undefined,
      empresaConsultora: externoEmpresa.trim() || undefined,
      correo: externoCorreo.trim() || undefined,
      telefono: externoTelefono.trim() || undefined,
      perfil: externoPerfil.trim() || undefined,
    };
    onSaveAssignment(externoNombre.trim(), "externo", extData, professorId);
    toast.success(`Consultor externo ${externoNombre.trim()} registrado y asignado con éxito`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <UserCheck className="h-5 w-5" />
            <DialogTitle className="text-lg">Asignación del Docente / Consultor</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Asigna el líder técnico para el diseño y ejecución de esta propuesta. Puedes seleccionar un profesor de
            planta de la Universidad Icesi o registrar un consultor/docente externo especializado.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "planta" | "externo")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="planta" className="flex items-center gap-2 text-xs">
                <GraduationCap className="h-3.5 w-3.5" />
                Profesor de Planta (Icesi)
              </TabsTrigger>
              <TabsTrigger value="externo" className="flex items-center gap-2 text-xs">
                <Briefcase className="h-3.5 w-3.5" />
                Consultor / Docente Externo
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: PROFESOR DE PLANTA */}
            <TabsContent value="planta" className="space-y-4 pt-4">
              <div className="rounded-lg border border-border bg-card p-3.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Cuerpo docente Universidad Icesi</p>
                <p className="mt-0.5">
                  Selecciona uno de los profesores de planta vinculados para liderar académicamente la propuesta.
                </p>
              </div>

              <ProfessorPicker
                type="STAFF"
                label="Profesor de Planta disponible *"
                selectedId={selectedStaff?.id}
                onSelect={setSelectedStaff}
              />

              {/* Selected (or current) prof preview card */}
              {(selectedStaff || currentPlantaProf) && (
                <div className="rounded-md border border-accent/20 bg-accent/5 p-3 text-xs">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <GraduationCap className="h-4 w-4 text-accent" />
                    <span>
                      {selectedStaff ? "Docente seleccionado" : "Docente asignado actualmente"}:{" "}
                      <strong className="text-foreground">{selectedStaff?.fullName ?? currentPlantaProf}</strong>
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Institución: Universidad Icesi
                    {selectedStaff?.faculty ? ` · Facultad: ${selectedStaff.faculty}` : ""} · Nodo: {request.node}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: CONSULTOR / DOCENTE EXTERNO */}
            <TabsContent value="externo" className="space-y-3.5 pt-4">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-semibold">Registro de Consultor o Asesor Externo</p>
                <p className="mt-0.5 text-muted-foreground">
                  Ingresa directamente los datos del profesional externo para emitir contratos y respaldar la propuesta
                  comercial.
                </p>
              </div>

              <ProfessorPicker type="EXTERNAL" selectedId={selectedExternalId} onSelect={handleSelectExternal} />

              <p className="text-[11px] text-muted-foreground">
                ¿No aparece? Captura sus datos abajo y quedará registrado en el directorio para próximas asignaciones.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="ext-name" className="text-xs font-semibold">
                    Nombre completo del Consultor / Docente *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ext-name"
                      placeholder="Ej: Ing. Mauricio Restrepo Zuluaga"
                      className="pl-8 text-xs"
                      value={externoNombre}
                      onChange={(e) => {
                        setExternoNombre(e.target.value);
                        setSelectedExternalId(null);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ext-id" className="text-xs font-semibold">
                    Cédula / Identificación / NIT
                  </Label>
                  <Input
                    id="ext-id"
                    placeholder="Ej: CC 94.456.789 o Pasaporte"
                    className="text-xs"
                    value={externoIdentificacion}
                    onChange={(e) => setExternoIdentificacion(e.target.value)}
                    disabled={!!selectedExternalId}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ext-empresa" className="text-xs font-semibold">
                    Firma consultora o Institución
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ext-empresa"
                      placeholder="Ej: McKinsey, Valora Consultoría, Independiente"
                      className="pl-8 text-xs"
                      value={externoEmpresa}
                      onChange={(e) => {
                        setExternoEmpresa(e.target.value);
                        setSelectedExternalId(null);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ext-email" className="text-xs font-semibold">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ext-email"
                      type="email"
                      placeholder="correo@consultoria.com"
                      className="pl-8 text-xs"
                      value={externoCorreo}
                      onChange={(e) => setExternoCorreo(e.target.value)}
                      disabled={!!selectedExternalId}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ext-phone" className="text-xs font-semibold">
                    Teléfono / WhatsApp
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ext-phone"
                      placeholder="+57 315 123 4567"
                      className="pl-8 text-xs"
                      value={externoTelefono}
                      onChange={(e) => setExternoTelefono(e.target.value)}
                      disabled={!!selectedExternalId}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="ext-perfil" className="text-xs font-semibold">
                    Especialidad / Perfil Profesional
                  </Label>
                  <Textarea
                    id="ext-perfil"
                    rows={2}
                    placeholder="Ej: Especialista en Transformación Digital, automatización robótica de procesos y arquitectura en nube con más de 12 años de experiencia."
                    className="text-xs resize-none"
                    value={externoPerfil}
                    onChange={(e) => setExternoPerfil(e.target.value)}
                    disabled={!!selectedExternalId}
                  />
                </div>

                {selectedExternalId && (
                  <p className="sm:col-span-2 text-[11px] text-muted-foreground">
                    Estos datos pertenecen al registro existente del directorio; no se editan desde aquí.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={registerExternal.isPending}>
            <Check className="h-4 w-4 mr-1" />
            Guardar asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
