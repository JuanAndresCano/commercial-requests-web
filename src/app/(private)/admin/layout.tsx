"use client";

import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";

/**
 * Ensures all routes under /admin are strictly protected by role:
 * Only users with role 'administrador' can access these views.
 */
export default function AdminAppLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
