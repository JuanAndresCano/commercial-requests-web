import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { companiesApi } from "@/lib/api/companies";

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** Debounced company directory search by name or NIT. */
export function useCompanySearch(term: string) {
  const query = useDebouncedValue(term.trim(), DEBOUNCE_MS);
  const enabled = query.length >= MIN_QUERY_LENGTH;

  const result = useQuery({
    queryKey: ["companies", "search", query],
    queryFn: () => companiesApi.search(query),
    enabled,
    staleTime: 30_000,
  });

  return {
    companies: enabled ? (result.data ?? []) : [],
    // Also true while the user is still typing and the debounce has not fired.
    isSearching: term.trim() !== query || result.isFetching,
    isError: enabled && result.isError,
    hasSearched: enabled && result.isSuccess && term.trim() === query,
  };
}
