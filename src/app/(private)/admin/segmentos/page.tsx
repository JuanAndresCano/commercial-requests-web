"use client";

import dynamic from "next/dynamic";

const AdminSegmentosView = dynamic(() => import("@/views/admin/AdminSegmentosView"), {
  ssr: false,
  loading: () => null,
});

export default function AdminSegmentosPage() {
  return <AdminSegmentosView />;
}
