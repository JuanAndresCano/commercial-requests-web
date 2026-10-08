import { describe, expect, it } from "vitest";
import type { RequestFormData } from "@/pages/NewRequest";
import { buildCreateProposalPayload } from "./create-proposal-payload";

const EMPTY: RequestFormData = {
  kam: "Diana",
  nit: "",
  empresaNombre: "Acme",
  direccion: "",
  telefonoEmpresa: "",
  correoEmpresa: "",
  ciiuPrincipal: "",
  ciiuPrincipalDesc: "",
  ciiusSecundarios: [],
  tipoEmpresa: "",
  descripcion: "",
  web: "",
  contactoNombre: "",
  telefono: "",
  telefonoSecundario: "",
  correo: "",
  correoAlternativo: "",
  cargo: "",
  area: "",
  contactosAdicionales: [],
  nodo: "",
  ldp: "",
  nombreReq: "",
  tipoReq: "",
  tipoReqOtro: "",
  urgencia: "",
  participantes: "",
  horas: "",
  modalidad: "",
  alimentacion: "",
  necesidad: "",
  competencias: "",
  exito: "",
  resultados: "",
  areaParticipantes: "",
  formacionPrevia: "",
  descFormacion: "",
  empresaPrevia: "",
  fechaPrevia: "",
  observaciones: "",
  archivos: [],
};

const build = (data: Partial<RequestFormData>) =>
  buildCreateProposalPayload({ ...EMPTY, ...data }, { title: "Título", nodeId: "n1", productLeaderId: "l1" });

describe("buildCreateProposalPayload: company details", () => {
  it("carries the address, phone, e-mail and CIIU codes the wizard collects", () => {
    const payload = build({
      direccion: "Calle 1 # 2-3",
      telefonoEmpresa: "6025551234",
      correoEmpresa: "info@acme.co",
      ciiuPrincipal: "6412",
      ciiuPrincipalDesc: "Bancos",
      ciiusSecundarios: ["6419", "6492"],
    });
    expect(payload).toMatchObject({
      companyAddress: "Calle 1 # 2-3",
      companyPhone: "6025551234",
      companyEmail: "info@acme.co",
      ciiuCode: "6412",
      sector: "Bancos",
      ciiuSecondary: ["6419", "6492"],
    });
  });

  it("omits what is empty", () => {
    const payload = build({});
    expect(payload.companyAddress).toBeUndefined();
    expect(payload.ciiuSecondary).toBeUndefined();
    expect(payload.additionalContacts).toBeUndefined();
  });
});

describe("buildCreateProposalPayload: contacts", () => {
  const ana = { id: "a1", nombre: "Ana", cargo: "Gerente", telefono: "300", correo: "ana@acme.co", area: "RRHH" };
  const luis = { id: "a2", nombre: "Luis", cargo: "", telefono: "", correo: "", area: "" };

  it("carries the main contact with its secondary phone and alternative e-mail", () => {
    const payload = build({
      contactoNombre: "Valentina",
      telefono: "311",
      telefonoSecundario: "312",
      correo: "v@acme.co",
      correoAlternativo: "v2@acme.co",
      cargo: "CEO",
      area: "Dirección",
    });
    expect(payload).toMatchObject({
      contactName: "Valentina",
      contactPhone: "311",
      contactSecondaryPhone: "312",
      contactEmail: "v@acme.co",
      contactAlternativeEmail: "v2@acme.co",
      contactRole: "CEO",
      contactArea: "Dirección",
    });
  });

  it("sends every additional contact next to the main one", () => {
    const payload = build({ contactoNombre: "Valentina", contactosAdicionales: [ana, luis] });
    expect(payload.additionalContacts).toEqual([
      { name: "Ana", role: "Gerente", area: "RRHH", phone: "300", email: "ana@acme.co" },
      { name: "Luis" },
    ]);
  });

  it("without a main contact the first additional one becomes it, and only the rest are additional", () => {
    const payload = build({ contactosAdicionales: [ana, luis] });
    expect(payload).toMatchObject({ contactName: "Ana", contactEmail: "ana@acme.co" });
    expect(payload.contactSecondaryPhone).toBeUndefined();
    expect(payload.additionalContacts).toEqual([{ name: "Luis" }]);
  });

  it("ignores additional contacts the KAM left blank", () => {
    const blank = { id: "x", nombre: "", cargo: "", telefono: "", correo: "", area: "" };
    const payload = build({ contactoNombre: "Valentina", contactosAdicionales: [blank, luis] });
    expect(payload.additionalContacts).toEqual([{ name: "Luis" }]);
  });
});

describe("buildCreateProposalPayload: requirement", () => {
  it("keeps 'Más de 25' and reads 'No' catering as no catering", () => {
    const payload = build({ participantes: "Más de 25", alimentacion: "No" });
    expect(payload.participantRange).toBe("Más de 25");
    expect(payload.requiresCatering).toBe(false);
    expect(payload.cateringNotes).toBeUndefined();
  });

  it("sends the chosen node and leader and the title", () => {
    const payload = build({});
    expect(payload).toMatchObject({ nodeId: "n1", productLeaderId: "l1", programName: "Título" });
  });
});
