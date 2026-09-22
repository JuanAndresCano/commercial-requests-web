import { useId, useState } from "react";
import { Check, Search, X } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useProfessorSearch } from "@/hooks/use-professor-search";
import type { Professor, ProfessorType } from "@/lib/api/professors";

interface ProfessorPickerProps {
  /** Which part of the directory to search: institutional professors or registered external advisors. */
  type: ProfessorType;
  /** Currently selected entry, highlighted in the list. */
  selectedId?: string | null;
  onSelect: (professor: Professor) => void;
  label?: string;
  placeholder?: string;
}

/** Searches the professor directory (backend) and reports the entry the product leader picks. */
export function ProfessorPicker({ type, selectedId, onSelect, label, placeholder }: ProfessorPickerProps) {
  const [term, setTerm] = useState("");
  const inputId = useId();
  const { professors, isSearching, isError, hasSearched } = useProfessorSearch(term, type);

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-xs font-semibold flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-accent" />
        {label ?? (type === "STAFF" ? "Buscar profesor de planta" : "Buscar consultor registrado")}
      </Label>

      <div className="relative">
        <Input
          id={inputId}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder ?? (type === "STAFF" ? "Nombre o facultad…" : "Nombre o empresa…")}
          autoComplete="off"
          className="h-9 pr-8 text-xs"
        />
        {term && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => setTerm("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <ul
        aria-label="Resultados del directorio"
        className="max-h-56 overflow-y-auto rounded-md border border-border bg-card divide-y divide-border/50"
      >
        {professors.map((professor) => {
          const selected = professor.id === selectedId;
          const detail = type === "STAFF" ? professor.faculty : professor.company;
          return (
            <li key={professor.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(professor)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-accent/10",
                  selected && "bg-accent/10",
                )}
              >
                <span>
                  <span className="block font-medium text-foreground">{professor.fullName}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {detail ?? (type === "STAFF" ? "Facultad sin registrar" : "Empresa sin registrar")}
                  </span>
                </span>
                {selected && <Check className="h-4 w-4 shrink-0 text-accent" aria-label="Seleccionado" />}
              </button>
            </li>
          );
        })}
        {professors.length === 0 && isSearching && (
          <li className="px-3 py-2.5 text-xs text-muted-foreground">Buscando…</li>
        )}
        {professors.length === 0 && !isSearching && isError && (
          <li className="px-3 py-2.5 text-xs text-destructive">
            No pudimos consultar el directorio. Intenta de nuevo.
          </li>
        )}
        {professors.length === 0 && !isSearching && !isError && hasSearched && (
          <li className="px-3 py-2.5 text-xs text-muted-foreground">Sin coincidencias en el directorio.</li>
        )}
      </ul>
    </div>
  );
}
