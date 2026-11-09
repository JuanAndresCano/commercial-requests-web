import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/lib/app-router";

/** Keeps signed-out visitors and users without a role away from the private routes. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "pending-role") router.replace("/onboarding/pending");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Verificando sesión…
      </div>
    );
  }
  if (status === "unauthenticated" || status === "pending-role") return null;
  return <>{children}</>;
}
