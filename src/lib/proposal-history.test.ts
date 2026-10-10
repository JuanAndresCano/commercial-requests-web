import { describe, expect, it } from "vitest";
import type { RequestItem } from "@/lib/mock-data";
import { findCompanyProposals, normalizeCompanyName, parseHistorySearchTerm } from "./proposal-history";

function req(id: string, company: string, companyNit?: string): RequestItem {
  return {
    id,
    title: `Request ${id}`,
    applicant: "Ana",
    type: "Capacitación",
    createdAt: "2026-03-01T10:00:00.000Z",
    status: "nueva",
    urgency: "media",
    company,
    companyNit,
    node: "Nodo",
    productLeader: "Líder",
    kam: "KAM",
  };
}

const requests = [
  req("1", "Gases de Occidente", "890303893-0"),
  req("2", "Gases de Occidente S.A.", "890303893-0"),
  req("3", "Grupo Argos", "890900266-3"),
  req("4", "Demo Corp", undefined),
  req("5", "Grupo Éxito", "890900608-9"),
  req("6", "Banco con NIT de 9 dígitos", "890903938"),
];

const ids = (list: RequestItem[]) => list.map((r) => r.id);

describe("normalizeCompanyName", () => {
  it("ignores case, accents and extra spaces", () => {
    expect(normalizeCompanyName("  GRUPO   éxito ")).toBe("grupo exito");
  });
});

describe("findCompanyProposals", () => {
  it("shows nothing without a name or a NIT", () => {
    expect(findCompanyProposals(requests, {})).toEqual([]);
    expect(findCompanyProposals(requests, { name: "  ", nit: " - " })).toEqual([]);
  });

  it("matches the exact company name, ignoring case, accents and spaces", () => {
    expect(ids(findCompanyProposals(requests, { name: "  grupo   EXITO " }))).toEqual(["5"]);
  });

  it("does not match single words or partial names", () => {
    expect(findCompanyProposals(requests, { name: "demo" })).toEqual([]);
    expect(findCompanyProposals(requests, { name: "grupo" })).toEqual([]);
    expect(ids(findCompanyProposals(requests, { name: "Gases de Occidente" }))).toEqual(["1"]);
  });

  it("matches the exact NIT comparing digits only", () => {
    expect(ids(findCompanyProposals(requests, { nit: "890303893 0" }))).toEqual(["1", "2"]);
    expect(ids(findCompanyProposals(requests, { nit: "8903038930" }))).toEqual(["1", "2"]);
    expect(ids(findCompanyProposals(requests, { nit: "890.303.893-0" }))).toEqual(["1", "2"]);
  });

  it("finds a company by its 9-digit NIT even though it is stored with the check digit, and the other way round", () => {
    expect(ids(findCompanyProposals(requests, { nit: "890303893" }))).toEqual(["1", "2"]);
    expect(ids(findCompanyProposals(requests, { nit: "890.900.608" }))).toEqual(["5"]);
    expect(ids(findCompanyProposals(requests, { nit: "890.903.938-8" }))).toEqual(["6"]);
    expect(ids(findCompanyProposals(requests, { nit: "890903938" }))).toEqual(["6"]);
  });

  it("does not match a partial NIT or one with a different check digit", () => {
    expect(findCompanyProposals(requests, { nit: "89030389" })).toEqual([]);
    expect(findCompanyProposals(requests, { nit: "890303893-6" })).toEqual([]);
  });

  it("combines name and NIT matches without duplicating requests", () => {
    expect(ids(findCompanyProposals(requests, { name: "Gases de Occidente", nit: "890303893-0" }))).toEqual(["1", "2"]);
  });

  it("never matches requests that have no NIT when searching by NIT", () => {
    expect(findCompanyProposals(requests, { nit: "-" })).toEqual([]);
  });
});

describe("parseHistorySearchTerm", () => {
  it("treats a numeric term as a NIT and anything else as a company name", () => {
    expect(parseHistorySearchTerm("890.303.893-0")).toEqual({ nit: "890.303.893-0" });
    expect(parseHistorySearchTerm("  Grupo Argos ")).toEqual({ name: "Grupo Argos" });
    expect(parseHistorySearchTerm("Grupo 5")).toEqual({ name: "Grupo 5" });
    expect(parseHistorySearchTerm("   ")).toEqual({});
  });
});
