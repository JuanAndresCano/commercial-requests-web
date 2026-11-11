"use client";

import dynamic from "next/dynamic";

const UserManagementView = dynamic(() => import("@/views/admin/UserManagementView"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Cargando gestión de accesos…</div>,
});

export default function UserManagementPage() {
  return <UserManagementView />;
}
