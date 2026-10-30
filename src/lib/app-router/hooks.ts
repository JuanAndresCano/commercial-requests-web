import { useMemo } from "react";
import {
  useParams as useNextParams,
  usePathname as useNextPathname,
  useRouter as useNextRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";

/** The subset of the Next.js router the app uses. */
export interface AppRouter {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
}

export function useRouter(): AppRouter {
  const router = useNextRouter();
  return useMemo(
    () => ({
      push: (href: string) => router.push(href),
      replace: (href: string) => router.replace(href),
      back: () => router.back(),
    }),
    [router],
  );
}

/** Current path without the query string. */
export function usePathname(): string {
  return useNextPathname();
}

/** Read-only query params. */
export function useSearchParams() {
  return useNextSearchParams();
}

/** Route params of the current dynamic segment, e.g. `{ id }` under `/solicitudes/[id]`. */
export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return useNextParams() as T;
}
