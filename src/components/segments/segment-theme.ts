import type { SegmentProfile } from "@/lib/api/segments";

/**
 * Identity of each segment. It is keyed by strategy (stable) and not by segment number (it can change between
 * runs). Hues were picked outside the ones that already mean something in the app: the pipeline stages (blue,
 * orange, purple, green), the commercial label (indigo, teal, emerald, rose) and the pending-adjustment amber.
 * Colour never carries the meaning alone: every segment also has a marker shape and is always named with text.
 */
export type SegmentMarkerShape = "circle" | "square" | "triangle" | "diamond";

export interface SegmentTheme {
  marker: SegmentMarkerShape;
  /** Solid fill for dots and bars. */
  dot: string;
  /** Text colour readable on the soft background and on the card. */
  text: string;
  border: string;
  /** Soft tinted background. */
  soft: string;
  /** SVG fill and stroke utilities. */
  fill: string;
  stroke: string;
  ring: string;
}

const THEMES: Record<string, SegmentTheme> = {
  Cuidar: {
    marker: "circle",
    dot: "bg-cyan-600 dark:bg-cyan-400",
    text: "text-cyan-800 dark:text-cyan-300",
    border: "border-cyan-600/30 dark:border-cyan-400/30",
    soft: "bg-cyan-50 dark:bg-cyan-950/40",
    fill: "fill-cyan-600 dark:fill-cyan-400",
    stroke: "stroke-cyan-700 dark:stroke-cyan-300",
    ring: "ring-cyan-600/50 dark:ring-cyan-400/50",
  },
  Crecer: {
    marker: "square",
    dot: "bg-fuchsia-600 dark:bg-fuchsia-400",
    text: "text-fuchsia-800 dark:text-fuchsia-300",
    border: "border-fuchsia-600/30 dark:border-fuchsia-400/30",
    soft: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    fill: "fill-fuchsia-600 dark:fill-fuchsia-400",
    stroke: "stroke-fuchsia-700 dark:stroke-fuchsia-300",
    ring: "ring-fuchsia-600/50 dark:ring-fuchsia-400/50",
  },
  Convertir: {
    marker: "triangle",
    dot: "bg-lime-600 dark:bg-lime-400",
    text: "text-lime-800 dark:text-lime-300",
    border: "border-lime-600/30 dark:border-lime-400/30",
    soft: "bg-lime-50 dark:bg-lime-950/40",
    fill: "fill-lime-600 dark:fill-lime-400",
    stroke: "stroke-lime-700 dark:stroke-lime-300",
    ring: "ring-lime-600/50 dark:ring-lime-400/50",
  },
  Reactivar: {
    marker: "diamond",
    dot: "bg-slate-500 dark:bg-slate-400",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/30 dark:border-slate-400/30",
    soft: "bg-slate-100 dark:bg-slate-800/50",
    fill: "fill-slate-500 dark:fill-slate-400",
    stroke: "stroke-slate-600 dark:stroke-slate-300",
    ring: "ring-slate-500/50 dark:ring-slate-400/50",
  },
};

/** A strategy the app does not know yet still renders, in the neutral identity. */
const FALLBACK_THEME: SegmentTheme = THEMES.Reactivar;

export function segmentTheme(strategy: string): SegmentTheme {
  return THEMES[strategy] ?? FALLBACK_THEME;
}

const STRATEGY_ORDER = ["Cuidar", "Crecer", "Convertir", "Reactivar"];

/** Profiles in business order (Cuidar, Crecer, Convertir, Reactivar); unknown strategies go last by number. */
export function sortProfiles(profiles: SegmentProfile[]): SegmentProfile[] {
  const rank = (p: SegmentProfile) => {
    const index = STRATEGY_ORDER.indexOf(p.strategy);
    return index === -1 ? STRATEGY_ORDER.length : index;
  };
  return [...profiles].sort((a, b) => rank(a) - rank(b) || a.segment - b.segment);
}
