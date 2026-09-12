import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Network, Layers, GraduationCap, ArrowRight, Sparkles, Building2, Shield, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IcesiLogo, IcesiSymbol, IcesiCenefa } from "@/components/IcesiLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

const ROLES = [
  {
    key: "kam",
    title: "KAM",
    subtitle: "Key Account Manager",
    description: "Crea y gestiona requerimientos con clientes empresariales.",
    icon: Briefcase,
    accent: "border-t-[#5454e9] group-hover:border-[#5454e9]",
    badgeColor: "bg-[#5454e9]/10 text-[#5454e9]",
  },
  {
    key: "lider-producto",
    title: "Líder de Producto",
    subtitle: "Gestión técnica & costeo",
    description: "Estructura propuestas técnico-económicas y asigna docentes.",
    icon: Layers,
    accent: "border-t-[#865cf0] group-hover:border-[#865cf0]",
    badgeColor: "bg-[#865cf0]/10 text-[#865cf0]",
  },
  {
    key: "lider-nodo",
    title: "Líder de Nodo",
    subtitle: "Coordinación académica",
    description: "Supervisa propuestas en los 5 nodos temáticos de la Universidad.",
    icon: Network,
    accent: "border-t-[#4cb979] group-hover:border-[#4cb979]",
    badgeColor: "bg-[#4cb979]/10 text-[#4cb979]",
  },
  {
    key: "profesor",
    title: "Profesor / Asesor",
    subtitle: "Diseño curricular",
    description: "Formula contenidos pedagógicos y valida metodologías de entrega.",
    icon: GraduationCap,
    accent: "border-t-[#e9683b] group-hover:border-[#e9683b]",
    badgeColor: "bg-[#e9683b]/10 text-[#e9683b]",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased transition-colors">
      {/* Institutional Top Stripe */}
      <div className="h-1.5 w-full bg-[#5454e9]" />

      {/* Header */}
      <header className="border-b border-border dark:border-[#252838] bg-card dark:bg-[#11121a] py-4 px-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <IcesiLogo variant="horizontal" size="md" />
            <div className="hidden sm:block h-6 w-px bg-border" />
            <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-[#5454e9] dark:text-[#865cf0]">
              Portal Solicitudes Comerciales
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle variant="pill" />
            <Link
              to="/login"
              className="text-xs font-bold text-[#5454e9] dark:text-[#865cf0] hover:underline"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-12 flex-1 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-border dark:border-[#252838] bg-card dark:bg-[#141622] p-8 sm:p-10 shadow-sm">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5454e9]/30 bg-[#5454e9]/10 px-3 py-1 text-xs font-semibold text-[#5454e9] dark:text-[#865cf0] mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Universidad Icesi · Extensión y Consultoría</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans leading-tight">
              Gestión Integral de Propuestas Comerciales
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Plataforma institucional para la recepción, estructuración técnica, costeo financiero con estampilla Pro-Cultura y asignación de profesores de planta o consultores externos.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => navigate("/login")}
                className="bg-[#5454e9] hover:bg-[#4343d3] text-white text-xs font-bold px-5 h-10 shadow-sm"
              >
                Ingresar al sistema
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/solicitudes/nueva")}
                className="border-border dark:border-[#2b2d3d] text-xs font-semibold h-10 gap-1.5"
              >
                <PlusCircle className="h-4 w-4 text-[#5454e9]" />
                Crear solicitud directa
              </Button>
            </div>
          </div>

          {/* Decorative Brand Cenefa */}
          <div className="mt-8 pt-4 border-t border-border dark:border-[#252838] flex items-center justify-between">
            <IcesiCenefa barsCount={30} height={9} color="#5454e9" className="opacity-40" />
            <span className="text-xs font-extrabold text-[#5454e9] tracking-wide">
              Llega más lejos · icesi.edu.co
            </span>
          </div>
        </div>

        {/* Roles Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-sans text-foreground">
                Selecciona tu perfil de acceso
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Accede rápidamente según tu responsabilidad en el flujo comercial.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <Link
                  key={role.key}
                  to={`/login?role=${role.key}`}
                  className={`group flex flex-col rounded-xl border border-border dark:border-[#252838] border-t-4 ${role.accent} bg-card dark:bg-[#141622] p-5 transition-all hover:shadow-md hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary dark:bg-[#1f212e] text-foreground group-hover:text-[#5454e9] transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role.badgeColor}`}>
                      {role.title}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-base text-foreground font-sans">
                    {role.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{role.subtitle}</p>
                  <p className="mt-2 flex-1 text-xs text-muted-foreground leading-relaxed">
                    {role.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#5454e9] dark:text-[#865cf0] group-hover:gap-2 transition-all">
                    <span>Acceder</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Fast Action Card */}
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border dark:border-[#252838] bg-secondary/40 dark:bg-[#141622] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5454e9] text-white shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground font-sans">
                ¿Necesitas radicar una solicitud empresarial?
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Diligencia el formulario estructurado en 5 pasos para empresas, entidades aliadas o proyectos de extensión.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/solicitudes/nueva")}
            className="bg-[#5454e9] hover:bg-[#4343d3] text-white text-xs font-bold shrink-0"
          >
            Crear solicitud comercial
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border dark:border-[#252838] bg-card dark:bg-[#0e0f14] py-6 px-6 text-center text-xs text-muted-foreground">
        <p>Universidad Icesi · Calle 18 No. 122–135, Pance, Cali - Colombia</p>
        <p className="mt-1 text-[11px]">
          Línea de atención: +57 (602) 555 2334 · <span className="text-[#5454e9] font-medium">Llega más lejos · icesi.edu.co</span>
        </p>
      </footer>
    </div>
  );
};

export default Index;
