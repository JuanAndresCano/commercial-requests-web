"use client";

import dynamic from "next/dynamic";

// The view reads the id with useParams() from @/lib/app-router.
const RequestDetail = dynamic(() => import("@/views/RequestDetail"), { ssr: false, loading: () => null });

export default function RequestDetailPage() {
  return <RequestDetail />;
}
