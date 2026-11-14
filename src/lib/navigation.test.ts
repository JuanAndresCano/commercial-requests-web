import { describe, expect, it } from "vitest";
import { getNavItems, isNavItemActive, NAV_ITEMS } from "./navigation";

describe("getNavItems", () => {
  it("gives the KAM the request list and the new-request wizard", () => {
    expect(getNavItems("kam").map((i) => i.to)).toEqual(["/dashboard", "/solicitudes/nueva"]);
  });

  it("gives the product leader only the unified board", () => {
    expect(getNavItems("lider-producto").map((i) => i.to)).toEqual(["/dashboard"]);
  });

  it("gives the administrator the executive submodules and access management", () => {
    expect(getNavItems("administrador").map((i) => i.label)).toEqual([
      "Resumen Ejecutivo",
      "Rendimiento KAMs",
      "Nodos y Portafolio",
      "Inteligencia Empresas",
      "Segmentos",
      "Gestión Solicitudes",
      "Gestión de Accesos",
    ]);
    expect(getNavItems("administrador").map((i) => i.to)).toEqual([
      "/admin/dashboard",
      "/admin/kams",
      "/admin/nodos",
      "/admin/empresas",
      "/admin/segmentos",
      "/admin/solicitudes",
      "/admin/usuarios",
    ]);
  });

  it("never offers the wizard to roles other than the KAM", () => {
    for (const [role, items] of Object.entries(NAV_ITEMS)) {
      if (role === "kam") continue;
      expect(items.map((i) => i.to)).not.toContain("/solicitudes/nueva");
    }
  });

  it("never exposes administrative submodules to non-admin roles", () => {
    for (const [role, items] of Object.entries(NAV_ITEMS)) {
      if (role === "administrador") continue;
      for (const item of items) {
        expect(item.to.startsWith("/admin")).toBe(false);
      }
    }
  });
});

describe("isNavItemActive", () => {
  it("marks the dashboard active at / and /dashboard", () => {
    expect(isNavItemActive("/dashboard", "/", "")).toBe(true);
    expect(isNavItemActive("/dashboard", "/dashboard", "")).toBe(true);
    expect(isNavItemActive("/dashboard", "/solicitudes", "")).toBe(false);
  });

  it("marks admin executive summary active on /admin/dashboard, /admin/resumen and landing /dashboard", () => {
    expect(isNavItemActive("/admin/dashboard", "/admin/dashboard", "")).toBe(true);
    expect(isNavItemActive("/admin/dashboard", "/admin/resumen", "")).toBe(true);
    expect(isNavItemActive("/admin/dashboard", "/dashboard", "")).toBe(true);
    expect(isNavItemActive("/admin/dashboard", "/", "")).toBe(true);
    expect(isNavItemActive("/admin/dashboard", "/dashboard", "?tab=empresas")).toBe(false);
    expect(isNavItemActive("/admin/dashboard", "/admin/kams", "")).toBe(false);
  });

  it("marks admin submodules active for their respective paths", () => {
    expect(isNavItemActive("/admin/kams", "/admin/kams", "")).toBe(true);
    expect(isNavItemActive("/admin/nodos", "/admin/nodos", "")).toBe(true);
    expect(isNavItemActive("/admin/solicitudes", "/admin/solicitudes", "")).toBe(true);
    expect(isNavItemActive("/admin/empresas", "/admin/empresas", "")).toBe(true);
    expect(isNavItemActive("/admin/empresas", "/dashboard", "?tab=empresas")).toBe(true);
    expect(isNavItemActive("/admin/segmentos", "/admin/segmentos", "?v=b")).toBe(true);
    expect(isNavItemActive("/admin/segmentos", "/admin/empresas", "")).toBe(false);
    expect(isNavItemActive("/admin/empresas", "/admin/segmentos", "")).toBe(false);
    expect(isNavItemActive("/admin/usuarios", "/admin/usuarios", "")).toBe(true);
    expect(isNavItemActive("/admin/usuarios", "/dashboard", "")).toBe(false);
  });

  it("keeps /solicitudes active on detail pages but not on the wizard or admin audit", () => {
    expect(isNavItemActive("/solicitudes", "/solicitudes/REQ-1", "")).toBe(true);
    expect(isNavItemActive("/solicitudes", "/solicitudes/nueva", "")).toBe(false);
    expect(isNavItemActive("/solicitudes", "/admin/solicitudes", "")).toBe(false);
    expect(isNavItemActive("/solicitudes/nueva", "/solicitudes/nueva", "")).toBe(true);
  });

  it("matches links that carry a query string", () => {
    expect(isNavItemActive("/solicitudes?filter=sin-profesor", "/solicitudes", "?filter=sin-profesor")).toBe(true);
    expect(isNavItemActive("/solicitudes?filter=sin-profesor", "/solicitudes", "")).toBe(false);
  });
});
