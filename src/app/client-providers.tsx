"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Providers (auth, realtime, theme...) read localStorage and the browser at render time, so they are
// loaded client-side only. The server therefore sends an empty body, exactly like Vite's empty #root.
const Providers = dynamic(() => import("./providers"), { ssr: false, loading: () => null });

export function ClientProviders({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
