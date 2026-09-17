import { cn } from "@/lib/utils";

interface IcesiSymbolProps {
  className?: string;
  size?: number;
  color?: string; // default currentColor or #5454e9
}

/**
 * Universidad Icesi Brand Sun Wheel Symbol
 * 24 radiating bars around an inner circle with progressive thickness
 * reflecting the learning cycles and knowledge expansion (Manual p. 5)
 */
export function IcesiSymbol({ className, size = 36, color = "currentColor" }: IcesiSymbolProps) {
  // 24 spokes at 15 degree intervals
  const spokes = Array.from({ length: 24 }).map((_, index) => {
    const angle = (index * 360) / 24 - 90; // start from top
    // Progressive thickness: increases from spoke 0 to spoke 23
    // min stroke ~ 2, max stroke ~ 5.5
    const progress = index / 23;
    const strokeWidth = 2 + progress * 3.6;

    const rad = (angle * Math.PI) / 180;
    const innerR = 19;
    const outerR = 38;

    const x1 = 50 + innerR * Math.cos(rad);
    const y1 = 50 + innerR * Math.sin(rad);
    const x2 = 50 + outerR * Math.cos(rad);
    const y2 = 50 + outerR * Math.sin(rad);

    return {
      key: index,
      x1,
      y1,
      x2,
      y2,
      strokeWidth,
    };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-transform duration-300", className)}
      aria-label="Símbolo Universidad Icesi"
    >
      {spokes.map((s) => (
        <line
          key={s.key}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={color}
          strokeWidth={s.strokeWidth}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

interface IcesiLogoProps {
  className?: string;
  variant?: "horizontal" | "vertical" | "symbol-only";
  colorScheme?: "blue" | "white" | "dark" | "auto";
  withDescriptor?: boolean;
  descriptorText?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Official Universidad Icesi Brand Logo
 * Follows Brand Manual guidelines (p. 6, 7, 15, 16, 30)
 * Colors: Azul Icesi #5454e9, Blanco #ffffff, Negro #000000
 */
export function IcesiLogo({
  className,
  variant = "horizontal",
  colorScheme = "auto",
  withDescriptor = true,
  descriptorText = "Universidad",
  size = "md",
}: IcesiLogoProps) {
  // Determine color classes
  let symbolColor = "#5454e9";
  let textColor = "text-[#5454e9] dark:text-white";
  let descriptorColor = "text-[#88898c] dark:text-[#cecfd4]";

  if (colorScheme === "white") {
    symbolColor = "#ffffff";
    textColor = "text-white";
    descriptorColor = "text-white/80";
  } else if (colorScheme === "dark") {
    symbolColor = "#0f1015";
    textColor = "text-[#0f1015]";
    descriptorColor = "text-[#88898c]";
  } else if (colorScheme === "blue") {
    symbolColor = "#5454e9";
    textColor = "text-[#5454e9]";
    descriptorColor = "text-[#5454e9]/70";
  } else {
    // auto: matches current theme
    textColor = "text-foreground";
    descriptorColor = "text-muted-foreground";
  }

  const symbolSizes = {
    sm: 28,
    md: 38,
    lg: 48,
  };

  if (variant === "symbol-only") {
    return <IcesiSymbol size={symbolSizes[size]} color={symbolColor} className={className} />;
  }

  if (variant === "vertical") {
    return (
      <div className={cn("inline-flex flex-col items-center text-center select-none", className)}>
        <IcesiSymbol size={symbolSizes[size]} color={symbolColor} />
        {withDescriptor && (
          <span className={cn("mt-1 text-[11px] font-medium tracking-tight leading-none", descriptorColor)}>
            {descriptorText}
          </span>
        )}
        <span
          className={cn(
            "font-extrabold tracking-tight font-sans",
            size === "sm" && "text-lg",
            size === "md" && "text-2xl",
            size === "lg" && "text-3xl",
            textColor,
          )}
        >
          ICESI
        </span>
      </div>
    );
  }

  // Default horizontal
  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <IcesiSymbol size={symbolSizes[size]} color={symbolColor} />
      <div className="flex flex-col leading-none">
        {withDescriptor && (
          <span className={cn("text-[11px] font-medium tracking-normal mb-0.5", descriptorColor)}>
            {descriptorText}
          </span>
        )}
        <span
          className={cn(
            "font-extrabold tracking-[-0.02em] font-sans",
            size === "sm" && "text-lg",
            size === "md" && "text-2xl",
            size === "lg" && "text-3xl",
            textColor,
          )}
        >
          ICESI
        </span>
      </div>
    </div>
  );
}

/**
 * Brand Cenefa Component (Manual p. 78-80)
 * Linear graduated vertical rectangles based on the Icesi Wheel rays.
 * Adds authentic brand rhythm to card headers, dividers, or footers.
 */
export function IcesiCenefa({
  className,
  barsCount = 20,
  height = 12,
  color = "#5454e9",
  direction = "normal",
}: {
  className?: string;
  barsCount?: number;
  height?: number;
  color?: string;
  direction?: "normal" | "reverse";
}) {
  const bars = Array.from({ length: barsCount }).map((_, idx) => {
    const p = direction === "normal" ? idx / (barsCount - 1) : (barsCount - 1 - idx) / (barsCount - 1);
    const width = 1.5 + p * 3.5; // grows from 1.5px to 5px
    return { id: idx, width };
  });

  return (
    <div className={cn("flex items-center gap-1 overflow-hidden select-none", className)}>
      {bars.map((b) => (
        <span
          key={b.id}
          className="shrink-0 transition-all"
          style={{
            width: `${b.width}px`,
            height: `${height}px`,
            backgroundColor: color,
            display: "inline-block",
          }}
        />
      ))}
    </div>
  );
}
