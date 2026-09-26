import { describe, expect, it } from "vitest";
import {
  mapProposalToRequestItem,
  parseParticipantsRange,
  requestTypeToBackend,
  modalityToBackend,
} from "./proposal-adapter";
import type { ProposalDetail, ProposalWorkflow } from "./api/requests";

function workflowWithStatus(code: string): ProposalWorkflow {
  return {
    id: "wf-1",
    proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
    currentStatusId: "st-1",
    requestDate: null,
    proposalCreationDate: null,
    clientSentDate: null,
    clientApprovalDate: null,
    closingDate: null,
    deadline: "2026-12-15T00:00:00.000Z",
    currentStatusSince: "2026-09-20T00:00:00.000Z",
    currentStatus: { id: "st-1", code, name: code },
  };
}

function baseProposal(overrides: Partial<ProposalDetail> = {}): ProposalDetail {
  return {
    id: "9c858901-8a57-4791-81fe-4c455b099bc9",
    code: "REQ-2026-0001",
    companyId: "c1",
    contactId: "ct1",
    nodeId: "n1",
    title: "Diagnóstico de cultura organizacional",
    generalDescription: null,
    creatorId: "kam-1",
    productLeaderId: "ldp-1",
    priority: "ALTA",
    comments: null,
    createdAt: "2026-09-15T00:00:00.000Z",
    updatedAt: "2026-09-15T00:00:00.000Z",
    company: {
      id: "c1",
      name: "Acme S.A.S.",
      nit: "8909006089",
      description: null,
      website: null,
      area: null,
      type: null,
      sector: null,
    },
    contact: {
      id: "ct1",
      companyId: "c1",
      name: "Valentina Ríos",
      email: null,
      phone: null,
      role: null,
      areaDependency: null,
    },
    node: { id: "n1", name: "IA+ Tech Digital", description: null },
    creator: { id: "kam-1", email: "kam@icesi.edu.co", firstName: "Julian", lastName: "Duque" },
    productLeader: { id: "ldp-1", email: "ldp@icesi.edu.co", firstName: "Laura", lastName: "Diaz" },
    logistics: null,
    program: {
      id: "prog-1",
      proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
      requestType: "CAPACITACION",
      requestTypeOther: null,
      programType: null,
      programModality: "VIRTUAL",
      virtualityModality: null,
      objective: null,
      programDescription: null,
      totalHours: 24,
      hoursAtProfessorDiscretion: null,
      minParticipants: 5,
      maxParticipants: 15,
      participantArea: null,
      participantProfile: null,
      previousTraining: null,
      previousTrainingDetail: null,
      previousTrainingCompany: null,
      previousTrainingDate: null,
      requiresCatering: null,
      cateringNotes: null,
      expectedResults: null,
      successMetrics: null,
      competencies: null,
    },
    workflow: {
      id: "wf-1",
      proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
      currentStatusId: "st-1",
      requestDate: null,
      proposalCreationDate: null,
      clientSentDate: null,
      clientApprovalDate: null,
      closingDate: null,
      deadline: "2026-12-15T00:00:00.000Z",
      currentStatusSince: "2026-09-20T00:00:00.000Z",
      currentStatus: { id: "st-1", code: "IN_COSTING", name: "In costing" },
    },
    economics: [
      {
        id: "e1",
        proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
        isCurrent: true,
        date: "2026-09-20T00:00:00.000Z",
        grossValue: "30000000",
        participantCount: null,
        valuePerParticipant: null,
        estimatedCost: null,
        estimatedMargin: "5000000",
        marginPercentage: "20",
        readyForKam: true,
        readyForKamAt: "2026-09-21T00:00:00.000Z",
      },
    ],
    attachments: [],
    assignments: [
      {
        id: "as-1",
        proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
        userId: null,
        professorId: "prof-1",
        role: "PROFESSOR",
        rawName: null,
        isMapped: true,
        createdAt: "2026-09-15T00:00:00.000Z",
        professor: {
          id: "prof-1",
          fullName: "Dra. Paula Henao",
          type: "STAFF",
          faculty: "Ingeniería",
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
        proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
        roundNumber: 1,
        offeredValue: "30000000",
        marginAmount: "5000000",
        marginPercentage: "20",
        scopeSnapshot: null,
        leaderNote: null,
        sentToKamAt: "2026-09-21T00:00:00.000Z",
        sentToClientAt: null,
        clientResponse: "PENDING",
        clientNote: null,
      },
    ],
    ...overrides,
  };
}

describe("mapProposalToRequestItem", () => {
  it("maps every backend status to its front equivalent, including REJECTED", () => {
    expect(mapProposalToRequestItem(baseProposal()).status).toBe("en-costeo");
    expect(mapProposalToRequestItem(baseProposal({ workflow: workflowWithStatus("NEW") })).status).toBe("nueva");
    expect(mapProposalToRequestItem(baseProposal({ workflow: workflowWithStatus("IN_PROGRESS") })).status).toBe(
      "en-experto",
    );
    expect(mapProposalToRequestItem(baseProposal({ workflow: workflowWithStatus("DELIVERED") })).status).toBe(
      "entregada",
    );
    // #7 added "rechazada"/"cancelada" to RequestStatus — REJECTED no longer has
    // no representation, unlike the pre-#7 adapter this replaces.
    expect(mapProposalToRequestItem(baseProposal({ workflow: workflowWithStatus("REJECTED") })).status).toBe(
      "rechazada",
    );
  });

  it("maps the current professor assignment, distinguishing staff from external", () => {
    const item = mapProposalToRequestItem(baseProposal());
    expect(item.professor).toBe("Dra. Paula Henao");
    expect(item.professorType).toBe("planta");
    expect(item.externalProfessorData).toBeUndefined();

    const external = mapProposalToRequestItem(
      baseProposal({
        assignments: [
          {
            id: "as-2",
            proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
            userId: null,
            professorId: "prof-2",
            role: "PROFESSOR",
            rawName: null,
            isMapped: true,
            createdAt: "2026-09-15T00:00:00.000Z",
            professor: {
              id: "prof-2",
              fullName: "Carlos Vega",
              type: "EXTERNAL",
              faculty: null,
              company: "Vega Consultores",
              identityDocument: "CC 94.456.789",
              email: "carlos.vega@consultores.com",
              phone: "+57 315 123 4567",
              profile: "Especialista en transformación digital.",
            },
          },
        ],
      }),
    );
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
    const item = mapProposalToRequestItem(baseProposal());
    expect(item.costing).toMatchObject({ totalOfferedCop: 30000000, readyForKam: true });
  });

  it("maps modalidad/horas/participantes to the Spanish labels HU 4.5's form round-trips on", () => {
    const item = mapProposalToRequestItem(baseProposal());
    expect(item.modalidad).toBe("Virtual sincrónica");
    expect(item.horas).toBe("24");
    expect(item.participantes).toBe("5 - 15");
  });

  it("leaves participantes undefined for an open-ended range (no maxParticipants)", () => {
    const item = mapProposalToRequestItem(
      baseProposal({ program: { ...baseProposal().program!, minParticipants: 25, maxParticipants: null } }),
    );
    expect(item.participantes).toBeUndefined();
  });

  it("maps CHANGES_REQUESTED to the front's 'rechazada' — there is no separate concept", () => {
    const item = mapProposalToRequestItem(
      baseProposal({
        negotiationRounds: [
          {
            id: "r1",
            proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
            roundNumber: 1,
            offeredValue: "30000000",
            marginAmount: null,
            marginPercentage: null,
            scopeSnapshot: null,
            leaderNote: null,
            sentToKamAt: "2026-09-21T00:00:00.000Z",
            sentToClientAt: "2026-09-22T00:00:00.000Z",
            clientResponse: "CHANGES_REQUESTED",
            clientNote: "Reducir a 3 sesiones",
          },
        ],
      }),
    );
    expect(item.negotiationRounds?.[0].clientResponse).toBe("rechazada");
    expect(item.clientObservations).toBe("Reducir a 3 sesiones");
  });

  it("tolerates a thin list-endpoint payload (no contact/creator/productLeader/assignments)", () => {
    const thin = baseProposal({
      economics: undefined,
      negotiationRounds: undefined,
      creator: undefined as never,
      productLeader: null,
      contact: null,
      assignments: undefined,
    });
    const item = mapProposalToRequestItem(thin);
    // Unlike the pre-#7 adapter (which left costing undefined with no economics),
    // this one always returns a zeroed costing object — a real, deliberate difference.
    expect(item.costing).toMatchObject({ totalOfferedCop: 0, readyForKam: false });
    expect(item.negotiationRounds).toBeUndefined();
    expect(item.kam).toBe("KAM Icesi");
    expect(item.productLeader).toBe("Por definir");
    expect(item.applicant).toBe("Contacto por definir");
  });
});

describe("requestTypeToBackend / modalityToBackend", () => {
  it("round-trips every request type shown by the front", () => {
    expect(requestTypeToBackend("Capacitación")).toBe("CAPACITACION");
    expect(requestTypeToBackend("Investigación")).toBe("INVESTIGACION");
    expect(requestTypeToBackend("Proyectos Especiales (Eventos)")).toBe("SPECIAL_PROJECTS");
    expect(requestTypeToBackend("Otro")).toBe("OTHER");
  });

  it("round-trips every modality option the specs form offers, including PRESENCIAL_OTRO", () => {
    expect(modalityToBackend("Virtual sincrónica")).toBe("VIRTUAL");
    expect(modalityToBackend("Presencial en campus Icesi")).toBe("PRESENCIAL_ICESI");
    expect(modalityToBackend("Presencial en otra sede")).toBe("PRESENCIAL_OTRO");
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
