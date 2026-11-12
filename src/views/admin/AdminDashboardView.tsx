"use client";

import { AppShell } from "@/components/AppShell";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboardView() {
  const { user } = useAuth();

  return (
    <AppShell>
      <div data-testid="admin-resumen-view">
        <AdminDashboard user={user} />
      </div>
    </AppShell>
  );
}
