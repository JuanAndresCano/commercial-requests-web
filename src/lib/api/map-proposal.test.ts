import { describe, expect, it } from "vitest";
import {
  mapProposalToRequestItem,
  parseParticipantsRange,
  requestTypeToBackend,
  modalityToBackend,
} from "./map-proposal";
import type { BackendProposal } from "./requests";

function baseProposal(overrides: Partial<BackendProposal> = {}): BackendProposal {
  return {
    id: "9c858901-8a57-4791-81fe-4c455b099bc9",
    title: "Diagnóstico de cultura organizacional",
    creatorId: "kam-1",
    productLeaderId: "ldp-1",
    priority: "ALTA",
    company: { id: "c1", name: "Acme S.A.S." },
    contact: { id: "ct1", name: "Valentina Ríos" },
    node: { id: "n1", name: "IA+ Tech Digital" },
    program: {
      requestType: "CAPACITACION",
      requestTypeOther: null,
      programModality: "VIRTUAL",
      totalHours: 24,
      minParticipants: 5,
      maxParticipants: 15,
    },
    workflow: {
      currentStatus: { code: "IN_COSTING", name: "In costing" },
      deadline: "2026-12-15T00:00:00.000Z",
      currentStatusSince: "2026-09-20T00:00:00.000Z",
    },
    economics: [
      {
        id: "e1",
        isCurrent: true,
        grossValue: "30000000",
        estimatedMargin: "5000000",
        marginPercentage: "20",
        readyForKam: true,
        readyForKamAt: "2026-09-21T00:00:00.000Z",
      },
    ],
    assignments: [
      {
        role: "PROFESSOR",
        professorId: "prof-1",
        rawName: null,
        professor: {
          id: "prof-1",
          fullName: "Dra. Paula Henao",
          type: "STAFF",
          company: null,
          identityDocument: null,
          email: null,
          phone: null,
          profile: null,
        },
      },
    ],
    negotiationRounds: [
      {
        id: "r1",
        roundNumber: 1,
        offeredValue: "30000000",
        marginAmount: "5000000",
        marginPercentage: "20",
        leaderNote: null,
        sentToKamAt: "2026-09-21T00:00:00.000Z",
        sentToClientAt: null,
        clientResponse: "PENDING",
        clientNote: null,
      },
    ],
    creator: { id: "kam-1", email: "kam@icesi.edu.co", firstName: "Julian", lastName: "Duque" },
    productLeader: { id: "ldp-1", email: "ldp@icesi.edu.co", firstName: "Laura", lastName: "Diaz" },
    createdAt: "2026-09-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("mapProposalToRequestItem", () => {
  it("maps every backend status to its front equivalent, except REJECTED", () => {
    expect(mapProposalToRequestItem(baseProposal())?.status).toBe("en-costeo");
    expect(
      mapProposalToRequestItem(
        baseProposal({
          workflow: { currentStatus: { code: "NEW", name: "New" }, deadline: null, currentStatusSince: null },
        }),
      )?.status,
    ).toBe("nueva");
    expect(
      mapProposalToRequestItem(
        baseProposal({
          workflow: {
            currentStatus: { code: "IN_PROGRESS", name: "In progress" },
            deadline: null,
            currentStatusSince: null,
          },
        }),
      )?.status,
    ).toBe("en-experto");
    expect(
      mapProposalToRequestItem(
        baseProposal({
          workflow: {
            currentStatus: { code: "DELIVERED", name: "Delivered" },
            deadline: null,
            currentStatusSince: null,
          },
        }),
      )?.status,
    ).toBe("entregada");
  });

  it("returns null for REJECTED — the front has no pipeline stage for it yet", () => {
    const rejected = baseProposal({
      workflow: { currentStatus: { code: "REJECTED", name: "Rejected" }, deadline: null, currentStatusSince: null },
    });
    expect(mapProposalToRequestItem(rejected)).toBeNull();
  });

  it("maps the current professor assignment, distinguishing staff from external", () => {
    const item = mapProposalToRequestItem(baseProposal())!;
    expect(item.professor).toBe("Dra. Paula Henao");
    expect(item.professorType).toBe("planta");

    const external = mapProposalToRequestItem(
      baseProposal({
        assignments: [
          {
            role: "PROFESSOR",
            professorId: "prof-2",
            rawName: null,
            professor: {
              id: "prof-2",
              fullName: "Carlos Vega",
              type: "EXTERNAL",
              company: "Vega Consultores",
              identityDocument: "CC 94.456.789",
              email: "carlos.vega@consultores.com",
              phone: "+57 315 123 4567",
              profile: "Especialista en transformación digital.",
            },
          },
        ],
      }),
    )!;
    expect(external.professorType).toBe("externo");
    expect(external.externalProfessorData).toMatchObject({
      nombre: "Carlos Vega",
      identificacion: "CC 94.456.789",
      empresaConsultora: "Vega Consultores",
      correo: "carlos.vega@consultores.com",
      telefono: "+57 315 123 4567",
      perfil: "Especialista en transformación digital.",
    });
  });

  it("maps the current economics record into ProposalCosting, including readyForKam", () => {
    const item = mapProposalToRequestItem(baseProposal())!;
    expect(item.costing).toMatchObject({ totalOfferedCop: 30000000, readyForKam: true });
  });

  it("maps CHANGES_REQUESTED to the front's 'rechazada' — there is no separate concept", () => {
    const item = mapProposalToRequestItem(
      baseProposal({
        negotiationRounds: [
          {
            id: "r1",
            roundNumber: 1,
            offeredValue: "30000000",
            marginAmount: null,
            marginPercentage: null,
            leaderNote: null,
            sentToKamAt: "2026-09-21T00:00:00.000Z",
            sentToClientAt: "2026-09-22T00:00:00.000Z",
            clientResponse: "CHANGES_REQUESTED",
            clientNote: "Reducir a 3 sesiones",
          },
        ],
      }),
    )!;
    expect(item.negotiationRounds?.[0].clientResponse).toBe("rechazada");
    expect(item.clientObservations).toBe("Reducir a 3 sesiones");
  });

  it("tolerates a thin list-endpoint payload (no economics/negotiationRounds/creator/productLeader)", () => {
    const thin = baseProposal({
      economics: undefined,
      negotiationRounds: undefined,
      creator: undefined,
      productLeader: undefined,
      contact: undefined,
    });
    const item = mapProposalToRequestItem(thin)!;
    expect(item.costing).toBeUndefined();
    expect(item.negotiationRounds).toEqual([]);
    expect(item.kam).toBe("—");
    expect(item.productLeader).toBe("—");
    expect(item.applicant).toBe("—");
  });
});

describe("requestTypeToBackend / modalityToBackend", () => {
  it("round-trips every request type shown by the front", () => {
    expect(requestTypeToBackend("Capacitación")).toBe("CAPACITACION");
    expect(requestTypeToBackend("Investigación")).toBe("INVESTIGACION");
    expect(requestTypeToBackend("Proyectos Especiales (Eventos)")).toBe("SPECIAL_PROJECTS");
    expect(requestTypeToBackend("Otro")).toBe("OTHER");
  });

  it("round-trips every modality option the specs form offers", () => {
    expect(modalityToBackend("Virtual sincrónica")).toBe("VIRTUAL");
    expect(modalityToBackend("Presencial en campus Icesi")).toBe("PRESENCIAL_ICESI");
    expect(modalityToBackend("Híbrida")).toBe("HIBRIDA");
  });
});

describe("parseParticipantsRange", () => {
  it("parses a closed range", () => {
    expect(parseParticipantsRange("6 - 10")).toEqual({ min: 6, max: 10 });
  });

  it("parses the open-ended 'Más de N' option with no max", () => {
    expect(parseParticipantsRange("Más de 25")).toEqual({ min: 25 });
  });
});
