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
import { CheckCircle2, Briefcase, Award, User as UserIcon } from "@/components/icons";

interface RoleOption {
  code: "KAM" | "PRODUCT_LEADER";
  title: string;
  subtitle: string;
  icon: typeof Briefcase;
  colorClass: string;
  accentBg: string;
  description: string;
  responsibilities: string[];
}

const ROLES: RoleOption[] = [
  {
    code: "KAM",
    title: "Key Account Manager (KAM)",
    subtitle: "Gestión Comercial y Relación con Clientes",
    icon: Briefcase,
    colorClass: "text-[#5454e9] dark:text-[#7f7fff]",
    accentBg: "bg-[#5454e9]/10",
    description:
      "Lideras la interacción con empresas y clientes, registras nuevas solicitudes y acompañas la propuesta hasta su entrega al cliente.",
    responsibilities: [
      "Registrar y formular nuevas solicitudes comerciales",
      "Gestionar empresas y contactos aliados",
      "Hacer seguimiento a las propuestas y enviarlas al cliente",
    ],
  },
  {
    code: "PRODUCT_LEADER",
    title: "Líder de Producto",
    subtitle: "Diseño Técnico y Costeo de Propuestas",
    icon: Award,
    colorClass: "text-purple-600 dark:text-purple-400",
    accentBg: "bg-purple-600/10",
    description:
      "Estructuras el alcance técnico y pedagógico, coordinas el equipo docente y defines el costeo financiero de la solución.",
    responsibilities: [
      "Dimensionar el alcance académico y metodológico",
      "Asignar profesores y consultores del directorio",
      "Elaborar la matriz de costeo y definir márgenes",
    ],
  },
];

export default function SelectRole() {
  const router = useRouter();
  const { user, status, assignInitialRole } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If user is already fully authenticated with roles, redirect to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const handleConfirmRole = async () => {
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      await assignInitialRole(selectedRole.code);
      toast.success("Rol asignado correctamente", {
        description: `Tu cuenta ha sido configurada como ${selectedRole.title}.`,
      });
      router.replace("/dashboard");
    } catch (error) {
      toast.error("Error al asignar el rol inicial", {
        description: error instanceof Error ? error.message : "Intenta nuevamente o contacta a soporte.",
      });
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user?.name || user?.email || "Colaborador Icesi";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f111a] flex flex-col justify-between p-4 sm:p-8">
      {/* Institutional Top Navigation */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-border/80">
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

      {/* Main Selection Body */}
      <main className="max-w-4xl mx-auto w-full my-auto py-10">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Bienvenido al Sistema de Solicitudes Comerciales
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            Para configurar tu espacio de trabajo, selecciona el rol con el que vas a operar en la plataforma:
          </p>
        </div>

        {/* Roles Grid (KAM & Líder de Producto) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole?.code === role.code;

            return (
              <div
                key={role.code}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRole(role)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedRole(role);
                  }
                }}
                className={`group relative text-left cursor-pointer rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                  isSelected
                    ? "border-[#5454e9] bg-white dark:bg-[#161824] ring-2 ring-[#5454e9]/30 shadow-md"
                    : "border-border bg-white dark:bg-[#141522] hover:border-border/80 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${role.accentBg} transition-colors`}>
                      <Icon className={`h-6 w-6 ${role.colorClass}`} />
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="h-6 w-6 text-[#5454e9] fill-[#5454e9]/15" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-border group-hover:border-foreground/40 transition-colors" />
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-foreground mb-1">{role.title}</h2>
                  <div className="text-xs font-medium text-muted-foreground mb-3">{role.subtitle}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-5">{role.description}</p>

                  <div className="border-t border-border/60 pt-4">
                    <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider block mb-2.5">
                      Funciones principales:
                    </span>
                    <ul className="space-y-2">
                      {role.responsibilities.map((resp, i) => (
                        <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#5454e9] shrink-0 mt-1.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-3.5 border-t border-border/40 text-center">
                  <span
                    className={`text-xs font-medium ${
                      isSelected ? "text-[#5454e9] font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {isSelected ? "Seleccionado" : "Elegir este rol"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button & Help note */}
        <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
          <Button
            size="lg"
            disabled={!selectedRole || submitting}
            onClick={() => setConfirmOpen(true)}
            className="w-full bg-[#5454e9] hover:bg-[#4343d0] text-white font-semibold py-6 rounded-xl shadow-md transition-transform active:scale-[0.99]"
          >
            Continuar con {selectedRole ? selectedRole.title : "el rol seleccionado"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            ¿Tienes dudas sobre tu rol o requieres acceso administrativo? Comunícate con la Dirección Comercial.
          </p>
        </div>
      </main>

      {/* Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-base">
              <UserIcon className="h-5 w-5 text-[#5454e9]" />
              Confirmar asignación de rol
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs leading-relaxed pt-2">
              ¿Deseas configurar tu cuenta institucional como{" "}
              <strong className="text-foreground">{selectedRole?.title}</strong>? Esta elección definirá las vistas y
              herramientas disponibles en tu espacio de trabajo.
            </DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 my-2 text-xs">
              <div className="font-semibold text-foreground mb-1">{selectedRole.title}</div>
              <div className="text-muted-foreground">{selectedRole.subtitle}</div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" disabled={submitting} onClick={() => setConfirmOpen(false)}>
              Regresar
            </Button>
            <Button
              disabled={submitting}
              onClick={handleConfirmRole}
              className="bg-[#5454e9] hover:bg-[#4343d0] text-white"
            >
              {submitting ? "Guardando..." : "Sí, confirmar rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
        <IcesiCenefa barsCount={18} height={6} />
        <div>Universidad Icesi · Solicitudes Comerciales</div>
      </footer>
    </div>
  );
}
