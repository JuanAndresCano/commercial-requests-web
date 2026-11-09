import { describe, expect, it } from "vitest";
import type { RequestFormData } from "@/views/NewRequest";
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

const build = (data: Partial<RequestFormData>, context: { nodeId?: string } = { nodeId: "n1" }) =>
  buildCreateProposalPayload({ ...EMPTY, ...data }, { title: "Título", productLeaderId: "l1", ...context });

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

  it("sends the NIT as ten digits only, adding the check digit to a 9-digit one", () => {
    expect(build({ nit: "890.903.938-8" }).companyNit).toBe("8909039388");
    expect(build({ nit: "890903938" }).companyNit).toBe("8909039388");
  });

  it("does not send a NIT that is empty or invalid (the wizard blocks the latter before it gets here)", () => {
    expect(build({ nit: "" }).companyNit).toBeUndefined();
    expect(build({ nit: "890903938-5" }).companyNit).toBeUndefined();
  });

  it("never sends an invalid CIIU (the wizard blocks it before it gets here)", () => {
    expect(build({ ciiuPrincipal: "4845858858558" }).ciiuCode).toBeUndefined();
    expect(build({ ciiuPrincipal: "854" }).ciiuCode).toBeUndefined();
    expect(build({ ciiuPrincipal: " 8544 " }).ciiuCode).toBe("8544");
    expect(build({ ciiusSecundarios: ["6419", "64", "4845858858558"] }).ciiuSecondary).toEqual(["6419"]);
  });

  it("normalizes the secondary CIIU codes: no repeats, none equal to the principal, at most twenty", () => {
    expect(
      build({ ciiuPrincipal: "6412", ciiusSecundarios: ["6412", "6419", " 6419 ", "Pendiente", ""] }).ciiuSecondary,
    ).toEqual(["6419"]);
    const many = Array.from({ length: 25 }, (_, i) => String(1000 + i));
    expect(build({ ciiusSecundarios: many }).ciiuSecondary).toEqual(many.slice(0, 20));
  });

  it("omits what is empty", () => {
    const payload = build({});
    expect(payload.companyAddress).toBeUndefined();
    expect(payload.ciiuSecondary).toBeUndefined();
    expect(payload.additionalContacts).toBeUndefined();
  });
});

describe("buildCreateProposalPayload: contacts", () => {
  const ana = {
    id: "a1",
    nombre: "Ana",
    cargo: "Gerente",
    telefono: "3001234567",
    correo: "ana@acme.co",
    area: "RRHH",
  };
  const luis = { id: "a2", nombre: "Luis", cargo: "", telefono: "", correo: "", area: "" };

  it("carries the main contact with its secondary phone and alternative e-mail", () => {
    const payload = build({
      contactoNombre: "Valentina",
      telefono: "3111234567",
      telefonoSecundario: "3121234567",
      correo: "v@acme.co",
      correoAlternativo: "v2@acme.co",
      cargo: "CEO",
      area: "Dirección",
    });
    expect(payload).toMatchObject({
      contactName: "Valentina",
      contactPhone: "3111234567",
      contactSecondaryPhone: "3121234567",
      contactEmail: "v@acme.co",
      contactAlternativeEmail: "v2@acme.co",
      contactRole: "CEO",
      contactArea: "Dirección",
    });
  });

  it("sends every additional contact next to the main one", () => {
    const payload = build({ contactoNombre: "Valentina", contactosAdicionales: [ana, luis] });
    expect(payload.additionalContacts).toEqual([
      { name: "Ana", role: "Gerente", area: "RRHH", phone: "3001234567", email: "ana@acme.co" },
      { name: "Luis" },
    ]);
  });

  it("without a main contact the first additional one becomes it, and only the rest are additional", () => {
    const payload = build({ contactosAdicionales: [ana, luis] });
    expect(payload).toMatchObject({ contactName: "Ana", contactEmail: "ana@acme.co" });
    expect(payload.contactSecondaryPhone).toBeUndefined();
    expect(payload.additionalContacts).toEqual([{ name: "Luis" }]);
  });

  it("never sends an invalid phone: company, contact, secondary or additional", () => {
    const payload = build({
      telefonoEmpresa: "5551234",
      contactoNombre: "Valentina",
      telefono: "300123456",
      telefonoSecundario: "30012345678",
      contactosAdicionales: [{ ...ana, telefono: "5551234" }],
    });
    expect(payload.companyPhone).toBeUndefined();
    expect(payload.contactPhone).toBeUndefined();
    expect(payload.contactSecondaryPhone).toBeUndefined();
    expect(payload.additionalContacts).toEqual([{ name: "Ana", role: "Gerente", area: "RRHH", email: "ana@acme.co" }]);
  });

  it("never sends the invalid phone of a promoted contact", () => {
    const payload = build({ contactosAdicionales: [{ ...ana, telefono: "300" }] });
    expect(payload).toMatchObject({ contactName: "Ana", contactEmail: "ana@acme.co" });
    expect(payload.contactPhone).toBeUndefined();
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

  it("always sends the leader, and the node only when the KAM chose one", () => {
    const withoutNode = build({}, {});
    expect(withoutNode.productLeaderId).toBe("l1");
    expect(withoutNode.nodeId).toBeUndefined();
    expect(JSON.parse(JSON.stringify(withoutNode))).not.toHaveProperty("nodeId");
  });
});

describe("pending customer data", () => {
  it("keeps a contact email even when the person name is still pending", () => {
    expect(build({ correo: "contacto@empresa.co", contactoNombre: "Pendiente" }).contactEmail).toBe(
      "contacto@empresa.co",
    );
    expect(build({ correo: "contacto@empresa.co", contactoNombre: "" }).contactEmail).toBe("contacto@empresa.co");
  });
  it("does not drop an additional contact when the primary person has only an email", () => {
    const payload = build({
      correo: "principal@cliente.co",
      contactosAdicionales: [{ id: "a1", nombre: "Ana", correo: "ana@cliente.co", telefono: "", cargo: "", area: "" }],
    });
    expect(payload.contactEmail).toBe("principal@cliente.co");
    expect(payload.additionalContacts).toEqual([{ name: "Ana", email: "ana@cliente.co" }]);
  });
  it("does not send pending as a typed client identifier or channel", () => {
    const payload = build({
      nit: "Pendiente",
      correoEmpresa: "Pendiente",
      telefonoEmpresa: "Pendiente",
      web: "Pendiente",
      ciiuPrincipal: "Pendiente",
    });
    expect(payload.companyNit).toBeUndefined();
    expect(payload.companyEmail).toBeUndefined();
    expect(payload.companyPhone).toBeUndefined();
    expect(payload.website).toBeUndefined();
    expect(payload.ciiuCode).toBeUndefined();
  });
});
