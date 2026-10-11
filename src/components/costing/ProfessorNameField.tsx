import { useId, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useProfessorSearch } from "@/hooks/use-professor-search";
import type { Professor } from "@/lib/api/professors";
import { MIN_SEARCH_CHARS, matchProfessorsByName } from "@/lib/professor-form";

interface ProfessorNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** The product leader chose an entry of the directory. */
  onSelect: (professor: Professor) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
}

const kindLabel = (professor: Professor) => (professor.type === "STAFF" ? "Planta" : "Externo");

/**
 * Name input that suggests directory entries while typing (WAI-ARIA combobox with a listbox): after
 * two characters it searches the directory, ignoring case and accents. Typing a name that matches
 * nothing is fine — a new entry is created when the assignment is saved.
 */
export function ProfessorNameField({ value, onChange, onSelect, disabled, error, autoFocus }: ProfessorNameFieldProps) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { professors, isSearching, isError, hasSearched } = useProfessorSearch(value, { minChars: MIN_SEARCH_CHARS });
  const suggestions = matchProfessorsByName(professors, value);
  const showList = open && suggestions.length > 0;
  const optionId = (index: number) => `${inputId}-option-${index}`;

  const choose = (professor: Professor) => {
    setOpen(false);
    setActiveIndex(-1);
    onSelect(professor);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && showList && activeIndex >= 0) {
      // Choosing a suggestion must not submit the form.
      event.preventDefault();
      choose(suggestions[activeIndex]);
    }
  };

  const trimmedLength = value.trim().length;
  let hint: string;
  if (trimmedLength < MIN_SEARCH_CHARS) {
    hint = "Escribe al menos 2 letras para buscar en el directorio.";
  } else if (isError) {
    hint = "No pudimos consultar el directorio; puedes seguir escribiendo y se creará como nuevo al guardar.";
  } else if (isSearching) {
    hint = "Buscando en el directorio…";
  } else if (hasSearched && suggestions.length === 0) {
    hint = "No está en el directorio: se creará como nuevo al guardar.";
  } else {
    hint = `${suggestions.length} ${suggestions.length === 1 ? "coincidencia" : "coincidencias"} en el directorio. Elige una para reutilizarla o sigue escribiendo para crear una nueva.`;
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId} className="text-xs font-semibold">
        Nombre completo *
      </Label>
      <div className="relative">
        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          autoComplete="off"
          placeholder="Ej: Mauricio Restrepo Zuluaga"
          className="pl-8 text-xs"
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        />
        {showList && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Docentes y asesores del directorio"
            className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md"
          >
            {suggestions.map((professor, index) => {
              const detail = professor.type === "STAFF" ? professor.faculty : professor.company;
              return (
                <li
                  key={professor.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  // Keeps the focus in the input so the blur does not close the list before the click lands.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(professor)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-accent/10",
                    index === activeIndex && "bg-accent/10",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">{professor.fullName}</span>
                    {detail && <span className="block truncate text-[11px] text-muted-foreground">{detail}</span>}
                  </span>
                  <span className="shrink-0 rounded border border-border px-1.5 text-[10px] font-semibold text-muted-foreground">
                    {kindLabel(professor)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p id={hintId} role="status" className="text-[11px] text-muted-foreground">
        {hint}
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-[11px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
