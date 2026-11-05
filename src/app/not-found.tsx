"use client";

import dynamic from "next/dynamic";

// Replaces the catch-all <Route path="*"> of the old router; Next answers these URLs with HTTP 404.
const NotFound = dynamic(() => import("@/views/NotFound"), { ssr: false, loading: () => null });

export default function NotFoundPage() {
  return <NotFound />;
}
