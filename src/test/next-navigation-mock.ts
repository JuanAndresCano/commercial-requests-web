import { useMemo, useSyncExternalStore } from "react";

// In-memory stand-in for `next/navigation` in tests (installed by src/test/setup.ts; `next/link` is
// replaced by ./mock-link). Tests describe the router only through <TestRouter> in src/test/router.tsx.

interface Entry {
  pathname: string;
  search: string;
}

const state: { entries: Entry[]; index: number; patterns: string[] } = {
  entries: [{ pathname: "/", search: "" }],
  index: 0,
  patterns: [],
};
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function subscribeTestRouter(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getTestRoute = (): Entry => state.entries[state.index];

function parse(href: string): Entry {
  const [pathname, ...query] = href.split("?");
  return { pathname: pathname || "/", search: query.length ? `?${query.join("?")}` : "" };
}

export function resetTestRouter(route = "/", patterns: string[] = []) {
  state.entries = [parse(route)];
  state.index = 0;
  state.patterns = patterns;
}

/** Static patterns win over dynamic ones, like in the Next.js file router. */
export function matchRoute(pathname: string, patterns: string[]) {
  const ordered = [...patterns].sort((a, b) => Number(a.includes(":")) - Number(b.includes(":")));
  for (const pattern of ordered) {
    const keys: string[] = [];
    const source = pattern.replace(/:([A-Za-z]+)/g, (_match, key: string) => {
      keys.push(key);
      return "([^/]+)";
    });
    const found = new RegExp(`^${source}/?$`).exec(pathname);
    if (found) {
      return {
        pattern,
        params: Object.fromEntries(keys.map((key, i) => [key, decodeURIComponent(found[i + 1])])),
      };
    }
  }
  return null;
}

export function navigateTestRouter(href: string, replace: boolean) {
  const entry = parse(href);
  if (replace) state.entries[state.index] = entry;
  else {
    state.entries = [...state.entries.slice(0, state.index + 1), entry];
    state.index += 1;
  }
  notify();
}

const router = {
  push: (href: string) => navigateTestRouter(href, false),
  replace: (href: string) => navigateTestRouter(href, true),
  back: () => {
    if (state.index > 0) {
      state.index -= 1;
      notify();
    }
  },
  forward: () => {
    if (state.index < state.entries.length - 1) {
      state.index += 1;
      notify();
    }
  },
  refresh: () => {},
  prefetch: () => {},
};

export const useRouter = () => router;

export function usePathname() {
  return useSyncExternalStore(subscribeTestRouter, getTestRoute).pathname;
}

export function useSearchParams() {
  const { search } = useSyncExternalStore(subscribeTestRouter, getTestRoute);
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams() {
  const { pathname } = useSyncExternalStore(subscribeTestRouter, getTestRoute);
  return useMemo(() => matchRoute(pathname, state.patterns)?.params ?? {}, [pathname]);
}
