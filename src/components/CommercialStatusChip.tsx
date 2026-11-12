import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { commercialStatusApi, type CommercialStatus } from "@/lib/api/commercial-status";
import {
  COMMERCIAL_STATUS_BASE_LABEL,
  COMMERCIAL_STATUS_LABELS,
  COMMERCIAL_STATUS_NONE_THEME,
  COMMERCIAL_STATUS_THEME,
  UNKNOWN_COMMERCIAL_STATUS_LABEL,
  isCommercialStatus,
} from "@/lib/commercial-status";
import { cn } from "@/lib/utils";

interface CommercialStatusChipProps {
  proposalId: string;
  status?: CommercialStatus | null;
  /** True only for the owner KAM of a delivered proposal; everyone else gets a static chip. */
  canEdit: boolean;
  className?: string;
}

const CHIP_BASE =
  "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5";

const labelOf = (status: CommercialStatus) => COMMERCIAL_STATUS_LABELS[status] ?? UNKNOWN_COMMERCIAL_STATUS_LABEL;
const themeOf = (status: CommercialStatus) => COMMERCIAL_STATUS_THEME[status] ?? COMMERCIAL_STATUS_NONE_THEME;

function Dot({ className }: { className: string }) {
  return <span data-slot="dot" aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", className)} />;
}

/**
 * The chip lives inside clickable cards (an anchor to the detail): its clicks, and those of its
 * portaled menu (React bubbles through portals), must neither navigate nor reach the card.
 */
function stopCardClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function StaticChip({ status, className }: { status: CommercialStatus | null; className?: string }) {
  const theme = status
    ? themeOf(status)
    : { chip: "border-border bg-muted/50 text-muted-foreground", dot: "bg-muted-foreground/50" };
  const textClass = className?.includes("truncate") ? "truncate" : "line-clamp-2 break-words leading-tight";
  return (
    <span
      data-commercial-status={status ?? "none"}
      title={status ? labelOf(status) : undefined}
      className={cn(CHIP_BASE, theme.chip, className)}
    >
      <Dot className={theme.dot} />
      <span className={textClass}>{status ? labelOf(status) : COMMERCIAL_STATUS_BASE_LABEL}</span>
    </span>
  );
}

function EditableChip({ proposalId, status, className }: Omit<CommercialStatusChipProps, "canEdit">) {
  const client = useQueryClient();
  // Optimistic value shown while (and just after) a write; cleared when the server value arrives or on failure.
  const [optimistic, setOptimistic] = useState<{ value: CommercialStatus | null } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOptimistic(null);
  }, [status]);

  const update = useMutation({
    mutationFn: (next: CommercialStatus | null) => commercialStatusApi.update(proposalId, next),
    onMutate: (next) => setOptimistic({ value: next }),
    onSuccess: (updated, next) => {
      client.setQueryData(["requests", proposalId], updated);
      void client.invalidateQueries({ queryKey: ["requests"] });
      void client.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success(next ? `Seguimiento comercial actualizado: ${labelOf(next)}` : "Etiqueta comercial quitada");
    },
    onError: () => {
      setOptimistic(null);
      toast.error("No se pudo guardar el seguimiento comercial. Se conservó la etiqueta anterior.");
    },
  });

  const current = optimistic ? optimistic.value : (status ?? null);
  const theme = current ? themeOf(current) : COMMERCIAL_STATUS_NONE_THEME;

  const choose = (next: CommercialStatus | null) => {
    if (next === current) return;
    update.mutate(next);
  };

  return (
    // Capture-free wrapper: swallows clicks from the trigger and from the portaled menu.
    <span className={cn("inline-flex max-w-full", className)} onClick={stopCardClick} onKeyDown={stopEnterBubble}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-commercial-status={current ?? "none"}
            aria-label={
              current ? `Cambiar seguimiento comercial: ${labelOf(current)}` : "Asignar seguimiento comercial"
            }
            title={current ? labelOf(current) : undefined}
            className={cn(
              CHIP_BASE,
              theme.chip,
              "cursor-pointer transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              !current && "hover:text-foreground",
            )}
          >
            {current ? (
              <>
                <Dot className={theme.dot} />
                <span className="truncate">{labelOf(current)}</span>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
              </>
            ) : (
              <span>+ Asignar estado</span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[14rem]">
          <DropdownMenuRadioGroup
            value={current ?? ""}
            onValueChange={(value) => isCommercialStatus(value) && choose(value)}
          >
            {(Object.keys(COMMERCIAL_STATUS_LABELS) as CommercialStatus[]).map((value) => (
              <DropdownMenuRadioItem key={value} value={value} className="gap-2 text-xs">
                <Dot className={COMMERCIAL_STATUS_THEME[value].dot} />
                {COMMERCIAL_STATUS_LABELS[value]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {current && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs text-muted-foreground" onSelect={() => choose(null)}>
                Quitar etiqueta
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

/** Enter/Space on the trigger must not activate the card link either. */
function stopEnterBubble(event: { key: string; stopPropagation: () => void }) {
  if (event.key === "Enter" || event.key === " ") event.stopPropagation();
}

/**
 * Commercial follow-up chip (Outlook-style category): coloured dot + label. The owner KAM gets a
 * menu to change it (optimistic, with rollback and toasts); everyone else sees a static chip.
 */
export function CommercialStatusChip({ proposalId, status, canEdit, className }: CommercialStatusChipProps): ReactNode {
  if (!canEdit) return <StaticChip status={status ?? null} className={className} />;
  return <EditableChip proposalId={proposalId} status={status} className={className} />;
}
