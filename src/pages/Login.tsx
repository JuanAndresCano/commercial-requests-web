import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Sparkles } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api/client";
import { IcesiLogo, IcesiCenefa } from "@/components/IcesiLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Login() {
  const [showPwd, setShowPwd] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast.error("Correo o contraseña incorrectos.", {
          description: "Verifica tus credenciales o contacta a TI si crees que esto es un error.",
        });
      } else if (error instanceof ApiError) {
        toast.error("No pudimos iniciar tu sesión.", { description: "Intenta de nuevo en unos minutos." });
      } else {
        toast.error("No pudimos iniciar tu sesión.", {
          description: error instanceof Error ? error.message : "Error inesperado.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground transition-colors">
      {/* Left Column: Authentic Universidad Icesi Campus */}
      <div className="relative w-full lg:w-1/2 min-h-[380px] lg:min-h-screen bg-slate-900 flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none">
        {/* Real photographic campus background representation */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1800&q=80')`,
          }}
        >
          {/* Deep gradient overlay to ensure contrast and rich colors */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-[#5454e9]/25 mix-blend-multiply" />
        </div>

        {/* Top Left: Universidad Icesi Logo in pure white */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <IcesiLogo variant="horizontal" colorScheme="white" size="md" />
          </Link>
          <div className="mt-2 flex items-center gap-2 text-xs text-white/80 font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-[#e4eb60]" />
            Sistema de Solicitudes Comerciales & Educación Continua
          </div>
        </div>

        {/* Center Graphic: Clock Tower reference card */}
        <div className="relative z-10 my-auto hidden lg:block max-w-md">
          <div className="rounded-2xl border border-white/20 bg-black/40 backdrop-blur-md p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 text-[#e4eb60] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Campus Cali · Excelencia Icesi</span>
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

        {/* Bottom Left: Official Tagline Blocks (Exactly matching Screenshot 1!) */}
        <div className="relative z-10 flex flex-col items-start gap-0 mt-6 lg:mt-0">
          {/* Blue Block: "Llega más lejos" in Azul Icesi #5454e9 */}
          <div className="bg-[#5454e9] text-white px-6 py-3 font-bold text-xl sm:text-2xl tracking-tight shadow-md">
            Llega más lejos
          </div>
          {/* Black Block: "icesi.edu.co" */}
          <div className="bg-black text-white px-6 py-2 font-bold text-lg tracking-wide">icesi.edu.co</div>
        </div>
      </div>

      {/* Right Column: Institutional Login Screen */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-background dark:bg-[#0e0f14]">
        {/* Top bar with Login title & Guía link + Dark/Light Mode switch */}
        <div className="flex items-center justify-between pb-6 border-b border-border dark:border-[#252838]">
          <Link
            to="/"
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
            {/* Dark mode / Light mode toggle */}
            <ThemeToggle variant="pill" />
          </div>
        </div>

        {/* Center Card: "Inicia sesión" */}
        <div className="my-auto max-w-md w-full mx-auto py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">Inicia sesión</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingresa con tus credenciales institucionales de la Universidad Icesi. Tu rol se asigna automáticamente
              según tu cuenta.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="usuario" className="block text-xs font-semibold text-foreground mb-1.5">
                Usuario / Correo institucional
              </Label>
              <Input
                id="usuario"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@icesi.edu.co"
                required
                className="h-11 rounded-lg border-border dark:border-[#2b2d3d] bg-secondary/30 dark:bg-[#151620] text-sm focus-visible:ring-[#5454e9]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="contrasena" className="text-xs font-semibold text-foreground">
                  Contraseña
                </Label>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#5454e9] dark:text-[#865cf0] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="contrasena"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="h-11 pr-10 rounded-lg border-border dark:border-[#2b2d3d] bg-secondary/30 dark:bg-[#151620] text-sm focus-visible:ring-[#5454e9]"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label={showPwd ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Iniciar sesión Button in official Azul Icesi #5454e9 */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 text-sm font-bold bg-[#5454e9] hover:bg-[#4343d3] text-white rounded-lg shadow-md transition-all active:scale-[0.99] mt-2"
            >
              {submitting ? "Ingresando…" : "Iniciar sesión"}
            </Button>
          </form>

          {/* Institutional note */}
          <div className="mt-6 rounded-lg border border-border dark:border-[#252838] bg-secondary/20 dark:bg-[#141520] p-3 text-xs text-muted-foreground flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#4cb979] shrink-0" />
            <span>Acceso seguro con autenticación institucional y Directorio Activo Icesi.</span>
          </div>
        </div>

        {/* Footer info (matches Screenshot 1) */}
        <div className="pt-6 border-t border-border dark:border-[#252838] text-center text-[11px] text-muted-foreground leading-relaxed">
          <p>Universidad Icesi, Calle 18 No. 122–135 | Cali-Colombia | Teléfono: (602) 555 2334 | Fax: 555 1441</p>
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
