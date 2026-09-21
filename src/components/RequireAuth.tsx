import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/** Keeps signed-out visitors away from the private routes. */
export function RequireAuth() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Verificando sesión…
      </div>
    );
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
