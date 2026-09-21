import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/context/ThemeContext";
import { ROLE_CONFIGS, type UserRole } from "@/context/AuthContext";
import { AppShell, SIDEBAR_STORAGE_KEY } from "./AppShell";

const auth = vi.hoisted(() => ({
  current: { role: "kam", roleLabel: "KAM", name: "Ana Pérez", email: "ana@icesi.edu.co" } as {
    role: UserRole;
    roleLabel: string;
    name: string;
    email: string;
  },
  logout: vi.fn(),
}));

vi.mock("@/context/AuthContext", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/context/AuthContext")>()),
  useAuth: () => ({ user: auth.current, logout: auth.logout }),
}));

function renderShell(role: UserRole = "kam") {
  auth.current = { ...auth.current, role, roleLabel: ROLE_CONFIGS[role].label };
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppShell>
          <p>contenido</p>
        </AppShell>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const mainNav = () => screen.getByRole("navigation", { name: "Navegación principal" });
const linkLabels = () =>
  within(mainNav())
    .getAllByRole("link")
    .map((a) => a.getAttribute("aria-label"));

describe("AppShell role-based menu", () => {
  beforeEach(() => {
    window.localStorage.clear();
    auth.logout.mockReset();
  });

  it.each<[UserRole, string[]]>([
    ["kam", ["Solicitudes", "Nueva solicitud"]],
    ["lider-producto", ["Solicitudes"]],
    ["lider-nodo", ["Inicio", "Solicitudes de nodo"]],
    ["administrador", ["Inicio"]],
  ])("shows only the modules of %s", (role, labels) => {
    renderShell(role);
    expect(linkLabels()).toEqual(labels);
  });

  it("does not offer the new-request wizard to a product leader", () => {
    renderShell("lider-producto");
    expect(screen.queryByRole("link", { name: "Nueva solicitud" })).not.toBeInTheDocument();
  });

  it("marks the current page and renders the page content", () => {
    renderShell("kam");
    expect(within(mainNav()).getByRole("link", { name: "Solicitudes" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("no longer exposes the demo role switcher or data reset", () => {
    renderShell("kam");
    expect(screen.queryByText(/simulación de rol/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/restablecer datos/i)).not.toBeInTheDocument();
  });
});

describe("AppShell collapsible sidebar", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts collapsed, expands with the toggle and remembers the choice", () => {
    const first = renderShell();
    const rail = () => document.getElementById("icesi-sidebar-rail");
    expect(rail()).toHaveAttribute("data-expanded", "false");

    fireEvent.click(screen.getByRole("button", { name: "Expandir menú" }));
    expect(rail()).toHaveAttribute("data-expanded", "true");
    expect(screen.getByRole("button", { name: "Contraer menú" })).toHaveAttribute("aria-expanded", "true");
    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("true");

    first.unmount();
    renderShell();
    expect(rail()).toHaveAttribute("data-expanded", "true");
  });
});

describe("AppShell mobile drawer", () => {
  beforeEach(() => window.localStorage.clear());

  it("opens a drawer with the same links as the desktop menu", () => {
    renderShell("lider-nodo");
    fireEvent.click(screen.getByRole("button", { name: "Menú de navegación" }));

    const drawer = screen.getByRole("dialog");
    const drawerLinks = within(drawer)
      .getAllByRole("link")
      .map((a) => a.getAttribute("aria-label"));
    expect(drawerLinks).toContain("Inicio");
    expect(drawerLinks).toContain("Solicitudes de nodo");
    expect(drawerLinks).not.toContain("Nueva solicitud");
  });

  it("closes the drawer after following a link", () => {
    renderShell("kam");
    fireEvent.click(screen.getByRole("button", { name: "Menú de navegación" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Nueva solicitud" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
