"use client";

import dynamic from "next/dynamic";

const AdminEmpresasView = dynamic(() => import("@/views/admin/AdminEmpresasView"), {
  ssr: false,
  loading: () => null,
});

export default function AdminEmpresasPage() {
  return <AdminEmpresasView />;
}
