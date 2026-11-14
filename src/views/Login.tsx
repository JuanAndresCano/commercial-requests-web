import { useState, useEffect } from "react";
import { Link, useRouter, useSearchParams } from "@/lib/app-router";
import { ArrowLeft, AlertCircle } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { API_URL, ApiError } from "@/lib/api/client";
import { IcesiLogo, IcesiCenefa } from "@/components/IcesiLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

function MicrosoftLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

const DEV_ACCOUNTS = [
  { role: "KAM", name: "Diana Martínez", email: "diana.martinez@icesi.edu.co" },
  { role: "Líder de Producto (LDP)", name: "Laura Díaz", email: "ldp@icesi.edu.co" },
  { role: "Administrador", name: "Administrador", email: "admin@icesi.edu.co" },
];

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { devLogin, status } = useAuth();

  const [devEmail, setDevEmail] = useState("");
  const [devSubmitting, setDevSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read potential OAuth error returned from backend redirect query params
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const decoded = decodeURIComponent(errorParam);
      if (decoded.includes("domain") || decoded.includes("@icesi.edu.co") || decoded === "domain_not_allowed") {
        setErrorMessage(
          "Solo se permite el ingreso con cuentas institucionales autorizadas (@icesi.edu.co o @u.icesi.edu.co).",
        );
      } else if (decoded === "invalid_state") {
        setErrorMessage("La sesión de autenticación caducó o no es válida. Por favor intenta de nuevo.");
      } else if (
        decoded === "sso_cancelled" ||
        decoded.toLowerCase().includes("access_denied") ||
        decoded.toLowerCase().includes("cancel")
      ) {
        setErrorMessage("El inicio de sesión institucional fue cancelado por el usuario.");
      } else if (decoded === "missing_code") {
        setErrorMessage("No se recibió el código de autorización desde Microsoft. Por favor intenta de nuevo.");
      } else if (
        decoded === "account_deactivated" ||
        decoded.toLowerCase().includes("deactivated") ||
        decoded.toLowerCase().includes("inhabilitad")
      ) {
        setErrorMessage("account_deactivated");
      } else {
        setErrorMessage(decoded);
      }
    }
  }, [searchParams]);

  // If already authenticated, redirect
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "pending-role") {
      router.replace("/onboarding/pending");
    }
  }, [status, router]);

  const handleMicrosoftLogin = () => {
    window.location.href = `${API_URL}/auth/microsoft`;
  };

  const handleDevLogin = async (emailToUse: string) => {
    setDevSubmitting(true);
    try {
      await devLogin(emailToUse.trim());
      // Navigation is handled reactively by status effect
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast.error("Usuario de prueba no encontrado en la base de datos.");
      } else {
        toast.error("Error al iniciar sesión en modo desarrollo.", {
          description: error instanceof Error ? error.message : "Error inesperado.",
        });
      }
    } finally {
      setDevSubmitting(false);
    }
  };

  const isDevelopment = process.env.NODE_ENV !== "production";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground transition-colors">
      {/* Left Column: Authentic Universidad Icesi Campus */}
      <div className="relative w-full lg:w-1/2 min-h-[380px] lg:min-h-screen bg-slate-900 flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1800&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-[#5454e9]/25 mix-blend-multiply" />
        </div>

        {/* Top Left: Universidad Icesi Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <IcesiLogo variant="horizontal" colorScheme="white" size="md" />
          </Link>
          <div className="mt-2 flex items-center gap-2 text-xs text-white/80 font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-[#e4eb60]" />
            Sistema de Solicitudes Comerciales & Educación Continua
          </div>
        </div>

        {/* Center Graphic */}
        <div className="relative z-10 my-auto hidden lg:block max-w-md">
          <div className="rounded-2xl border border-white/20 bg-black/40 backdrop-blur-md p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 text-[#e4eb60] text-xs font-bold uppercase tracking-wider mb-2">
              <span>De la necesidad del cliente a la propuesta</span>
            </div>
            <h2 className="text-2xl font-bold font-sans leading-tight">
              Transformando conocimiento en soluciones empresariales
            </h2>
            <p className="mt-2 text-sm text-white/80 font-light">
              Plataforma oficial para la formulación, costeo y asignación de propuestas comerciales de consultoría,
              capacitación y mentoría.
            </p>
            <IcesiCenefa className="mt-4 opacity-70" barsCount={24} height={9} color="#ffffff" />
          </div>
        </div>

        {/* Bottom Left: Official Tagline Blocks */}
        <div className="relative z-10 flex flex-col items-start gap-0 mt-6 lg:mt-0">
          <div className="bg-[#5454e9] text-white px-6 py-3 font-bold text-xl sm:text-2xl tracking-tight shadow-md">
            Llega más lejos
          </div>
          <div className="bg-black text-white px-6 py-2 font-bold text-lg tracking-wide">icesi.edu.co</div>
        </div>
      </div>

      {/* Right Column: Institutional Login Screen */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-background dark:bg-[#0e0f14]">
        {/* Top bar with Login title & Guía link + Dark/Light Mode switch */}
        <div className="flex items-center justify-between pb-6 border-b border-border dark:border-[#252838]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al portal
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <h1 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">Iniciar Sesión</h1>
              <a
                href="https://www.icesi.edu.co"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#5454e9] dark:text-[#865cf0] hover:underline"
              >
                icesi.edu.co
              </a>
            </div>
            <ThemeToggle variant="pill" />
          </div>
        </div>

        {/* Center Card: "Inicia sesión" */}
        <div className="my-auto max-w-md w-full mx-auto py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">Acceso Institucional</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresa de forma segura con tu cuenta de Microsoft Entra ID de la Universidad Icesi.
            </p>
          </div>

          {/* Error Banner if SSO returned an issue */}
          {errorMessage &&
            (errorMessage === "account_deactivated" ? (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-amber-900 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Acceso no habilitado</span>
                </div>
                <p className="text-amber-950 dark:text-amber-100/90 leading-relaxed">
                  Tu cuenta institucional no cuenta actualmente con autorización para ingresar al Sistema de Solicitudes
                  Comerciales. Si requieres acceso para tus labores o consideras que se trata de un error, por favor
                  comunícate con la Dirección de Extensión y Consultoría o con el administrador del sistema.
                </p>
              </div>
            ) : (
              <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
                <p className="font-semibold mb-0.5">No fue posible completar el acceso</p>
                <p>{errorMessage}</p>
              </div>
            ))}

          {/* Primary Institutional SSO Button */}
          <div className="space-y-4">
            <Button
              type="button"
              onClick={handleMicrosoftLogin}
              className="w-full h-12 text-sm font-semibold bg-white dark:bg-[#1a1c26] text-slate-800 dark:text-white border border-slate-300 dark:border-[#2f3245] hover:bg-slate-50 dark:hover:bg-[#222533] shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
            >
              <MicrosoftLogo className="h-5 w-5 shrink-0" />
              <span>Iniciar sesión con cuenta Icesi</span>
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Habilitado para colaboradores con cuentas @icesi.edu.co y @u.icesi.edu.co
            </p>
          </div>

          {/* Developer Quick-Login Impersonator (Visible in local development) */}
          {isDevelopment && (
            <div className="mt-8 pt-6 border-t border-dashed border-border dark:border-[#252838]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  ⚡ Modo Desarrollo (Dev Switcher)
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">NODE_ENV={process.env.NODE_ENV}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Simula una sesión de prueba con cualquier rol del seed sin requerir login en Microsoft:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                {DEV_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={devSubmitting}
                    onClick={() => handleDevLogin(acc.email)}
                    className="p-2 text-left rounded-lg border border-border hover:border-primary/50 bg-secondary/40 hover:bg-secondary/70 transition-colors text-xs"
                  >
                    <div className="font-semibold text-foreground truncate">{acc.name}</div>
                    <div className="text-[11px] text-muted-foreground">{acc.role}</div>
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (devEmail) handleDevLogin(devEmail);
                }}
                className="flex gap-2"
              >
                <div className="flex-1">
                  <Label htmlFor="dev-email-input" className="sr-only">
                    Correo dev
                  </Label>
                  <Input
                    id="dev-email-input"
                    type="email"
                    placeholder="otro.correo@icesi.edu.co"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={devSubmitting || !devEmail}
                  className="h-9 text-xs"
                >
                  Entrar
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-border dark:border-[#252838] text-center text-[11px] text-muted-foreground leading-relaxed">
          <p>Universidad Icesi, Calle 18 No. 122–135 | Cali-Colombia | Teléfono: (602) 555 2334</p>
          <p className="mt-0.5">
            Copyright © {new Date().getFullYear()}{" "}
            <a
              href="https://www.icesi.edu.co"
              target="_blank"
              rel="noreferrer"
              className="text-[#5454e9] hover:underline font-medium"
            >
              www.icesi.edu.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
