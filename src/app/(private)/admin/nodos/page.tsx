"use client";

import dynamic from "next/dynamic";

const AdminNodosView = dynamic(() => import("@/views/admin/AdminNodosView"), {
  ssr: false,
  loading: () => null,
});

export default function AdminNodosPage() {
  return <AdminNodosView />;
}
