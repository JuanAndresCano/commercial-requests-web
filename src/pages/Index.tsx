import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Network, Layers, GraduationCap, ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLES = [
  {
    key: "kam",
    title: "KAM",
    subtitle: "Key Account Manager",
    description: "Gestiona cuentas estratégicas y crea solicitudes comerciales para tus clientes.",
    icon: Briefcase,
  },
  {
    key: "lider-nodo",
    title: "Líder de Nodo",
    subtitle: "Coordinación de nodos",
    description: "Coordina el flujo de solicitudes entre nodos académicos y operativos.",
    icon: Network,
  },
  {
    key: "lider-producto",
    title: "Líder de Producto",
    subtitle: "Gestión de productos",
    description: "Construye propuestas, asigna profesores y define entregables.",
    icon: Layers,
  },
  {
    key: "profesor",
    title: "Profesor",
    subtitle: "Gestión académica",
    description: "Recibe solicitudes asignadas y diseña propuestas académicas.",
    icon: GraduationCap,
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-hero">
      {/* Decorative grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-foreground">Solicitudes Comerciales</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Universidad Icesi</p>
          </div>
        </div>
        <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Acceso seguro</span>
          <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-accent" /> v2.0</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8 lg:pt-16">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Sistema de gestión activo
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Selecciona tu <span className="text-gradient-brand">rol</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Elige cómo deseas acceder al sistema de solicitudes comerciales de capacitación, consultoría y mentoría.
          </p>
        </div>

        {/* Role grid */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role, i) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.key}
                to={`/login?role=${role.key}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg animate-fade-in"
              >
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand shadow-glow transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5 text-white" />
                </div>

                <h3 className="mt-5 font-display text-xl font-bold text-foreground">{role.title}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-accent">{role.subtitle}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{role.description}</p>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm font-semibold text-foreground">
                  Iniciar sesión
                  <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Solicitante callout */}
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-card to-card p-6 shadow-sm sm:p-8 animate-fade-in">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-accent">Acceso directo</p>
              <h2 className="mt-1 font-display text-xl font-bold text-foreground">¿Eres solicitante?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Puedes crear solicitudes directamente sin necesidad de autenticación.
              </p>
            </div>
            <Button variant="hero" size="lg" onClick={() => navigate("/solicitudes/nueva")}>
              Crear solicitud
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Los demás roles requieren autenticación · © Universidad Icesi {new Date().getFullYear()}
        </p>
      </main>
    </div>
  );
};

export default Index;
