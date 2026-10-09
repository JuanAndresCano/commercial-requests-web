import { describe, expect, it, vi } from "vitest";
import { assignProfessorWithHistory } from "./professor-assignment";
import {
  mapBackendStatusToFrontend,
  mapBackendTypeToFrontend,
  mapBackendPriorityToFrontend,
  formatRelativeTime,
  mapProposalToRequestItem,
  parseParticipantsRange,
  requestTypeToBackend,
  modalityToBackend,
} from "./proposal-adapter";
import type { ProposalListItem, ProposalDetail, ProposalWorkflow } from "./api/requests";

describe("proposal-adapter", () => {
  describe("mapBackendStatusToFrontend", () => {
    it("maps NEW to nueva", () => {
      expect(mapBackendStatusToFrontend("NEW")).toBe("nueva");
    });
    it("maps IN_PROGRESS to en-experto", () => {
      expect(mapBackendStatusToFrontend("IN_PROGRESS")).toBe("en-experto");
    });
    it("maps IN_COSTING to en-costeo", () => {
      expect(mapBackendStatusToFrontend("IN_COSTING")).toBe("en-costeo");
    });
    it("maps DELIVERED to entregada", () => {
      expect(mapBackendStatusToFrontend("DELIVERED")).toBe("entregada");
    });
    it("maps REJECTED to rechazada", () => {
      expect(mapBackendStatusToFrontend("REJECTED")).toBe("rechazada");
    });
    it("maps CANCELLED to cancelada", () => {
      expect(mapBackendStatusToFrontend("CANCELLED")).toBe("cancelada");
    });
    it("defaults unknown status to nueva", () => {
      expect(mapBackendStatusToFrontend("UNKNOWN")).toBe("nueva");
    });
  });

  describe("mapBackendTypeToFrontend", () => {
    it("maps CAPACITACION to Capacitación", () => {
      expect(mapBackendTypeToFrontend("CAPACITACION")).toBe("Capacitación");
    });
    it("maps OTHER to Otro", () => {
      expect(mapBackendTypeToFrontend("OTHER")).toBe("Otro");
    });
    it("defaults to Capacitación if null or undefined", () => {
      expect(mapBackendTypeToFrontend(null)).toBe("Capacitación");
    });
  });

  describe("mapBackendPriorityToFrontend", () => {
    it("maps ALTA to alta", () => {
      expect(mapBackendPriorityToFrontend("ALTA")).toBe("alta");
    });
    it("maps MEDIA to media", () => {
      expect(mapBackendPriorityToFrontend("MEDIA")).toBe("media");
    });
    it("defaults null to media", () => {
      expect(mapBackendPriorityToFrontend(null)).toBe("media");
    });
  });

  describe("formatRelativeTime", () => {
    it("returns Reciente for empty input", () => {
      expect(formatRelativeTime(null)).toBe("Reciente");
      expect(formatRelativeTime("invalid-date")).toBe("Reciente");
    });

    it("formats minutes and hours", () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe("Hace un momento");

      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      expect(formatRelativeTime(thirtyMinsAgo)).toBe("Hace 30 min");

      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000);
      expect(formatRelativeTime(threeHoursAgo)).toBe("Hace 3 horas");
    });
  });

  describe("mapProposalToRequestItem", () => {
    it("correctly maps a full proposal item", () => {
      const proposal: ProposalListItem = {
        id: "uuid-123",
        code: "REQ-2026-0001",
        companyId: "c-1",
        contactId: "ct-1",
        nodeId: "n-1",
        title: "Diplomado IA",
        generalDescription: "Desc",
        creatorId: "u-1",
        productLeaderId: "lp-1",
        priority: "ALTA",
        comments: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        company: {
          id: "c-1",
          name: "Bancolombia",
          nit: "890900608-9",
          description: null,
          website: null,
          area: null,
          type: "PRIVADA",
          sector: "Banca",
        },
        workflow: {
          id: "w-1",
          proposalId: "uuid-123",
          currentStatusId: "s-1",
          currentStatusSince: null,
          deadline: "2026-10-01T00:00:00.000Z",
          requestDate: null,
          proposalCreationDate: null,
          clientSentDate: null,
          clientApprovalDate: null,
          closingDate: null,
          currentStatus: {
            id: "s-1",
            code: "IN_COSTING",
            name: "En costeo",
          },
        },
        program: {
          id: "pr-1",
          proposalId: "uuid-123",
          requestType: "CAPACITACION",
          requestTypeOther: null,
          programType: "CURSO",
          programModality: "VIRTUAL",
          virtualityModality: null,
          objective: null,
          programDescription: null,
          totalHours: 40,
          hoursAtProfessorDiscretion: false,
          minParticipants: 15,
          maxParticipants: 20,
          participantArea: "TI",
          participantProfile: null,
          previousTraining: "No",
          previousTrainingDetail: null,
          previousTrainingCompany: null,
          previousTrainingDate: null,
          requiresCatering: false,
          cateringNotes: null,
          expectedResults: null,
          successMetrics: null,
          competencies: null,
        },
        economics: [
          {
            grossValue: 10000000,
            readyForKam: true,
            readyForKamAt: new Date().toISOString(),
          },
        ],
        productLeader: {
          id: "lp-1",
          email: "leader@icesi.edu.co",
          firstName: "Juan",
          lastName: "Corrales",
        },
        assignments: [
          {
            id: "a-1",
            proposalId: "uuid-123",
            userId: null,
            professorId: "prof-1",
            role: "PROFESSOR",
            rawName: "Dr. Ricardo",
            isMapped: true,
            createdAt: new Date().toISOString(),
            professor: {
              id: "prof-1",
              fullName: "Dr. Ricardo Mejía",
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
      };

      const mapped = mapProposalToRequestItem(proposal);

      expect(mapped.id).toBe("uuid-123");
      expect(mapped.code).toBe("REQ-2026-0001");
      expect(mapped.company).toBe("Bancolombia");
      expect(mapped.status).toBe("en-costeo");
      expect(mapped.urgency).toBe("alta");
      expect(mapped.productLeader).toBe("Juan Corrales");
      expect(mapped.professor).toBe("Dr. Ricardo Mejía");
      expect(mapped.totalCostCop).toBe(10000000);
      expect(mapped.costing?.readyForKam).toBe(true);
      expect(mapped.costing?.proCulturaTaxPercent).toBe(1.5);
      expect(mapped.costing?.proCulturaTaxAmount).toBe(150000);
      expect(mapped.participantes).toBe("15 - 20");
    });
  });
});

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

describe("mapProposalToRequestItem (HU 4.1-4.5, Líder de Producto)", () => {
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
    // Both kinds carry the typed data now (a planta professor has at least its name and, if known, faculty).
    expect(item.externalProfessorData).toMatchObject({ nombre: "Dra. Paula Henao" });

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

  it("maps a planta professor's faculty and contact fields, and leaves the identity empty for the KAM", () => {
    const item = mapProposalToRequestItem(
      baseProposal({
        assignments: [
          {
            id: "as-3",
            proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
            userId: null,
            professorId: "prof-3",
            role: "PROFESSOR",
            rawName: null,
            isMapped: true,
            createdAt: "2026-09-15T00:00:00.000Z",
            // The KAM's payload: contact fields yes, `identityDocument` is not even present.
            professor: {
              id: "prof-3",
              fullName: "Nohra Villegas",
              type: "STAFF",
              faculty: "Ingeniería",
              company: null,
              email: "nohra@icesi.edu.co",
              phone: "+57 300 000 0000",
              profile: "Optimización.",
            },
          },
        ],
      }),
    );
    expect(item.professorType).toBe("planta");
    expect(item.externalProfessorData).toEqual({
      nombre: "Nohra Villegas",
      identificacion: undefined,
      facultad: "Ingeniería",
      empresaConsultora: undefined,
      correo: "nohra@icesi.edu.co",
      telefono: "+57 300 000 0000",
      perfil: "Optimización.",
    });
  });

  it("maps the current economics record into ProposalCosting, including readyForKam", () => {
    const item = mapProposalToRequestItem(baseProposal());
    expect(item.costing).toMatchObject({ totalOfferedCop: 30000000, readyForKam: true });
  });

  describe("contribution margin of the current economics row (HU 5.1)", () => {
    const economicsRow = (overrides: Record<string, unknown>) => {
      const base = baseProposal();
      return baseProposal({ economics: [{ ...base.economics[0], ...overrides }] as ProposalDetail["economics"] });
    };

    it("converts the Decimal strings of the JSON into numbers", () => {
      const item = mapProposalToRequestItem(baseProposal());
      expect(item.costing?.expectedMarginPercent).toBe(20);
      expect(item.costing?.marginAmountCop).toBe(5_000_000);
    });

    it("keeps decimals of a Decimal string", () => {
      const item = mapProposalToRequestItem(economicsRow({ marginPercentage: "12.5000", estimatedMargin: "999.99" }));
      expect(item.costing?.expectedMarginPercent).toBe(12.5);
      expect(item.costing?.marginAmountCop).toBe(999.99);
    });

    it("accepts a margin that already arrives as a number", () => {
      const item = mapProposalToRequestItem(economicsRow({ marginPercentage: 30, estimatedMargin: 9_000_000 }));
      expect(item.costing?.expectedMarginPercent).toBe(30);
      expect(item.costing?.marginAmountCop).toBe(9_000_000);
    });

    it("keeps null as undefined, never 0: the margin was cleared or never set", () => {
      const item = mapProposalToRequestItem(economicsRow({ marginPercentage: null, estimatedMargin: null }));
      expect(item.costing?.expectedMarginPercent).toBeUndefined();
      expect(item.costing?.marginAmountCop).toBeUndefined();
    });

    it("keeps a stored 0 as 0, distinct from null", () => {
      const item = mapProposalToRequestItem(economicsRow({ marginPercentage: "0", estimatedMargin: "0.00" }));
      expect(item.costing?.expectedMarginPercent).toBe(0);
      expect(item.costing?.marginAmountCop).toBe(0);
    });

    it("tolerates the KAM payload, where the backend removes both margin fields", () => {
      const { marginPercentage: _p, estimatedMargin: _m, estimatedCost: _c, ...kamRow } = baseProposal().economics[0];
      const item = mapProposalToRequestItem(baseProposal({ economics: [kamRow] }));
      expect(item.costing?.expectedMarginPercent).toBeUndefined();
      expect(item.costing?.marginAmountCop).toBeUndefined();
      expect(item.costing?.totalOfferedCop).toBe(30000000);
    });

    it("reads the margin from the current row, not from a previous one", () => {
      const base = baseProposal();
      const stale = { ...base.economics[0], id: "e0", isCurrent: false, marginPercentage: "50", estimatedMargin: "1" };
      const current = { ...base.economics[0], id: "e1", isCurrent: true, marginPercentage: "10", estimatedMargin: "2" };
      const item = mapProposalToRequestItem(baseProposal({ economics: [stale, current] }));
      expect(item.costing?.expectedMarginPercent).toBe(10);
      expect(item.costing?.marginAmountCop).toBe(2);
    });
  });

  it("gives the Pro-Cultura stamp only to the exact CAPACITACION code, not to a missing type", () => {
    const base = baseProposal();
    expect(mapProposalToRequestItem(base).costing).toMatchObject({
      proCulturaTaxPercent: 1.5,
      proCulturaTaxAmount: 450000,
    });

    const consulting = baseProposal({ program: { ...base.program!, requestType: "CONSULTORIA" } });
    expect(mapProposalToRequestItem(consulting).costing).toMatchObject({
      proCulturaTaxPercent: 0,
      proCulturaTaxAmount: 0,
    });

    const noProgram = mapProposalToRequestItem(baseProposal({ program: undefined as never }));
    expect(noProgram.type).toBe("Capacitación");
    expect(noProgram.costing).toMatchObject({ proCulturaTaxPercent: 0, proCulturaTaxAmount: 0 });
  });

  it("maps modalidad/horas/participantes to the Spanish labels HU 4.5's form round-trips on", () => {
    const item = mapProposalToRequestItem(baseProposal());
    expect(item.modalidad).toBe("Virtual sincrónica");
    expect(item.horas).toBe("24");
    expect(item.participantes).toBe("5 - 15");
  });

  it("shows an open-ended range (no maxParticipants) as 'Más de N'", () => {
    const item = mapProposalToRequestItem(
      baseProposal({ program: { ...baseProposal().program!, minParticipants: 25, maxParticipants: null } }),
    );
    expect(item.participantes).toBe("Más de 25");
  });

  it("leaves participantes undefined when there is no minimum", () => {
    const item = mapProposalToRequestItem(
      baseProposal({ program: { ...baseProposal().program!, minParticipants: null, maxParticipants: 10 } }),
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

describe("mapProposalToRequestItem - returned-with-observations notice (HU 5.4)", () => {
  type Response = "PENDING" | "CHANGES_REQUESTED";
  const round = (roundNumber: number, clientResponse: Response, clientNote: string | null = null) => ({
    id: `r${roundNumber}`,
    proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
    roundNumber,
    offeredValue: "30000000",
    marginAmount: null,
    marginPercentage: null,
    scopeSnapshot: null,
    leaderNote: null,
    sentToKamAt: "2026-09-21T00:00:00.000Z",
    sentToClientAt: null,
    clientResponse,
    clientNote,
  });
  const withRounds = (rounds: ReturnType<typeof round>[], code = "IN_COSTING") =>
    baseProposal({ workflow: workflowWithStatus(code), negotiationRounds: rounds });

  it("sorts the rounds ascending whatever order the API sends them in", () => {
    const rounds = [round(1, "CHANGES_REQUESTED", "uno"), round(2, "PENDING"), round(3, "PENDING")];
    for (const input of [rounds, [...rounds].reverse(), [rounds[1], rounds[2], rounds[0]]]) {
      const item = mapProposalToRequestItem(withRounds(input));
      expect(item.negotiationRounds?.map((r) => r.roundNumber)).toEqual([1, 2, 3]);
    }
  });

  it("does not mutate the array it received", () => {
    const input = [round(2, "PENDING"), round(1, "PENDING")];
    mapProposalToRequestItem(withRounds(input));
    expect(input.map((r) => r.roundNumber)).toEqual([2, 1]);
  });

  it("shows the notice when the latest round came back with changes, with 2 or 3 rounds in either order", () => {
    const two = [round(1, "PENDING"), round(2, "CHANGES_REQUESTED", "Bajar el precio")];
    const three = [round(1, "CHANGES_REQUESTED", "vieja"), round(2, "PENDING"), round(3, "CHANGES_REQUESTED", "Nueva")];
    for (const input of [two, [...two].reverse()]) {
      expect(mapProposalToRequestItem(withRounds(input)).clientObservations).toBe("Bajar el precio");
    }
    for (const input of [three, [...three].reverse()]) {
      expect(mapProposalToRequestItem(withRounds(input)).clientObservations).toBe("Nueva");
    }
  });

  // Prototype behaviour: the client's note stays until the KAM redelivers (status back to entregada);
  // "Enviar a KAM" opens a new PENDING round but does not clear it.
  it("keeps the notice after a new PENDING round (Enviar a KAM), in either order", () => {
    const input = [round(1, "CHANGES_REQUESTED", "vieja"), round(2, "PENDING")];
    expect(mapProposalToRequestItem(withRounds(input)).clientObservations).toBe("vieja");
    expect(mapProposalToRequestItem(withRounds([...input].reverse())).clientObservations).toBe("vieja");
  });

  it("shows the note of the highest-numbered CHANGES_REQUESTED round, not of an older one", () => {
    const input = [
      round(1, "CHANGES_REQUESTED", "vieja"),
      round(2, "PENDING"),
      round(3, "CHANGES_REQUESTED", "nueva"),
      round(4, "PENDING"),
    ];
    for (const rounds of [input, [...input].reverse()]) {
      expect(mapProposalToRequestItem(withRounds(rounds)).clientObservations).toBe("nueva");
    }
  });

  it("shows no notice while the proposal has never been returned", () => {
    expect(mapProposalToRequestItem(withRounds([round(1, "PENDING")])).clientObservations).toBeUndefined();
  });

  it("clears the notice after the redelivery (status DELIVERED) even if a round still says CHANGES_REQUESTED", () => {
    const input = [round(1, "CHANGES_REQUESTED", "vieja")];
    expect(mapProposalToRequestItem(withRounds(input, "DELIVERED")).clientObservations).toBeUndefined();
  });

  it("clears the notice on REJECTED", () => {
    const input = [round(1, "PENDING"), round(2, "CHANGES_REQUESTED", "no")];
    expect(mapProposalToRequestItem(withRounds(input, "REJECTED")).clientObservations).toBeUndefined();
  });

  describe("list items (latest round only)", () => {
    const listItem = (rounds: unknown, code = "IN_COSTING") => {
      const { negotiationRounds: _omit, ...rest } = baseProposal({ workflow: workflowWithStatus(code) });
      return { ...rest, negotiationRounds: rounds } as unknown as ProposalListItem;
    };
    const thin = (roundNumber: number, clientResponse: Response, clientNote: string | null) => ({
      roundNumber,
      clientResponse,
      clientNote,
    });

    it("maps the notice from the single round the list returns", () => {
      const item = mapProposalToRequestItem(listItem([thin(2, "CHANGES_REQUESTED", "Ajustar alcance")]));
      expect(item.clientObservations).toBe("Ajustar alcance");
    });

    it("keeps the notice of the returned round the list sends next to a newer PENDING one", () => {
      const item = mapProposalToRequestItem(
        listItem([thin(3, "PENDING", null), thin(2, "CHANGES_REQUESTED", "Ajustar alcance")]),
      );
      expect(item.clientObservations).toBe("Ajustar alcance");
    });

    it("shows no notice when the only round is PENDING or the status is not en-costeo", () => {
      expect(mapProposalToRequestItem(listItem([thin(3, "PENDING", null)])).clientObservations).toBeUndefined();
      expect(
        mapProposalToRequestItem(listItem([thin(2, "CHANGES_REQUESTED", "x")], "DELIVERED")).clientObservations,
      ).toBeUndefined();
    });

    it("does not build detail rounds out of the three-field list rounds", () => {
      const item = mapProposalToRequestItem(listItem([thin(2, "CHANGES_REQUESTED", "x")]));
      expect(item.negotiationRounds).toBeUndefined();
    });

    it("does not throw and shows no notice for a list item without negotiationRounds (backend without PR A)", () => {
      for (const rounds of [undefined, []]) {
        const item = mapProposalToRequestItem(listItem(rounds));
        expect(item.clientObservations).toBeUndefined();
      }
    });
  });
});

describe("mapProposalToRequestItem - negotiation history of the detail (prototype's 'Historial de Negociación')", () => {
  const detailRound = (overrides: Record<string, unknown> = {}) => ({
    id: "r1",
    proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
    roundNumber: 1,
    offeredValue: "30000000",
    marginAmount: "9000000",
    marginPercentage: "30",
    scopeSnapshot: null,
    leaderNote: null,
    sentToKamAt: "2026-09-21T00:00:00.000Z",
    sentToClientAt: null,
    clientResponse: "PENDING" as const,
    clientNote: null,
    ...overrides,
  });
  const withRounds = (rounds: unknown[]) =>
    baseProposal({ negotiationRounds: rounds as ProposalDetail["negotiationRounds"] });

  it("maps when the round was delivered to the client and when it came back", () => {
    const item = mapProposalToRequestItem(
      withRounds([
        detailRound({
          sentToClientAt: "2026-09-22T00:00:00.000Z",
          clientResponse: "CHANGES_REQUESTED",
          clientNote: "Reducir",
          clientRespondedAt: "2026-09-25T00:00:00.000Z",
        }),
      ]),
    );
    expect(item.negotiationRounds?.[0]).toMatchObject({
      sentToClientAt: "2026-09-22T00:00:00.000Z",
      clientRespondedAt: "2026-09-25T00:00:00.000Z",
      clientResponse: "rechazada",
    });
  });

  it("leaves the dates undefined for a round that was not delivered or returned (or a backend without clientRespondedAt)", () => {
    const item = mapProposalToRequestItem(withRounds([detailRound()]));
    expect(item.negotiationRounds?.[0].sentToClientAt).toBeUndefined();
    expect(item.negotiationRounds?.[0].clientRespondedAt).toBeUndefined();
  });

  it("maps the scope snapshot into the labels the live request uses, so the round diff compares like with like", () => {
    const item = mapProposalToRequestItem(
      withRounds([
        detailRound({
          scopeSnapshot: {
            requestType: "CONSULTORIA",
            requestTypeOther: null,
            programType: "CURSO",
            programModality: "PRESENCIAL_CLIENTE",
            totalHours: 40,
            minParticipants: 15,
            maxParticipants: 20,
            generalDescription: "Necesidad original",
          },
        }),
      ]),
    );
    expect(item.negotiationRounds?.[0]).toMatchObject({
      participantes: "15 - 20",
      modalidad: "Presencial en sede cliente",
      horas: "40",
      type: "Consultoría",
      necesidad: "Necesidad original",
    });
  });

  it("leaves a scope field undefined when the snapshot lacks it, and the whole scope when there is no snapshot", () => {
    const partial = mapProposalToRequestItem(
      withRounds([detailRound({ scopeSnapshot: { totalHours: null, minParticipants: null, maxParticipants: null } })]),
    );
    expect(partial.negotiationRounds?.[0]).toMatchObject({
      participantes: undefined,
      modalidad: undefined,
      horas: undefined,
      type: undefined,
      necesidad: undefined,
    });
    for (const scopeSnapshot of [null, "texto", [1, 2]]) {
      const item = mapProposalToRequestItem(withRounds([detailRound({ scopeSnapshot })]));
      expect(item.negotiationRounds?.[0].horas).toBeUndefined();
      expect(item.negotiationRounds?.[0].type).toBeUndefined();
    }
  });

  it("shows an open-ended participant range of a round snapshot as 'Más de N'", () => {
    const item = mapProposalToRequestItem(
      withRounds([detailRound({ scopeSnapshot: { minParticipants: 25, maxParticipants: null } })]),
    );
    expect(item.negotiationRounds?.[0].participantes).toBe("Más de 25");
  });

  it("maps every other adjustable field of the snapshot with the same rules as the live request", () => {
    const item = mapProposalToRequestItem(
      withRounds([
        detailRound({
          scopeSnapshot: {
            generalDescription: "Descripción general",
            programDescription: "Necesidad ajustada",
            competencies: "Liderazgo",
            successMetrics: "NPS > 80",
            expectedResults: "Plan de acción",
            participantArea: "Operaciones",
            requiresCatering: true,
            cateringNotes: "Refrigerio",
            previousTraining: "Si",
            deadline: "2026-11-30T05:00:00.000Z",
          },
        }),
      ]),
    );
    expect(item.negotiationRounds?.[0]).toMatchObject({
      hasScopeSnapshot: true,
      necesidad: "Necesidad ajustada",
      competencias: "Liderazgo",
      exito: "NPS > 80",
      resultados: "Plan de acción",
      areaParticipantes: "Operaciones",
      alimentacion: "Sí - Refrigerio",
      formacionPrevia: "Sí",
      deadline: "2026-11-30T05:00:00.000Z",
    });
  });

  it("marks a round without a snapshot, and leaves unknown catering/training undefined instead of 'No'", () => {
    const none = mapProposalToRequestItem(withRounds([detailRound({ scopeSnapshot: null })]));
    expect(none.negotiationRounds?.[0].hasScopeSnapshot).toBe(false);
    const old = mapProposalToRequestItem(withRounds([detailRound({ scopeSnapshot: { totalHours: 40 } })]));
    expect(old.negotiationRounds?.[0]).toMatchObject({
      hasScopeSnapshot: true,
      alimentacion: undefined,
      formacionPrevia: undefined,
    });
  });

  it("ignores a snapshot code it does not know instead of showing the raw backend code", () => {
    const item = mapProposalToRequestItem(
      withRounds([detailRound({ scopeSnapshot: { requestType: "NEW_TYPE", programModality: "TELEPATHY" } })]),
    );
    expect(item.negotiationRounds?.[0].type).toBeUndefined();
    expect(item.negotiationRounds?.[0].modalidad).toBeUndefined();
  });
});

describe("mapProposalToRequestItem - scope note of the costing (negotiationNotes)", () => {
  const withNotes = (negotiationNotes: string | null | undefined) => {
    const base = baseProposal();
    return baseProposal({ economics: [{ ...base.economics[0], negotiationNotes }] as ProposalDetail["economics"] });
  };

  it("maps the note of the current economics row into costing.negotiationNotes", () => {
    expect(mapProposalToRequestItem(withNotes("Alcance acordado")).costing?.negotiationNotes).toBe("Alcance acordado");
  });

  it("has no note when the row has none (null) or the backend does not send it", () => {
    expect(mapProposalToRequestItem(withNotes(null)).costing?.negotiationNotes).toBeUndefined();
    expect(mapProposalToRequestItem(withNotes(undefined)).costing?.negotiationNotes).toBeUndefined();
  });
});

describe("mapProposalToRequestItem - value hidden from the KAM until the Leader confirms", () => {
  it("maps a hidden (null) value to 0, with no Pro-Cultura amount and the gate closed", () => {
    const base = baseProposal();
    const item = mapProposalToRequestItem(
      baseProposal({
        economics: [{ ...base.economics[0], grossValue: null, readyForKam: false }] as ProposalDetail["economics"],
      }),
    );

    expect(item.totalCostCop).toBe(0);
    expect(item.costing?.totalOfferedCop).toBe(0);
    expect(item.costing?.proCulturaTaxAmount).toBe(0);
    expect(item.costing?.readyForKam).toBe(false);
  });
});

describe("mapProposalToRequestItem - professor assignment history (HU 4.2)", () => {
  type Log = NonNullable<ProposalDetail["professorAssignmentLogs"]>[number];
  const NAME = { A: "Dra. Paula Henao", B: "Ing. Carlos Vega" };
  const log = (n: number, overrides: Partial<Log> = {}): Log => ({
    id: `log-${n}`,
    previousProfessorId: null,
    previousProfessorName: null,
    previousProfessorType: null,
    newProfessorId: "prof-a",
    newProfessorName: NAME.A,
    newProfessorType: "STAFF",
    changedAt: `2026-09-2${n}T15:00:00.000Z`,
    statusAtChange: { code: "NEW" },
    changedBy: { id: "ldp-1", firstName: "Laura", lastName: "Diaz" },
    ...overrides,
  });
  const aToB = (n: number, statusCode = "IN_PROGRESS"): Log =>
    log(n, {
      previousProfessorId: "prof-a",
      previousProfessorName: NAME.A,
      previousProfessorType: "STAFF",
      newProfessorId: "prof-b",
      newProfessorName: NAME.B,
      statusAtChange: { code: statusCode },
    });
  const bToA = (n: number): Log =>
    log(n, {
      previousProfessorId: "prof-b",
      previousProfessorName: NAME.B,
      previousProfessorType: "STAFF",
      statusAtChange: { code: "IN_PROGRESS" },
    });
  const withLogs = (logs: Log[] | undefined) => baseProposal({ professorAssignmentLogs: logs });

  it("maps the first assignment: no previous professor, type and status in the prototype's vocabulary", () => {
    const [entry] = mapProposalToRequestItem(withLogs([log(1)])).professorHistory ?? [];
    expect(entry).toEqual({
      id: "log-1",
      previousProfessor: undefined,
      previousProfessorType: undefined,
      newProfessor: NAME.A,
      newProfessorType: "planta",
      changedBy: "Laura Diaz",
      changedAt: "2026-09-21T15:00:00.000Z",
      statusAtChange: "nueva",
    });
  });

  it("maps a reassignment with the previous professor and en-experto", () => {
    const [entry] = mapProposalToRequestItem(withLogs([aToB(2)])).professorHistory ?? [];
    expect(entry).toMatchObject({
      previousProfessor: NAME.A,
      previousProfessorType: "planta",
      newProfessor: NAME.B,
      newProfessorType: "planta",
      statusAtChange: "en-experto",
    });
  });

  it("keeps A, A->B, B->A as three entries, oldest first (the block reverses them itself)", () => {
    const item = mapProposalToRequestItem(withLogs([log(1), aToB(2), bToA(3)]));
    expect(item.professorHistory?.map((e) => [e.previousProfessor, e.newProfessor])).toEqual([
      [undefined, NAME.A],
      [NAME.A, NAME.B],
      [NAME.B, NAME.A],
    ]);
    expect(item.professorHistory?.map((e) => e.id)).toEqual(["log-1", "log-2", "log-3"]);
  });

  it("orders oldest first whatever order the API sends them in, without mutating its input", () => {
    const input = [bToA(3), log(1), aToB(2)];
    const item = mapProposalToRequestItem(withLogs(input));
    expect(item.professorHistory?.map((e) => e.id)).toEqual(["log-1", "log-2", "log-3"]);
    expect(input.map((l) => l.id)).toEqual(["log-3", "log-1", "log-2"]);
  });

  it("maps a change made while the request was still NEW to nueva", () => {
    const [entry] = mapProposalToRequestItem(withLogs([aToB(2, "NEW")])).professorHistory ?? [];
    expect(entry.statusAtChange).toBe("nueva");
  });

  it("maps EXTERNAL advisors to externo, on both sides of a change", () => {
    const external = log(4, {
      previousProfessorId: "prof-b",
      previousProfessorName: "Asesora Externa",
      previousProfessorType: "EXTERNAL",
      newProfessorId: "prof-c",
      newProfessorName: "Otra Asesora",
      newProfessorType: "EXTERNAL",
      statusAtChange: { code: "IN_PROGRESS" },
    });
    const [ext] = mapProposalToRequestItem(withLogs([external])).professorHistory ?? [];
    expect(ext).toMatchObject({ previousProfessorType: "externo", newProfessorType: "externo" });
  });

  it("keeps a legacy previous assignment that only had a name (no id, no type)", () => {
    const legacy = log(2, { previousProfessorName: "Nombre heredado", newProfessorId: null });
    const [entry] = mapProposalToRequestItem(withLogs([legacy])).professorHistory ?? [];
    expect(entry.previousProfessor).toBe("Nombre heredado");
    expect(entry.previousProfessorType).toBeUndefined();
    expect(entry.newProfessor).toBe(NAME.A);
  });

  it("keeps the entry and warns on an unknown status code", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const item = mapProposalToRequestItem(withLogs([log(1, { statusAtChange: { code: "SOMETHING_NEW" } })]));
    expect(item.professorHistory).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("SOMETHING_NEW"));
    warn.mockRestore();
  });

  it("has no history for a proposal without logs, an empty list, or a backend without the field", () => {
    expect(mapProposalToRequestItem(withLogs([])).professorHistory).toBeUndefined();
    expect(mapProposalToRequestItem(withLogs(undefined)).professorHistory).toBeUndefined();
    const { professorAssignmentLogs: _omit, ...withoutField } = baseProposal();
    expect(() => mapProposalToRequestItem(withoutField as ProposalDetail)).not.toThrow();
  });

  it("does not add a history to list items (the list does not send the logs)", () => {
    const { professorAssignmentLogs: _omit, ...rest } = baseProposal();
    expect(mapProposalToRequestItem(rest as ProposalListItem).professorHistory).toBeUndefined();
  });

  it("maps the same way for a KAM payload (margins stripped)", () => {
    const kam = baseProposal({
      professorAssignmentLogs: [log(1), aToB(2)],
      economics: [
        {
          id: "e1",
          proposalId: "9c858901-8a57-4791-81fe-4c455b099bc9",
          isCurrent: true,
          date: null,
          grossValue: "30000000",
          participantCount: null,
          valuePerParticipant: null,
          readyForKam: true,
          readyForKamAt: null,
        },
      ],
    });
    const item = mapProposalToRequestItem(kam);
    expect(item.professorHistory).toHaveLength(2);
    expect(item.costing?.marginAmountCop).toBeUndefined();
  });

  it("shows a fallback name when the author has no name, and never 'undefined'", () => {
    const names = [
      { id: "u1", firstName: null, lastName: null },
      { id: "u2", firstName: "Laura", lastName: null },
    ];
    const [none, first] = names.map(
      (changedBy) => mapProposalToRequestItem(withLogs([log(1, { changedBy })])).professorHistory?.[0].changedBy,
    );
    expect(none).toBe("Usuario sin nombre");
    expect(first).toBe("Laura");
  });

  it("has the same shape as an entry the mock path builds with assignProfessorWithHistory", () => {
    const mock = assignProfessorWithHistory(
      { id: "req", status: "en-experto", professor: NAME.A, professorType: "planta", professorHistory: [] },
      NAME.B,
      "planta",
      undefined,
      "Laura Diaz",
      "2026-09-22T15:00:00.000Z",
    ).professorHistory[0];
    const [api] = mapProposalToRequestItem(withLogs([aToB(2)])).professorHistory ?? [];
    expect(Object.keys(api).sort()).toEqual(Object.keys(mock).sort());
    expect({ ...api, id: mock.id }).toEqual(mock);
  });

  it("does not touch the professor currently assigned", () => {
    const item = mapProposalToRequestItem(withLogs([log(1), aToB(2)]));
    expect(item.professor).toBe("Dra. Paula Henao");
  });
});

describe("mapProposalToRequestItem - company and contact details the wizard collects", () => {
  it("maps the company address, phone, e-mail and CIIU codes, with the CIIU description from the sector", () => {
    const item = mapProposalToRequestItem(
      baseProposal({
        company: {
          ...baseProposal().company,
          address: "Calle 1 # 2-3",
          phone: "6025551234",
          email: "info@acme.co",
          ciiuCode: "6412",
          ciiuSecondary: ["6419", "6492"],
          sector: "Bancos",
        },
      }),
    );
    expect(item).toMatchObject({
      companyDireccion: "Calle 1 # 2-3",
      companyTelefono: "6025551234",
      companyCorreo: "info@acme.co",
      companyCiiuPrincipal: "6412",
      companyCiiuPrincipalDesc: "Bancos",
      companyCiiusSecundarios: ["6419", "6492"],
    });
  });

  it("maps the contact's secondary phone and alternative e-mail", () => {
    const item = mapProposalToRequestItem(
      baseProposal({
        contact: { ...baseProposal().contact!, secondaryPhone: "3105550000", alternativeEmail: "alt@acme.co" },
      }),
    );
    expect(item).toMatchObject({ contactTelefonoSecundario: "3105550000", contactCorreoAlternativo: "alt@acme.co" });
  });

  it("maps the additional contacts in order", () => {
    const item = mapProposalToRequestItem(
      baseProposal({
        additionalContacts: [
          { id: "a1", name: "Ana", role: "Gerente", area: "RRHH", phone: "300", email: "ana@acme.co", position: 0 },
          { id: "a2", name: "Luis", role: null, area: null, phone: null, email: null, position: 1 },
        ],
      }),
    );
    expect(item.additionalContacts).toEqual([
      { id: "a1", nombre: "Ana", cargo: "Gerente", area: "RRHH", telefono: "300", correo: "ana@acme.co" },
      { id: "a2", nombre: "Luis", cargo: "", area: "", telefono: "", correo: "" },
    ]);
  });

  it("leaves them undefined for a backend that does not send them", () => {
    const item = mapProposalToRequestItem(baseProposal());
    expect(item.companyDireccion).toBeUndefined();
    expect(item.companyCiiusSecundarios).toBeUndefined();
    expect(item.additionalContacts).toBeUndefined();
  });
});

describe("parseParticipantsRange", () => {
  it("parses a closed range", () => {
    expect(parseParticipantsRange("6 - 10")).toEqual({ min: 6, max: 10 });
  });

  it("parses the open-ended 'Más de N' option with a null max, so an edit clears the old upper bound", () => {
    expect(parseParticipantsRange("Más de 25")).toEqual({ min: 25, max: null });
  });
});

describe("mapProposalToRequestItem - node and leader change history", () => {
  it("maps the team change log oldest first, with who changed it and the reassignment reason in Spanish", () => {
    const item = mapProposalToRequestItem(
      baseProposal({
        teamChangeLogs: [
          {
            id: "t2",
            field: "NODE",
            previousName: "IA+ Tech Digital",
            newName: "Salud Global",
            reason: "NOT_MATCHING_NODE",
            changedAt: "2026-10-07T12:00:00.000Z",
            changedBy: { id: "ldp", firstName: "Laura", lastName: "Diaz" },
          },
          {
            id: "t1",
            field: "PRODUCT_LEADER",
            previousName: "Laura Diaz",
            newName: "Diana Romero",
            reason: null,
            changedAt: "2026-10-06T12:00:00.000Z",
            changedBy: { id: "kam", firstName: "Diana", lastName: "Martínez" },
          },
        ],
      } as Partial<ProposalDetail>),
    );
    expect(item.teamHistory).toEqual([
      {
        id: "t1",
        field: "lider",
        previous: "Laura Diaz",
        next: "Diana Romero",
        changedBy: "Diana Martínez",
        changedAt: "2026-10-06T12:00:00.000Z",
        reason: undefined,
      },
      {
        id: "t2",
        field: "nodo",
        previous: "IA+ Tech Digital",
        next: "Salud Global",
        changedBy: "Laura Diaz",
        changedAt: "2026-10-07T12:00:00.000Z",
        reason: "Temática no afín / Corresponde a otro nodo",
      },
    ]);
  });

  it("has no history when the backend sends none", () => {
    expect(mapProposalToRequestItem(baseProposal()).teamHistory).toBeUndefined();
  });
});
