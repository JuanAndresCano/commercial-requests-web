import type { RequestItem } from "@/lib/mock-data";

/** Filtros del tablero del KAM por líder de producto, empresa y tipo de solicitud. "" = sin filtrar. */
export interface KamBoardFilters {
  productLeader: string;
  company: string;
  type: string;
}

export interface KamBoardFilterOptions {
  productLeaders: string[];
  companies: string[];
  types: string[];
}

export const EMPTY_KAM_BOARD_FILTERS: KamBoardFilters = { productLeader: "", company: "", type: "" };

/** Estructural a propósito: basta con tener los tres campos (el tipo real es `RequestItem`). */
type FilterableRequest = Pick<RequestItem, "productLeader" | "company"> & { type: string };

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es"));
}

/** Las opciones salen de las solicitudes cargadas: nunca se ofrece algo que dejaría el tablero vacío por definición. */
export function deriveKamBoardFilterOptions(requests: FilterableRequest[]): KamBoardFilterOptions {
  return {
    productLeaders: uniqueSorted(requests.map((r) => r.productLeader)),
    companies: uniqueSorted(requests.map((r) => r.company)),
    types: uniqueSorted(requests.map((r) => r.type)),
  };
}

/**
 * Descarta selecciones guardadas (localStorage) que ya no existen en los datos
 * cargados — p. ej. una empresa cuya última solicitud se canceló — para que el
 * KAM no quede con un filtro invisible que vacía el tablero.
 */
export function sanitizeKamBoardFilters(filters: KamBoardFilters, options: KamBoardFilterOptions): KamBoardFilters {
  return {
    productLeader: options.productLeaders.includes(filters.productLeader) ? filters.productLeader : "",
    company: options.companies.includes(filters.company) ? filters.company : "",
    type: options.types.includes(filters.type) ? filters.type : "",
  };
}

export function hasActiveKamBoardFilters(filters: KamBoardFilters): boolean {
  return Boolean(filters.productLeader || filters.company || filters.type);
}

/** Los tres filtros se combinan con AND; uno vacío no restringe. */
export function matchesKamBoardFilters(req: FilterableRequest, filters: KamBoardFilters): boolean {
  if (filters.productLeader && req.productLeader.trim() !== filters.productLeader) return false;
  if (filters.company && req.company.trim() !== filters.company) return false;
  if (filters.type && req.type.trim() !== filters.type) return false;
  return true;
}
