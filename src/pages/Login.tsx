import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
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
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <span className="font-display text-sm font-bold">Solicitudes</span>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-md items-center justify-center px-6 py-12">
        <div className="w-full">
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Acceso · {roleLabel}</p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-muted-foreground">Accede a tu panel de gestión.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-md border border-border bg-card p-6"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  Correo electrónico
                </Label>
                <Input id="email" type="email" placeholder="tu@icesi.edu.co" required />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </Label>
                  <button type="button" className="text-xs font-medium text-accent hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pr-10"
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

              <Button type="submit" className="w-full">
                Iniciar sesión
              </Button>
            </div>

            <div className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">
              ¿No tienes cuenta? <span className="font-medium text-foreground">Contacta al administrador</span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
