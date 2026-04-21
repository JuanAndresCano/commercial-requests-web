import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Network, Layers, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLES = [
  { key: "kam", title: "KAM", subtitle: "Key Account Manager", description: "Gestiona cuentas y crea solicitudes comerciales.", icon: Briefcase },
  { key: "lider-nodo", title: "Líder de Nodo", subtitle: "Coordinación de nodos", description: "Coordina solicitudes entre nodos académicos.", icon: Network },
  { key: "lider-producto", title: "Líder de Producto", subtitle: "Gestión de productos", description: "Construye propuestas y asigna profesores.", icon: Layers },
  { key: "profesor", title: "Profesor", subtitle: "Gestión académica", description: "Recibe solicitudes y diseña propuestas.", icon: GraduationCap },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-display text-base font-bold text-foreground">Solicitudes Comerciales</p>
            <p className="text-xs text-muted-foreground">Universidad Icesi</p>
          </div>
          <span className="text-xs text-muted-foreground">v1.0</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Selecciona tu rol
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Elige cómo deseas acceder al sistema. Los roles autenticados gestionan solicitudes; el solicitante puede crear directamente.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.key}
                to={`/login?role=${role.key}`}
                className="flex flex-col rounded-md border border-border bg-card p-5 transition-colors hover:border-accent/50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-foreground">{role.title}</h3>
                <p className="text-xs text-muted-foreground">{role.subtitle}</p>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{role.description}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  Iniciar sesión <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-md border border-border bg-card p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">¿Eres solicitante?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Puedes crear solicitudes directamente sin necesidad de autenticación.
            </p>
          </div>
          <Button onClick={() => navigate("/solicitudes/nueva")}>
            Crear solicitud
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          © Universidad Icesi {new Date().getFullYear()}
        </p>
      </main>
    </div>
  );
};

export default Index;
