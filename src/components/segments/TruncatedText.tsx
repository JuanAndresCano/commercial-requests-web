import { useEffect, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string;
  className?: string;
}

/**
 * Single-line text that shows its full value in a tooltip, but only when the line is actually cut. Only a cut
 * text is focusable, so keyboard users do not tab through the rest.
 */
export function TruncatedText({ text, className }: TruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      setTruncated(Boolean(el) && el!.scrollWidth > el!.clientWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  return (
    <Tooltip open={open && truncated} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <span
          ref={ref}
          tabIndex={truncated ? 0 : undefined}
          className={cn(
            "block truncate rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-icesi-blue",
            className,
          )}
        >
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}
