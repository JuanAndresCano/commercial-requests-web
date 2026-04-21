import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLE_LABELS: Record<string, string> = {
  kam: "KAM",
  "lider-nodo": "Líder de Nodo",
  "lider-producto": "Líder de Producto",
  profesor: "Profesor",
};

export default function Login() {
  const [params] = useSearchParams();
  const role = params.get("role") ?? "kam";
  const roleLabel = ROLE_LABELS[role] ?? "KAM";
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-hero">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.3] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-sm font-bold">Solicitudes</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-md items-center justify-center px-6 pb-12">
        <div className="w-full animate-scale-in">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Como {roleLabel}
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">Iniciar sesión</h1>
            <p className="mt-2 text-sm text-muted-foreground">Accede a tu panel de gestión de solicitudes.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8"
          >
            <div className="space-y-5">
              <div>
                <Label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="tu@icesi.edu.co" required className="h-11 pl-10" />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Contraseña
                  </Label>
                  <button type="button" className="text-xs font-semibold text-accent hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="h-11 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full">
                Iniciar sesión
              </Button>
            </div>

            <div className="mt-6 border-t border-border pt-5 text-center text-xs text-muted-foreground">
              ¿No tienes cuenta? <span className="font-semibold text-foreground">Contacta al administrador</span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
