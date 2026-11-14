"use client";

import dynamic from "next/dynamic";

const AdminDashboardView = dynamic(() => import("@/views/admin/AdminDashboardView"), {
  ssr: false,
  loading: () => null,
});

export default function AdminResumenPage() {
  return <AdminDashboardView />;
}
