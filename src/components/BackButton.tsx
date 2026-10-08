import { Link } from "react-router-dom";
import { ArrowLeft } from "@/components/icons";

interface BackButtonProps {
  to: string;
  label: string;
}

/**
 * The way back from a detail page. It is a visible button (not a small grey link) and it stays pinned just
 * under the app header while the page scrolls: KAMs and product leaders did not find the old link.
 */
export function BackButton({ to, label }: BackButtonProps) {
  return (
    <div className="sticky top-16 z-10 -mx-1 w-fit px-1 py-1">
      <Link
        to={to}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label}
      </Link>
    </div>
  );
}
