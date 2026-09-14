import React, { useState } from "react";
import { MessageSquare, X, Sparkles, HelpCircle, ChevronRight, FileText, Calculator, ExternalLink } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { IcesiSymbol } from "@/components/IcesiLogo";

interface AndyAssistantWidgetProps {
  className?: string;
}

export function AndyAssistantWidget({ className }: AndyAssistantWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Popover Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-xl border border-border dark:border-[#2b2d3d] bg-card dark:bg-[#151622] p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between border-b border-border dark:border-[#252838] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5454e9] text-white ring-2 ring-[#e4eb60]">
                <IcesiSymbol size={22} color="#ffffff" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-foreground">Andy</span>
                  <span className="rounded bg-[#e4eb60]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#b5bd1d] dark:text-[#e4eb60]">
                    Icesi
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Tu asistente virtual institucional</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Cerrar asistente"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="rounded-lg bg-secondary/60 dark:bg-[#0e0f15] p-3 border border-border/50 dark:border-[#252838]">
              <p className="font-medium text-foreground">¡Hola! ¿En qué puedo ayudarte hoy?</p>
              <p className="text-muted-foreground mt-1">
                Gestiona tus propuestas comerciales, revisa el estado de asignaciones docentes y consulta el costeo financiero de programas.
              </p>
            </div>

            <div className="pt-1 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Acciones sugeridas
              </p>

              <a
                href="/solicitudes/nueva"
                className="flex items-center justify-between rounded-lg p-2 text-left transition-colors bg-background dark:bg-[#1a1b26] hover:bg-[#5454e9]/10 border border-border dark:border-[#252838] group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-[#4cb979]" />
                  <span className="font-medium text-foreground group-hover:text-[#5454e9]">
                    Crear nueva solicitud comercial
                  </span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#5454e9]" />
              </a>

              <a
                href="/solicitudes"
                className="flex items-center justify-between rounded-lg p-2 text-left transition-colors bg-background dark:bg-[#1a1b26] hover:bg-[#5454e9]/10 border border-border dark:border-[#252838] group"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="h-3.5 w-3.5 text-[#865cf0]" />
                  <span className="font-medium text-foreground group-hover:text-[#5454e9]">
                    Ver costeo y tablero de solicitudes
                  </span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#5454e9]" />
              </a>

              <a
                href="/dashboard"
                className="flex items-center justify-between rounded-lg p-2 text-left transition-colors bg-background dark:bg-[#1a1b26] hover:bg-[#5454e9]/10 border border-border dark:border-[#252838] group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#5454e9]" />
                  <span className="font-medium text-foreground group-hover:text-[#5454e9]">
                    Panel de control y métricas
                  </span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#5454e9]" />
              </a>
            </div>
          </div>

          <div className="mt-3 border-t border-border dark:border-[#252838] pt-2 text-center text-[10px] text-muted-foreground">
            Universidad Icesi · <span className="text-[#5454e9] font-medium">Llega más lejos</span>
          </div>
        </div>
      )}

      {/* Trigger Button with avatar styling matching Screenshot 2/3 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#5454e9] text-white shadow-xl hover:bg-[#4343d3] hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-[#5454e9]/30 ring-2 ring-white dark:ring-[#252838]"
        title="Asistente Andy - Universidad Icesi"
        aria-label="Abrir asistente Andy"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-white/10">
          <IcesiSymbol size={24} color="#ffffff" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e4eb60] opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#e4eb60] border-2 border-background" />
        </span>
      </button>
    </div>
  );
}
