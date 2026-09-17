import { Sun, Moon } from "@/components/icons";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "pill" | "dropdown-item";
  showLabel?: boolean;
}

export function ThemeToggle({ className, variant = "icon", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border",
          isDark
            ? "border-white/10 bg-[#1e202d] text-white hover:bg-[#252837]"
            : "border-border bg-white text-slate-700 hover:bg-slate-100 shadow-sm",
          className,
        )}
        title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        {isDark ? (
          <>
            <Sun className="h-3.5 w-3.5 text-[#e4eb60]" />
            <span>Modo claro</span>
          </>
        ) : (
          <>
            <Moon className="h-3.5 w-3.5 text-[#5454e9]" />
            <span>Modo oscuro</span>
          </>
        )}
      </button>
    );
  }

  // Default icon button (e.g. for sidebar rail)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5454e9]",
        isDark
          ? "text-zinc-400 hover:bg-white/10 hover:text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        className,
      )}
      title={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 shrink-0 text-zinc-300 hover:text-[#e4eb60] transition-colors" />
      ) : (
        <Moon className="h-5 w-5 shrink-0 text-slate-700 hover:text-[#5454e9] transition-colors" />
      )}
      {showLabel && (
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-[max-width,opacity] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:max-w-[160px] group-hover:opacity-100 group-hover:delay-75">
          {isDark ? "Modo claro" : "Modo oscuro"}
        </span>
      )}
    </button>
  );
}
