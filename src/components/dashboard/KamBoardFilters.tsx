import { X } from "@/components/icons";
import { hasActiveKamBoardFilters, type KamBoardFilterOptions, type KamBoardFilters } from "@/lib/kam-board-filters";

interface KamBoardFiltersProps {
  filters: KamBoardFilters;
  options: KamBoardFilterOptions;
  onChange: (filters: KamBoardFilters) => void;
  onClear: () => void;
}

interface FilterSelectProps {
  label: string;
  allLabel: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, allLabel, value, values, onChange }: FilterSelectProps) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 min-w-0 max-w-[200px] rounded-lg border border-border dark:border-icesi-border bg-background dark:bg-icesi-dark px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-icesi-blue"
    >
      <option value="">{allLabel}</option>
      {values.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
}

/**
 * Filtros del tablero del KAM (líder de producto, empresa, tipo de solicitud).
 * Son controlados: el estado y su persistencia viven en el dashboard, que
 * también los combina con la etapa y el buscador.
 */
export function KamBoardFilters({ filters, options, onChange, onClear }: KamBoardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros del tablero">
      <FilterSelect
        label="Filtrar por líder de producto"
        allLabel="Todos los líderes"
        value={filters.productLeader}
        values={options.productLeaders}
        onChange={(productLeader) => onChange({ ...filters, productLeader })}
      />
      <FilterSelect
        label="Filtrar por empresa"
        allLabel="Todas las empresas"
        value={filters.company}
        values={options.companies}
        onChange={(company) => onChange({ ...filters, company })}
      />
      <FilterSelect
        label="Filtrar por tipo de solicitud"
        allLabel="Todos los tipos"
        value={filters.type}
        values={options.types}
        onChange={(type) => onChange({ ...filters, type })}
      />
      {hasActiveKamBoardFilters(filters) && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Quitar filtros
        </button>
      )}
    </div>
  );
}
