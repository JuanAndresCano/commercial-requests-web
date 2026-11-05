"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/components/RequireAuth";

/** Every route under (private) needs a session: signed-out visitors are sent to /login. */
export default function PrivateLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
