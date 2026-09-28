import { describe, expect, it } from "vitest";
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

      const mapped = mapProposalToRequestItem(proposal, "Andrea Martínez");

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

  it("clears the notice after a new PENDING round, in either order", () => {
    const input = [round(1, "CHANGES_REQUESTED", "vieja"), round(2, "PENDING")];
    expect(mapProposalToRequestItem(withRounds(input)).clientObservations).toBeUndefined();
    expect(mapProposalToRequestItem(withRounds([...input].reverse())).clientObservations).toBeUndefined();
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

    it("shows no notice when the latest round is PENDING or the status is not en-costeo", () => {
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

describe("parseParticipantsRange", () => {
  it("parses a closed range", () => {
    expect(parseParticipantsRange("6 - 10")).toEqual({ min: 6, max: 10 });
  });

  it("parses the open-ended 'Más de N' option with no max", () => {
    expect(parseParticipantsRange("Más de 25")).toEqual({ min: 25 });
  });
});
