import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { IcesiLogo, IcesiCenefa } from "@/components/IcesiLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

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
                Iniciar sesión
                <ArrowRight className="ml-2 h-4 w-4" />
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
