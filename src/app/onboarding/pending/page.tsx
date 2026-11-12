"use client";

import dynamic from "next/dynamic";

const PendingApproval = dynamic(() => import("@/views/PendingApproval"), {
  ssr: false,
  loading: () => null,
});

export default function PendingApprovalPage() {
  return <PendingApproval />;
}
