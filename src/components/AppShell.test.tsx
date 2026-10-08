import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/context/ThemeContext";
import { ROLE_CONFIGS, type UserRole } from "@/context/AuthContext";
import { AppShell } from "./AppShell";

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

describe("AppShell hover sidebar (as in the validated prototype)", () => {
  beforeEach(() => window.localStorage.clear());

  const rail = () => document.getElementById("icesi-sidebar-rail") as HTMLElement;

  it("is a narrow rail that widens on hover, floating over the page", () => {
    renderShell();
    expect(rail()).toHaveClass("group", "w-16", "hover:w-64", "hover:shadow-2xl");
    const page = screen.getByText("contenido").closest("main")?.parentElement;
    expect(page).toHaveClass("lg:pl-16");
    expect(page).not.toHaveClass("lg:pl-64");
  });

  it("reveals the labels only while the pointer is over the rail", () => {
    renderShell();
    const label = within(mainNav()).getByText("Nueva solicitud");
    expect(label).toHaveClass("max-w-0", "opacity-0", "group-hover:max-w-[160px]", "group-hover:opacity-100");
  });

  it("has no expand/collapse button any more", () => {
    renderShell();
    expect(screen.queryByRole("button", { name: /expandir menú|contraer menú/i })).not.toBeInTheDocument();
  });

  it("shows the labels at once inside the mobile drawer", () => {
    renderShell("kam");
    fireEvent.click(screen.getByRole("button", { name: "Menú de navegación" }));
    const label = within(screen.getByRole("dialog")).getByText("Nueva solicitud");
    expect(label).toHaveClass("max-w-[160px]", "opacity-100");
    expect(label).not.toHaveClass("group-hover:max-w-[160px]");
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

describe("AppShell black side menu", () => {
  beforeEach(() => window.localStorage.clear());

  const rootTokens = () => {
    const css = readFileSync(resolve(__dirname, "../index.css"), "utf8");
    const rootBlock = /:root\s*\{([\s\S]*?)\n {2}\}/.exec(css)?.[1] ?? "";
    return Object.fromEntries(
      [...rootBlock.matchAll(/(--sidebar-[a-z-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
    );
  };

  it("defines the sidebar tokens as black in :root, so the light theme keeps it black", () => {
    const tokens = rootTokens();
    expect(tokens["--sidebar-background"]).toMatch(/^240 18% 5%/);
    expect(tokens["--sidebar-foreground"]).toBe("0 0% 96%");
    expect(tokens["--sidebar-accent"]).toBe("232 16% 16%");
    expect(tokens["--sidebar-accent-foreground"]).toBe("0 0% 100%");
    expect(tokens["--sidebar-border"]).toBe("232 14% 17%");
  });

  it("paints the rail on the sidebar token with light text, and styles items for a black surface", () => {
    renderShell("kam");
    const rail = document.getElementById("icesi-sidebar-rail");
    expect(rail).toHaveClass("bg-sidebar", "text-white");

    const active = within(mainNav()).getByRole("link", { name: "Solicitudes" });
    expect(active).toHaveClass("bg-icesi-yellow", "text-black");
    const inactive = within(mainNav()).getByRole("link", { name: "Nueva solicitud" });
    expect(inactive).toHaveClass("text-zinc-400", "hover:bg-white/10", "hover:text-white");

    const logout = within(rail as HTMLElement).getByRole("button", { name: "Cerrar sesión" });
    expect(logout).toHaveClass("text-zinc-400", "hover:bg-red-500/20", "hover:text-red-400");
    expect(within(rail as HTMLElement).getByText("KAM")).toHaveClass("text-zinc-400");
  });

  it("keeps the theme toggle light-on-black even in the light theme", () => {
    renderShell("kam");
    const toggle = within(document.getElementById("icesi-sidebar-rail") as HTMLElement).getByRole("button", {
      name: "Activar modo oscuro",
    });
    expect(document.documentElement).not.toHaveClass("dark");
    expect(toggle).toHaveClass("text-zinc-400", "hover:text-white");
    expect(toggle).not.toHaveClass("text-slate-600");
  });

  it("renders the mobile drawer on the same black surface", () => {
    renderShell("kam");
    fireEvent.click(screen.getByRole("button", { name: "Menú de navegación" }));
    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveClass("bg-sidebar", "text-white");
    expect(within(drawer).getByRole("button", { name: "Activar modo oscuro" })).toHaveClass("text-zinc-400");
  });
});
