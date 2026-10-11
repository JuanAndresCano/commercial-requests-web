import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionConflictDialog } from "./SessionConflictDialog";

const authState = vi.hoisted(() => ({ sessionConflict: null as "user-changed" | "signed-out" | null }));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => authState,
}));

describe("SessionConflictDialog", () => {
  beforeEach(() => {
    authState.sessionConflict = null;
  });

  it("shows nothing while the session is consistent", () => {
    render(<SessionConflictDialog />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explains that the user signed out in another tab", () => {
    authState.sessionConflict = "signed-out";
    render(<SessionConflictDialog />);

    expect(screen.getByRole("dialog")).toHaveTextContent("Se cerró la sesión en otra pestaña. Recarga para continuar.");
  });

  it("blocks the tab with a reload prompt when another user signed in", () => {
    authState.sessionConflict = "user-changed";
    const reload = vi.fn();
    render(<SessionConflictDialog onReload={reload} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Se inició sesión con otro usuario en otra pestaña. Recarga para continuar.");

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(dialog.className).toContain("[&>button]:hidden");

    fireEvent.click(screen.getByRole("button", { name: "Recargar" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
