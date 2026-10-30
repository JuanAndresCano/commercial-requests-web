import { useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";

/** Same shape as `useRouter()` from `next/navigation` (the subset the app uses). */
export interface AppRouter {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
}

export function useRouter(): AppRouter {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      back: () => navigate(-1),
    }),
    [navigate],
  );
}

/** Current path without query string, like `usePathname()` from `next/navigation`. */
export function usePathname(): string {
  return useLocation().pathname;
}

/** Read-only query params, like `useSearchParams()` from `next/navigation` (no setter). */
export function useSearchParams(): URLSearchParams {
  const [params] = useRouterSearchParams();
  return params;
}

/** Route params, like `useParams()` from `next/navigation`. */
export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return useRouterParams() as T;
}
