"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/lib/app-router";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IcesiLogo, IcesiCenefa } from "@/components/IcesiLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RefreshCw, LogOut } from "@/components/icons";
import { toTitleCase } from "@/lib/format-name";

export default function PendingApproval() {
  const router = useRouter();
  const { user, status, refreshSession, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  // If user is already fully authenticated with roles, redirect to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const updatedSession = await refreshSession();
      if (updatedSession && !updatedSession.isPendingRole && updatedSession.roles.length > 0) {
        toast.success("¡Acceso aprobado!", {
          description: "Tu rol ha sido asignado. Redirigiendo a tu espacio de trabajo…",
        });
        router.replace("/dashboard");
      } else {
        toast.info("Aún no tienes rol asignado", {
          description: "El administrador aún no ha autorizado tu solicitud. Intenta de nuevo en unos momentos.",
        });
      }
    } catch (error) {
      toast.error("Error al comprobar estado", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const formattedName = toTitleCase(user?.name) || user?.email || "Colaborador Icesi";

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
      <main className="max-w-xl mx-auto w-full my-auto px-4 py-12">
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-colors">
          {/* Subtle Institutional Header Accent */}
          <div className="bg-primary/5 dark:bg-primary/10 border-b border-border px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-icesi-purple">
              Universidad Icesi · Acceso Institucional
            </span>
            <IcesiCenefa barsCount={12} height={6} className="opacity-40" />
          </div>

          <div className="p-6 sm:p-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
              Tu cuenta está pendiente de aprobación
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Hemos registrado tu ingreso con tu cuenta de correo institucional. Para acceder a la plataforma, un
              administrador debe verificar tu perfil y asignarte tu rol operativo (KAM o Líder de Producto).
            </p>

            {/* Collaborator Details Card */}
            <div className="bg-muted/40 dark:bg-muted/20 border border-border rounded-xl p-4 mb-6 text-left text-xs space-y-2.5">
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
                <span className="text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Pendiente de asignación de rol
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                disabled={checking}
                onClick={handleCheckStatus}
                className="bg-[#5454e9] hover:bg-[#4343d0] text-white font-medium px-6 rounded-xl flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                <span>{checking ? "Comprobando..." : "Comprobar estado"}</span>
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
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          ¿Tienes dudas o requieres acceso prioritario? Comunícate con la Dirección Comercial o el administrador del
          sistema.
        </p>
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-border bg-card py-4 px-4 sm:px-8 text-center text-xs text-muted-foreground transition-colors">
        <p className="text-[11px]">
          Universidad Icesi, Calle 18 No. 122–135, Cali - Colombia · Dirección de Extensión y Consultoría
        </p>
      </footer>
    </div>
  );
}
