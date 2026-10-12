import { describe, expect, it } from "vitest";
import { getNavItems, isNavItemActive, NAV_ITEMS } from "./navigation";

describe("getNavItems", () => {
  it("gives the KAM the request list and the new-request wizard", () => {
    expect(getNavItems("kam").map((i) => i.to)).toEqual(["/dashboard", "/solicitudes/nueva"]);
  });

  it("gives the product leader only the unified board", () => {
    expect(getNavItems("lider-producto").map((i) => i.to)).toEqual(["/dashboard"]);
  });

  it("gives the node leader home and node requests", () => {
    expect(getNavItems("lider-nodo").map((i) => i.label)).toEqual(["Inicio", "Solicitudes de nodo"]);
  });

  it("gives the administrator a single Inicio link", () => {
    expect(getNavItems("administrador").map((i) => i.label)).toEqual(["Inicio"]);
  });

  it("never offers the wizard to roles other than the KAM", () => {
    for (const [role, items] of Object.entries(NAV_ITEMS)) {
      if (role === "kam") continue;
      expect(items.map((i) => i.to)).not.toContain("/solicitudes/nueva");
    }
  });
});

describe("isNavItemActive", () => {
  it("marks the dashboard active at / and /dashboard", () => {
    expect(isNavItemActive("/dashboard", "/", "")).toBe(true);
    expect(isNavItemActive("/dashboard", "/dashboard", "")).toBe(true);
    expect(isNavItemActive("/dashboard", "/solicitudes", "")).toBe(false);
  });

  it("keeps /solicitudes active on detail pages but not on the wizard", () => {
    expect(isNavItemActive("/solicitudes", "/solicitudes/REQ-1", "")).toBe(true);
    expect(isNavItemActive("/solicitudes", "/solicitudes/nueva", "")).toBe(false);
    expect(isNavItemActive("/solicitudes/nueva", "/solicitudes/nueva", "")).toBe(true);
  });

  it("matches links that carry a query string", () => {
    expect(isNavItemActive("/solicitudes?filter=sin-profesor", "/solicitudes", "?filter=sin-profesor")).toBe(true);
    expect(isNavItemActive("/solicitudes?filter=sin-profesor", "/solicitudes", "")).toBe(false);
  });
});
