import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/lib/app-router";

/** Keeps signed-out visitors away from the private routes. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Verificando sesión…
      </div>
    );
  }
  if (status === "unauthenticated") return null;
  return <>{children}</>;
}
