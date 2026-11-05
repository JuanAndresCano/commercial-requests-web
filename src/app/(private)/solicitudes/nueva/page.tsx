"use client";

import dynamic from "next/dynamic";

const NewRequest = dynamic(() => import("@/views/NewRequest"), { ssr: false, loading: () => null });

export default function NewRequestPage() {
  return <NewRequest />;
}
