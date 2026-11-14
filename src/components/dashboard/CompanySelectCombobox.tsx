import { useState, useRef, useEffect, useMemo } from "react";
import { Building2, ChevronDown, Search, X, Check } from "@/components/icons";
import { fuzzyScore, normalizeText } from "@/lib/fuzzy";
import { formatNit } from "@/lib/nit";
import { cn } from "@/lib/utils";

export interface CompanyOption {
  id: string;
  name: string;
  nit?: string | null;
}

interface CompanySelectComboboxProps {
  companies: CompanyOption[];
  selectedCompanyId: string | null;
  onSelect: (companyId: string) => void;
  className?: string;
  placeholder?: string;
}

export function CompanySelectCombobox({
  companies,
  selectedCompanyId,
  onSelect,
  className,
  placeholder = "Seleccionar empresa aliada...",
}: CompanySelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId);
  }, [companies, selectedCompanyId]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Filter with fuzzy match on Name and substring match on NIT
  const filteredCompanies = useMemo(() => {
    const q = query.trim();
    if (!q) return companies;

    const cleanNumeric = q.replace(/\D/g, "");
    const qNorm = normalizeText(q);

    return companies
      .map((c) => {
        const nameNorm = normalizeText(c.name);
        const nameScore = fuzzyScore(q, c.name);
        const nameSubstring = nameNorm.includes(qNorm) ? 0.9 : 0;
        const cleanNit = c.nit ? c.nit.replace(/\D/g, "") : "";
        const nitScore = cleanNumeric && cleanNit.includes(cleanNumeric) ? 0.95 : 0;

        const maxScore = Math.max(nameScore, nameSubstring, nitScore);
        return { company: c, score: maxScore };
      })
      .filter((entry) => entry.score >= 0.45)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.company);
  }, [companies, query]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {/* Botón Trigger Limpio: Muestra ÚNICAMENTE el Nombre de la Empresa */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Seleccionar empresa aliada"
        className="flex h-9 w-64 sm:w-80 items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground shadow-xs transition-colors hover:border-icesi-blue/60 focus:outline-none focus:ring-1 focus:ring-icesi-blue cursor-pointer"
        title={selectedCompany?.name || placeholder}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{selectedCompany ? selectedCompany.name : placeholder}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Menú Desplegable con Buscador Integrado */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-72 sm:w-88 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          {/* Campo de búsqueda con icono y limpiar */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o NIT..."
              className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-icesi-blue focus:outline-none focus:ring-1 focus:ring-icesi-blue"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Borrar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Lista de Empresas Coincidentes */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filteredCompanies.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No se encontraron empresas con &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredCompanies.map((comp) => {
                const isSelected = comp.id === selectedCompanyId;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => handleSelect(comp.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer",
                      isSelected ? "bg-icesi-blue/10 text-icesi-blue font-bold" : "hover:bg-muted/60 text-foreground",
                    )}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate font-semibold">{comp.name}</span>
                      {comp.nit && (
                        <span className="text-[11px] font-mono text-muted-foreground">NIT: {formatNit(comp.nit)}</span>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-icesi-blue" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
