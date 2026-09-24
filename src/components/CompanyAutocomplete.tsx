import { useMemo, useState } from "react";
import { Search, X } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompanySearch } from "@/hooks/use-company-search";
import type { Company } from "@/lib/api/companies";
import { formatNit } from "@/lib/company";
import { fuzzyFilter } from "@/lib/fuzzy";

interface CompanyAutocompleteProps {
  onSelect: (company: Company) => void;
}

/** Searches the company directory (backend) by name or NIT and reports the pick. */
export function CompanyAutocomplete({ onSelect }: CompanyAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { companies, isSearching, isError, hasSearched } = useCompanySearch(searchTerm);

  const displayedCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    return fuzzyFilter(companies, searchTerm, (c) => [c.name, c.nit ?? ""]);
  }, [companies, searchTerm]);

  const handleSelect = (company: Company) => {
    onSelect(company);
    setSearchTerm("");
    setShowDropdown(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="company-search-input" className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Search className="h-4 w-4 text-accent" />
          Búsqueda de Empresa por Nombre / Razón Social o NIT
        </Label>
        <span className="text-xs font-normal text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full border border-border">
          Opcional
        </span>
      </div>

      <div className="relative">
        <Input
          id="company-search-input"
          placeholder="Ej. Bancolombia, Manuelita o NIT..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          autoComplete="off"
          className="bg-card text-sm h-10 pr-8"
        />
        {searchTerm && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => {
              setSearchTerm("");
              setShowDropdown(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {showDropdown && searchTerm.trim().length >= 2 && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {displayedCompanies.length > 0 && (
              <>
                <div className="p-1.5 text-[11px] font-semibold text-muted-foreground bg-secondary/50 px-3">
                  Coincidencias encontradas en el directorio:
                </div>
                {displayedCompanies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-accent/15 flex items-center justify-between border-b border-border/40 last:border-0 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-foreground block text-sm">{c.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {c.nit ? `NIT: ${formatNit(c.nit)}` : "Sin NIT registrado"}
                      </span>
                    </div>
                    <span className="text-[10px] bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded">
                      Seleccionar
                    </span>
                  </button>
                ))}
              </>
            )}
            {displayedCompanies.length === 0 && isSearching && (
              <p className="px-3 py-2.5 text-xs text-muted-foreground">Buscando…</p>
            )}
            {displayedCompanies.length === 0 && !isSearching && isError && (
              <p className="px-3 py-2.5 text-xs text-destructive">
                No pudimos consultar el directorio. Puedes escribir los datos manualmente.
              </p>
            )}
            {displayedCompanies.length === 0 && !isSearching && !isError && hasSearched && (
              <p className="px-3 py-2.5 text-xs text-muted-foreground">
                Sin coincidencias. Puedes ingresar la empresa manualmente más abajo.
              </p>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Escribe el nombre o razón social de la organización, o su NIT, para autocompletar los datos que ya tenemos
        registrados.
      </p>
    </div>
  );
}
