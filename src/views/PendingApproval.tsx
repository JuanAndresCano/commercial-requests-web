"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/lib/app-router";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IcesiLogo, IcesiCenefa } from "@/components/IcesiLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Briefcase, Calculator, Check, CheckCircle2, Clock, LogOut, Send, AlertTriangle } from "@/components/icons";
import { toTitleCase } from "@/lib/format-name";

export default function PendingApproval() {
  const router = useRouter();
  const { user, status, refreshSession, requestRole, logout } = useAuth();

  const [selectedRole, setSelectedRole] = useState<"KAM" | "PRODUCT_LEADER">("KAM");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already fully authenticated with roles, redirect to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Periodic background check to automatically upgrade session when approved
  useEffect(() => {
    if (status !== "pending-role") return;

    const interval = setInterval(async () => {
      try {
        const updated = await refreshSession();
        if (updated && !updated.isPendingRole && updated.roles.length > 0) {
          toast.success("¡Acceso aprobado!", {
            description: "Tu rol ha sido asignado. Redirigiendo a tu espacio de trabajo…",
          });
          router.replace("/dashboard");
        }
      } catch {
        // Silently catch polling errors
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [status, refreshSession, router]);

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      await requestRole(selectedRole);
      setShowConfirmDialog(false);
      toast.success("¡Solicitud enviada!", {
        description: `Has solicitado el rol de ${
          selectedRole === "KAM" ? "Asesor Comercial (KAM)" : "Líder de Producto"
        }. El administrador revisará tu perfil.`,
      });
    } catch (error) {
      toast.error("Error al enviar solicitud", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const formattedName = toTitleCase(user?.name) || user?.email || "Colaborador Icesi";
  const hasRequestedRole = Boolean(user?.requestedRole);
  const requestedRoleLabel =
    user?.requestedRole === "KAM"
      ? "Asesor Comercial (KAM)"
      : user?.requestedRole === "PRODUCT_LEADER"
        ? "Líder de Producto"
        : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between antialiased selection:bg-primary selection:text-white">
      {/* Institutional Top Blue Band */}
      <div className="h-1.5 w-full bg-primary shrink-0" />

      {/* Top Application Bar */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IcesiLogo variant="horizontal" size="sm" withDescriptor={true} />
            <div className="hidden sm:flex flex-col border-l border-border pl-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-primary dark:text-icesi-purple">
                Solicitudes Comerciales
              </span>
              <span className="text-[10px] text-muted-foreground">Dirección de Extensión y Consultoría</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full my-auto px-4 py-8 sm:py-12">
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-colors">
          {/* Subtle Institutional Header Accent */}
          <div className="bg-primary/5 dark:bg-primary/10 border-b border-border px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-icesi-purple">
              Universidad Icesi · Acceso Institucional
            </span>
            <IcesiCenefa barsCount={12} height={6} className="opacity-40" />
          </div>

          <div className="p-6 sm:p-8">
            {/* Header info */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2">
                {hasRequestedRole ? "Solicitud de Rol en Proceso" : "Selecciona tu Rol Operativo"}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                {hasRequestedRole
                  ? "Hemos recibido tu solicitud de rol. El administrador del sistema debe verificar y autorizar tu cuenta."
                  : "Para habilitar tu espacio de trabajo, indica cuál es tu función en la Dirección de Extensión y Consultoría."}
              </p>
            </div>

            {/* Collaborator Details Card */}
            <div className="bg-muted/40 dark:bg-muted/20 border border-border rounded-xl p-4 mb-6 text-xs space-y-2.5">
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Colaborador:</span>
                <span className="font-semibold text-foreground">{formattedName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Correo institucional:</span>
                <span className="font-medium text-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Estado de la cuenta:</span>
                {hasRequestedRole ? (
                  <span className="text-primary dark:text-icesi-purple font-semibold inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    Rol solicitado: {requestedRoleLabel}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    Pendiente de selección de rol
                  </span>
                )}
              </div>
            </div>

            {/* If the user already requested a role: show confirmed locked state */}
            {hasRequestedRole ? (
              <div className="space-y-6">
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-5 text-center">
                  <div className="h-10 w-10 mx-auto rounded-full bg-primary/20 text-primary flex items-center justify-center mb-3">
                    <Check className="h-5 w-5" />
                  </div>
                  <h2 className="text-sm font-bold text-foreground mb-1">
                    Has solicitado el rol de {requestedRoleLabel}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                    Tu solicitud ya fue registrada y el Administrador la tiene disponible en la cola de aprobación. Te
                    notificaremos en cuanto tu acceso sea activado.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-background/80 px-3 py-1 rounded-full border border-border">
                    <Clock className="h-3 w-3 text-primary animate-pulse" />
                    <span>Solo puedes enviar esta solicitud una vez</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleLogout}
                    className="rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* Role Selection Interface */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Option 1: KAM */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("KAM")}
                    className={`relative p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedRole === "KAM"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                        : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`p-2.5 rounded-lg ${
                          selectedRole === "KAM" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                          selectedRole === "KAM" ? "border-primary bg-primary text-white" : "border-muted-foreground/30"
                        }`}
                      >
                        {selectedRole === "KAM" && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground mb-1">Asesor Comercial (KAM)</h2>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Gestión de clientes, oportunidades comerciales y seguimiento integral a propuestas.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Líder de Producto */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("PRODUCT_LEADER")}
                    className={`relative p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedRole === "PRODUCT_LEADER"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                        : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`p-2.5 rounded-lg ${
                          selectedRole === "PRODUCT_LEADER" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Calculator className="h-5 w-5" />
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                          selectedRole === "PRODUCT_LEADER"
                            ? "border-primary bg-primary text-white"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {selectedRole === "PRODUCT_LEADER" && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground mb-1">Líder de Producto</h2>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Costeo de solicitudes, asignación de docentes/expertos y estructuración técnica.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Important Warning Notice */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs flex items-start gap-2.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <p className="leading-relaxed">
                    <strong>Importante:</strong> Solo podrás enviar esta solicitud una única vez. Asegúrate de
                    seleccionar el rol correspondiente a tus responsabilidades.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button
                    size="lg"
                    disabled={isSubmitting}
                    onClick={() => setShowConfirmDialog(true)}
                    className="bg-[#5454e9] hover:bg-[#4343d0] text-white font-medium px-6 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Enviar solicitud de rol</span>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleLogout}
                    className="rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          ¿Tienes dudas sobre cuál es tu rol o requieres acceso prioritario? Comunícate con la Dirección Comercial o el
          administrador del sistema.
        </p>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-base">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>
                ¿Confirmas tu rol como {selectedRole === "KAM" ? "Asesor Comercial (KAM)" : "Líder de Producto"}?
              </span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs leading-relaxed pt-2">
              Al confirmar, tu solicitud se enviará a la Dirección para su respectiva aprobación.{" "}
              <strong>No podrás cambiar esta elección una vez enviada.</strong>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setShowConfirmDialog(false)}
              className="text-xs rounded-lg"
            >
              Revisar selección
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleConfirmSubmit()}
              className="bg-[#5454e9] hover:bg-[#4343d0] text-white text-xs font-medium rounded-lg gap-1.5"
            >
              {isSubmitting ? "Enviando..." : "Confirmar y enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Institutional Footer */}
      <footer className="border-t border-border bg-card py-4 px-4 sm:px-8 text-center text-xs text-muted-foreground transition-colors">
        <p className="text-[11px]">
          Universidad Icesi, Calle 18 No. 122–135, Cali - Colombia · Dirección de Extensión y Consultoría
        </p>
      </footer>
    </div>
  );
}
