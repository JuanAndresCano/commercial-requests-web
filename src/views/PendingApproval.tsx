import { useState, useEffect } from "react";
import { useRouter } from "@/lib/app-router";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IcesiLogo, IcesiCenefa } from "@/components/IcesiLogo";
import { Clock, RefreshCw, LogOut } from "@/components/icons";

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
        toast.info("Solicitud aún en revisión", {
          description: "El administrador aún no ha asignado tu rol. Por favor, intenta de nuevo más tarde.",
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

  const displayName = user?.name || user?.email || "Colaborador Icesi";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f111a] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-border/80">
        <div className="flex items-center gap-3">
          <IcesiLogo variant="horizontal" colorScheme="blue" size="md" />
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-[#1a1c28] border border-border px-3.5 py-1.5 rounded-full shadow-xs">
          <div className="h-7 w-7 rounded-full bg-[#5454e9] text-white flex items-center justify-center text-xs font-bold">
            {userInitial}
          </div>
          <div className="text-left pr-1">
            <span className="text-xs font-medium text-foreground block leading-tight">{displayName}</span>
            <span className="text-[10px] text-muted-foreground block leading-tight">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="bg-white dark:bg-[#141522] border border-border rounded-3xl p-8 sm:p-10 shadow-sm text-center">
          {/* Status Icon */}
          <div className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-[#5454e9]/10 text-[#5454e9] dark:text-[#7f7fff] flex items-center justify-center">
            <Clock className="h-8 w-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Solicitud en revisión
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">
            Tu cuenta está pendiente de aprobación
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Hemos registrado tu acceso institucional con Microsoft Entra ID. Por políticas de seguridad y control de
            información comercial de la Universidad Icesi, un administrador debe verificar tu solicitud y asignarte un
            rol operativo.
          </p>

          {/* User details card */}
          <div className="bg-muted/40 dark:bg-muted/20 border border-border/80 rounded-2xl p-4 mb-8 text-left text-xs space-y-2">
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Colaborador:</span>
              <span className="font-semibold text-foreground">{displayName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Correo institucional:</span>
              <span className="font-medium text-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Estado actual:</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">En cola de aprobación</span>
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

          <p className="mt-8 text-xs text-muted-foreground">
            ¿Tienes dudas o requieres acceso prioritario? Comunícate con la Dirección Comercial o el administrador del
            sistema.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
        <IcesiCenefa barsCount={18} height={6} />
        <div>Universidad Icesi · Solicitudes Comerciales</div>
      </footer>
    </div>
  );
}
