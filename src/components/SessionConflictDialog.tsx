import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";

/**
 * Blocks the tab when another tab of this browser changed the session (signed in
 * as someone else, or signed out): what this tab shows no longer matches the
 * cookie, and the only safe way forward is to reload.
 */
export function SessionConflictDialog({ onReload = () => window.location.reload() }: { onReload?: () => void }) {
  const { sessionConflict } = useAuth();

  return (
    <Dialog open={sessionConflict !== null}>
      <DialogContent
        className="max-w-md [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>La sesión cambió</DialogTitle>
          <DialogDescription>
            {sessionConflict === "signed-out"
              ? "Se cerró la sesión en otra pestaña. Recarga para continuar."
              : "Se inició sesión con otro usuario en otra pestaña. Recarga para continuar."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={onReload}>
            Recargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
