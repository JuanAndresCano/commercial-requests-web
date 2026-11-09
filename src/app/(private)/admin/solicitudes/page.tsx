"use client";

import dynamic from "next/dynamic";

const AdminSolicitudesView = dynamic(() => import("@/views/admin/AdminSolicitudesView"), {
  ssr: false,
  loading: () => null,
});

export default function AdminSolicitudesPage() {
  return <AdminSolicitudesView />;
}
