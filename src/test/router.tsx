import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

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
 * The single place tests get their router from. Today it is a MemoryRouter; when the app moves
 * to Next.js this file swaps to a mock of `next/navigation` and the tests stay untouched.
 */
export function TestRouter({ route = "/", routes, children }: TestRouterProps) {
  return (
    <MemoryRouter initialEntries={[route]}>
      {routes ? (
        <Routes>
          {Object.entries(routes).map(([path, element]) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      ) : (
        children
      )}
    </MemoryRouter>
  );
}
