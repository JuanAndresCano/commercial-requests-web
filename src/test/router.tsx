import { useState, useSyncExternalStore, type ReactNode } from "react";
import { getTestRoute, matchRoute, resetTestRouter, subscribeTestRouter } from "./next-navigation-mock";

interface TestRouterProps {
  /** Starting location, e.g. "/solicitudes/REQ-1". Defaults to "/". */
  route?: string;
  /**
   * Optional route table, `{ "/solicitudes/:id": <RequestDetail /> }`. Without it `children`
   * render at every location. With it, only the matching entry renders, so a screen that
   * navigates away can be asserted through the placeholder of its destination.
   */
  routes?: Record<string, ReactNode>;
  children?: ReactNode;
}

/**
 * The single place tests get their router from. `next/navigation` and `next/link` are replaced by an
 * in-memory router in src/test/setup.ts; this component only sets its starting location and route table.
 */
export function TestRouter({ route = "/", routes, children }: TestRouterProps) {
  useState(() => {
    resetTestRouter(route, routes ? Object.keys(routes) : []);
    return true;
  });
  const { pathname } = useSyncExternalStore(subscribeTestRouter, getTestRoute);
  if (!routes) return <>{children}</>;
  const hit = matchRoute(pathname, Object.keys(routes));
  return <>{hit ? routes[hit.pattern] : null}</>;
}
