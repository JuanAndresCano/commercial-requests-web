import { describe, expect, it } from "vitest";
import {
  mapBackendStatusToFrontend,
  mapBackendTypeToFrontend,
  mapBackendPriorityToFrontend,
  formatRelativeTime,
  mapProposalToRequestItem,
} from "./proposal-adapter";
import type { ProposalListItem } from "./api/requests";

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
