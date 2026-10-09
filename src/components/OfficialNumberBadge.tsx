import { cn } from "@/lib/utils";

interface OfficialNumberBadgeProps {
  /** Official number of the request ("CP 2026-0169"); the API only sends it once it is delivered. */
  officialNumber: string | null | undefined;
  className?: string;
}

/** Highlights the official number (C-13) next to the REQ code; renders nothing while there is none. */
export function OfficialNumberBadge({ officialNumber, className }: OfficialNumberBadgeProps) {
  const value = officialNumber?.trim();
  if (!value) return null;
  return (
    <span
      title="Número oficial"
      className={cn(
        "inline-flex items-center rounded border border-icesi-blue/30 bg-icesi-blue/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-icesi-blue dark:text-icesi-purple",
        className,
      )}
    >
      {value}
    </span>
  );
}
