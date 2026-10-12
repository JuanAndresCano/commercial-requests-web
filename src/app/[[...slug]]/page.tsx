"use client";

import dynamic from "next/dynamic";

// SPA shell: the whole app (providers + react-router) still renders only in the browser,
// so the first paint is empty, exactly as it was with Vite. Routes move to files later.
const App = dynamic(() => import("@/App"), { ssr: false, loading: () => null });

export default function CatchAllPage() {
  return <App />;
}
