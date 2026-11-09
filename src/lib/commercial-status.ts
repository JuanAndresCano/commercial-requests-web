import type { CommercialStatus } from "./api/commercial-status";

export const COMMERCIAL_STATUS_LABELS: Record<CommercialStatus, string> = {
  APPROVED_WITHOUT_CONTRACT: "Aprobación sin contrato",
  APPROVED_WITH_CONTRACT: "Aprobada con contrato / Orden de servicio",
  INVOICED: "Facturada",
  REJECTED: "Rechazada",
};

/**
 * One semantic palette (progress of the deal) shared by the chip, its menu and the board filter.
 * Neutrals use theme tokens; the hues use Tailwind palette classes (-800 text on -50 fill in light,
 * -300 text on a dark -950 tint in dark: both above WCAG AA 4.5:1). No hex values.
 */
export const COMMERCIAL_STATUS_THEME: Record<CommercialStatus, { chip: string; dot: string }> = {
  APPROVED_WITHOUT_CONTRACT: {
    chip: "border-indigo-600/30 bg-indigo-50 text-indigo-800 dark:border-indigo-400/30 dark:bg-indigo-950/40 dark:text-indigo-300",
    dot: "bg-indigo-600 dark:bg-indigo-400",
  },
  APPROVED_WITH_CONTRACT: {
    chip: "border-teal-600/30 bg-teal-50 text-teal-800 dark:border-teal-400/30 dark:bg-teal-950/40 dark:text-teal-300",
    dot: "bg-teal-600 dark:bg-teal-400",
  },
  INVOICED: {
    chip: "border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  REJECTED: {
    chip: "border-rose-600/30 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-950/40 dark:text-rose-300",
    dot: "bg-rose-600 dark:bg-rose-400",
  },
};

/** Delivered proposal with no follow-up tag yet: soft grey, dashed border. */
export const COMMERCIAL_STATUS_NONE_THEME = {
  chip: "border-dashed border-border bg-transparent text-muted-foreground",
  dot: "bg-muted-foreground/50",
};

/** What a viewer who cannot edit sees when the KAM has not tagged the proposal. */
export const COMMERCIAL_STATUS_BASE_LABEL = "Presentación de propuesta";

export const UNKNOWN_COMMERCIAL_STATUS_LABEL = "Etiqueta comercial desconocida";

export type CommercialStatusFilter = CommercialStatus | "none" | "";

export function isCommercialStatus(value: unknown): value is CommercialStatus {
  return typeof value === "string" && Object.keys(COMMERCIAL_STATUS_LABELS).includes(value);
}

interface DeliveredValueSource {
  status: string;
  deliveredValueCop?: string | null;
  commercialStatus?: CommercialStatus | null;
}

/** Sums only the exact amounts the API says were delivered, never private recostings. */
export function sumDeliveredValues(requests: DeliveredValueSource[]): string | null {
  let cents = 0n;
  for (const proposal of requests) {
    if (proposal.status !== "entregada") continue;
    if (typeof proposal.deliveredValueCop !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(proposal.deliveredValueCop))
      return null;
    const [whole, fraction = ""] = proposal.deliveredValueCop.split(".");
    cents += BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  }
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}

export function matchesCommercialStatus(
  proposal: Pick<DeliveredValueSource, "status" | "commercialStatus">,
  filter: CommercialStatusFilter,
): boolean {
  if (!filter) return true;
  if (proposal.status !== "entregada") return false;
  return filter === "none" ? !proposal.commercialStatus : proposal.commercialStatus === filter;
}
