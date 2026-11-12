"use client";

import dynamic from "next/dynamic";

const AdminKamsView = dynamic(() => import("@/views/admin/AdminKamsView"), {
  ssr: false,
  loading: () => null,
});

export default function AdminKamsPage() {
  return <AdminKamsView />;
}
