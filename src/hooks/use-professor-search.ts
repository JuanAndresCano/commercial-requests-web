import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { professorsApi, type ProfessorType } from "@/lib/api/professors";

const DEBOUNCE_MS = 250;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

interface ProfessorSearchOptions {
  /** Restricts the search to one kind; omitted, the whole directory is searched. */
  type?: ProfessorType;
  /** The search only runs once the term has this many characters (default 0: an empty term lists the first entries). */
  minChars?: number;
}

/** Debounced search of the professor directory. */
export function useProfessorSearch(term: string, { type, minChars = 0 }: ProfessorSearchOptions = {}) {
  const trimmed = term.trim();
  const query = useDebouncedValue(trimmed, DEBOUNCE_MS);
  const enabled = query.length >= minChars;

  const result = useQuery({
    queryKey: ["professors", type ?? "ALL", query],
    queryFn: () => professorsApi.list({ q: query || undefined, type }),
    staleTime: 30_000,
    enabled,
  });

  return {
    professors: enabled ? (result.data ?? []) : [],
    // Also true while the user is still typing and the debounce has not fired.
    isSearching: trimmed.length >= minChars && (trimmed !== query || result.isFetching),
    isError: enabled && result.isError,
    hasSearched: enabled && result.isSuccess && trimmed === query,
  };
}
