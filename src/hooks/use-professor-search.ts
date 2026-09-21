import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { professorsApi, type NewExternalProfessor, type ProfessorType } from "@/lib/api/professors";

const DEBOUNCE_MS = 250;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** Debounced search of the professor directory; an empty term lists the first entries. */
export function useProfessorSearch(term: string, type: ProfessorType) {
  const query = useDebouncedValue(term.trim(), DEBOUNCE_MS);

  const result = useQuery({
    queryKey: ["professors", type, query],
    queryFn: () => professorsApi.list({ q: query || undefined, type }),
    staleTime: 30_000,
  });

  return {
    professors: result.data ?? [],
    // Also true while the user is still typing and the debounce has not fired.
    isSearching: term.trim() !== query || result.isFetching,
    isError: result.isError,
    hasSearched: result.isSuccess && term.trim() === query,
  };
}

/** Registers an external advisor in the directory and refreshes the searches. */
export function useRegisterExternalProfessor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: NewExternalProfessor) => professorsApi.createExternal(data),
    onSuccess: () => client.invalidateQueries({ queryKey: ["professors"] }),
  });
}
