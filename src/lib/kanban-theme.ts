import type { RequestStatus } from "@/lib/mock-data";

// Paleta única de las 4 fases del pipeline (colores oficiales Icesi), compartida
// por el Kanban del Líder de Producto, el Kanban del KAM y el Tablero de Solicitudes
// para que las 3 vistas se vean y se comporten igual.
export interface StageTheme {
  colorHex: string;
  borderTopClass: string;
  activeCardClass: string;
  inactiveHoverClass: string;
  /** La fase "en curso" parpadea sutilmente para comunicar que hay trabajo activo. */
  pulse?: boolean;
}

export const STAGE_THEME: Record<RequestStatus, StageTheme> = {
  nueva: {
    colorHex: "#5454e9",
    borderTopClass: "border-t-4 border-t-[#5454e9]",
    activeCardClass: "border-[#5454e9] ring-2 ring-[#5454e9]/30 bg-[#5454e9]/5 dark:bg-[#5454e9]/10",
    inactiveHoverClass: "border-border dark:border-[#252838] bg-card dark:bg-[#141622] hover:border-[#5454e9]/50",
  },
  "en-experto": {
    colorHex: "#e9683b",
    borderTopClass: "border-t-4 border-t-[#e9683b]",
    activeCardClass: "border-[#e9683b] ring-2 ring-[#e9683b]/30 bg-[#e9683b]/5 dark:bg-[#e9683b]/10",
    inactiveHoverClass: "border-border dark:border-[#252838] bg-card dark:bg-[#141622] hover:border-[#e9683b]/50",
    pulse: true,
  },
  "en-costeo": {
    colorHex: "#865cf0",
    borderTopClass: "border-t-4 border-t-[#865cf0]",
    activeCardClass: "border-[#865cf0] ring-2 ring-[#865cf0]/30 bg-[#865cf0]/5 dark:bg-[#865cf0]/10",
    inactiveHoverClass: "border-border dark:border-[#252838] bg-card dark:bg-[#141622] hover:border-[#865cf0]/50",
  },
  entregada: {
    colorHex: "#4cb979",
    borderTopClass: "border-t-4 border-t-[#4cb979]",
    activeCardClass: "border-[#4cb979] ring-2 ring-[#4cb979]/30 bg-[#4cb979]/5 dark:bg-[#4cb979]/10",
    inactiveHoverClass: "border-border dark:border-[#252838] bg-card dark:bg-[#141622] hover:border-[#4cb979]/50",
  },
  // No son fases del Kanban (ver STAGE_ORDER) — placeholder mínimo para que
  // RequestStatus (ampliado por #7) siga siendo exhaustivo en este lookup.
  rechazada: {
    colorHex: "",
    borderTopClass: "border-t-4 border-t-destructive",
    activeCardClass: "border-destructive ring-2 ring-destructive/30 bg-destructive/5",
    inactiveHoverClass: "border-border bg-card hover:border-destructive/50",
  },
  cancelada: {
    colorHex: "",
    borderTopClass: "border-t-4 border-t-muted-foreground",
    activeCardClass: "border-muted-foreground ring-2 ring-muted-foreground/30 bg-muted",
    inactiveHoverClass: "border-border bg-card hover:border-muted-foreground/50",
  },
};

export const STAGE_ORDER: RequestStatus[] = ["nueva", "en-experto", "en-costeo", "entregada"];
