"use client";

import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/lib/app-router";

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Guards administrative modules: ensures only authenticated users with role
 * 'administrador' can access these views. Unauthorized users are smoothly
 * redirected to their role-specific dashboard.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user.role !== "administrador") {
      router.replace("/dashboard");
    }
  }, [user?.role, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Verificando credenciales administrativas…
      </div>
    );
  }

  if (status === "unauthenticated" || user.role !== "administrador") {
    return null;
  }

  return <>{children}</>;
}
