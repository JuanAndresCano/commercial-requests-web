import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AdminAuditTable } from "./AdminAuditTable";
import type { ProposalListItem } from "@/lib/api/requests";

const mockProposals: ProposalListItem[] = [
  {
    id: "prop-1",
    code: "REQ-2026-0001",
    officialNumber: "CP 2026-0169",
    companyId: "comp-1",
    contactId: "cont-1",
    nodeId: "node-1",
    title: "Programa de Liderazgo Comercial",
    generalDescription: "Capacitación a directores",
    creatorId: "kam-1",
    productLeaderId: "leader-1",
    priority: "HIGH",
    comments: null,
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-12T10:00:00.000Z",
    company: {
      id: "comp-1",
      name: "Banco W",
      nit: "890300279-4",
    },
    workflow: {
      id: "wf-1",
      proposalId: "prop-1",
      currentStatusId: "st-1",
      deadline: "2026-02-15T00:00:00.000Z",
      clientSentDate: "2026-01-20T00:00:00.000Z",
      createdAt: "2026-01-10T10:00:00.000Z",
      updatedAt: "2026-01-20T10:00:00.000Z",
      statusCode: "DELIVERED",
      statusName: "Entregada",
    },
    program: {
      id: "prog-1",
      proposalId: "prop-1",
      requestType: "PROGRAMA",
      deliveryFormat: "PRESENCIAL",
      estimatedDurationWeeks: 8,
      intensityHours: 40,
      participantRange: "10-25",
      requiresCatering: true,
      hasSoftwareRequirement: false,
    },
    economics: [
      {
        id: "econ-1",
        proposalId: "prop-1",
        grossValue: "185000000",
        costMatrix: null,
        financialApproval: true,
        financialApproverId: "leader-1",
        isCurrent: true,
        createdAt: "2026-01-15T00:00:00.000Z",
        updatedAt: "2026-01-15T00:00:00.000Z",
        readyForKam: true,
        readyForKamAt: "2026-01-15T00:00:00.000Z",
      },
    ],
    deliveredValueCop: "185000000",
    commercialStatus: "APPROVED_WITH_CONTRACT",
    creator: {
      id: "kam-1",
      firstName: "Claudia",
      lastName: "Rendón",
      email: "crendon@icesi.edu.co",
    },
    productLeader: {
      id: "leader-1",
      firstName: "Mateo",
      lastName: "Gómez",
      email: "mgomez@icesi.edu.co",
    },
    node: {
      id: "node-1",
      name: "Centro de Desarrollo del Espíritu Empresarial",
      code: "CDEE",
      color: "blue",
    },
    assignments: [
      {
        id: "asgn-1",
        proposalId: "prop-1",
        professorId: "prof-1",
        role: "PROFESSOR",
        assignedAt: "2026-01-11T00:00:00.000Z",
        professor: {
          id: "prof-1",
          name: "Carlos Mario Duque",
          email: "cduque@icesi.edu.co",
          type: "PLANTA",
        },
      },
    ],
  },
  {
    id: "prop-2",
    code: "REQ-2026-0002",
    officialNumber: null,
    companyId: "comp-2",
    contactId: "cont-2",
    nodeId: "node-2",
    title: "Consultoría en Transformación Digital",
    generalDescription: "Diagnóstico de arquitectura",
    creatorId: "kam-2",
    productLeaderId: "leader-2",
    priority: "MEDIUM",
    comments: null,
    // Created long ago to trigger >20 days bottleneck alert
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-05T10:00:00.000Z",
    company: {
      id: "comp-2",
      name: "Tecnoquímicas S.A.",
      nit: "890300093-1",
    },
    workflow: {
      id: "wf-2",
      proposalId: "prop-2",
      currentStatusId: "st-2",
      deadline: "2026-03-01T00:00:00.000Z",
      clientSentDate: null,
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-05T10:00:00.000Z",
      statusCode: "IN_COSTING",
      statusName: "En costeo",
    },
    program: {
      id: "prog-2",
      proposalId: "prop-2",
      requestType: "CONSULTORIA",
      deliveryFormat: "HIBRIDO",
      estimatedDurationWeeks: 12,
      intensityHours: 60,
      participantRange: "1-10",
      requiresCatering: false,
      hasSoftwareRequirement: true,
    },
    economics: [
      {
        id: "econ-2",
        proposalId: "prop-2",
        grossValue: "95000000",
        costMatrix: null,
        financialApproval: false,
        financialApproverId: null,
        isCurrent: true,
        createdAt: "2026-01-05T00:00:00.000Z",
        updatedAt: "2026-01-05T00:00:00.000Z",
        readyForKam: false,
        readyForKamAt: null,
      },
    ],
    commercialStatus: null,
    creator: {
      id: "kam-2",
      firstName: "Julián",
      lastName: "Morales",
      email: "jmorales@icesi.edu.co",
    },
    productLeader: {
      id: "leader-2",
      firstName: "Beatriz",
      lastName: "Ríos",
      email: "brios@icesi.edu.co",
    },
    node: {
      id: "node-2",
      name: "Centro Ágora",
      code: "AGORA",
      color: "green",
    },
    assignments: [],
  },
  {
    id: "prop-3",
    code: "REQ-2026-0003",
    officialNumber: null,
    companyId: "comp-3",
    contactId: null,
    nodeId: null,
    title: "Taller de Analítica Predictiva",
    generalDescription: null,
    creatorId: "kam-1",
    productLeaderId: null,
    priority: "LOW",
    comments: null,
    // Old without professor to trigger missing professor alert
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
    company: {
      id: "comp-3",
      name: "Sura Seguros",
      nit: "890903407-9",
    },
    workflow: {
      id: "wf-3",
      proposalId: "prop-3",
      currentStatusId: "st-3",
      deadline: null,
      clientSentDate: null,
      createdAt: "2026-01-02T10:00:00.000Z",
      updatedAt: "2026-01-02T10:00:00.000Z",
      statusCode: "NEW",
      statusName: "Nueva solicitud",
    },
    program: null,
    economics: [],
    commercialStatus: null,
    creator: {
      id: "kam-1",
      firstName: "Claudia",
      lastName: "Rendón",
      email: "crendon@icesi.edu.co",
    },
    productLeader: null,
    node: null,
    assignments: [],
  },
] as unknown as ProposalListItem[];

describe("AdminAuditTable Component (Submódulo 5)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders audit table with headers and proposal rows", () => {
    render(<AdminAuditTable proposals={mockProposals} />);

    expect(screen.getByTestId("admin-audit-table-component")).toBeInTheDocument();
    expect(screen.getByTestId("audit-table")).toBeInTheDocument();
    expect(screen.getByText("Radicado / Código")).toBeInTheDocument();
    expect(screen.getByText("Empresa Aliada")).toBeInTheDocument();

    // Verify Banco W row
    expect(screen.getByText("Banco W")).toBeInTheDocument();
    expect(screen.getByText("CP 2026-0169")).toBeInTheDocument();
    expect(screen.getByText("Programa de Liderazgo Comercial")).toBeInTheDocument();

    // Verify Tecnoquímicas row
    expect(screen.getByText("Tecnoquímicas S.A.")).toBeInTheDocument();
    expect(screen.getByText("REQ-2026-0002")).toBeInTheDocument();
  });

  it("filters proposals instantaneously when typing in search input", () => {
    render(<AdminAuditTable proposals={mockProposals} />);

    const searchInput = screen.getByTestId("audit-search-input");
    fireEvent.change(searchInput, { target: { value: "Tecnoquímicas" } });

    expect(screen.getByText("Tecnoquímicas S.A.")).toBeInTheDocument();
    expect(screen.queryByText("Banco W")).not.toBeInTheDocument();
    expect(screen.queryByText("Sura Seguros")).not.toBeInTheDocument();

    // Search by official code
    fireEvent.change(searchInput, { target: { value: "CP 2026-0169" } });
    expect(screen.getByText("Banco W")).toBeInTheDocument();
    expect(screen.queryByText("Tecnoquímicas S.A.")).not.toBeInTheDocument();
  });

  it("displays SLA alerts for bottleneck (>20d) and missing professor (>5d)", () => {
    render(<AdminAuditTable proposals={mockProposals} />);

    // Prop-2 has >20d in IN_COSTING -> Cuello >20d alert
    expect(screen.getByText(/cuello >20d/i)).toBeInTheDocument();

    // Prop-3 has >5d in NEW without professor -> Sin docente >5d alert
    expect(screen.getByText(/sin docente >5d/i)).toBeInTheDocument();
  });

  it("clears all active filters when clicking the reset button", () => {
    render(<AdminAuditTable proposals={mockProposals} />);

    const searchInput = screen.getByTestId("audit-search-input");
    fireEvent.change(searchInput, { target: { value: "PalabraInexistenteXYZ" } });

    expect(screen.getByText("No se encontraron solicitudes")).toBeInTheDocument();
    expect(screen.getByTestId("audit-reset-filters-btn")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("audit-reset-filters-btn"));
    expect(screen.getByText("Banco W")).toBeInTheDocument();
    expect(screen.getByText("Tecnoquímicas S.A.")).toBeInTheDocument();
  });

  it("triggers CSV export with UTF-8 BOM on button click", () => {
    const anchorClickMock = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    render(<AdminAuditTable proposals={mockProposals} />);

    const exportBtn = screen.getByTestId("audit-export-csv-btn");
    fireEvent.click(exportBtn);

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(anchorClickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
  });

  it("renders both Excel (.xlsx) and CSV export buttons", () => {
    render(<AdminAuditTable proposals={mockProposals} />);
    expect(screen.getByTestId("audit-export-excel-btn")).toBeInTheDocument();
    expect(screen.getByTestId("audit-export-csv-btn")).toBeInTheDocument();
  });

  it("renders empty state when proposals array is empty", () => {
    render(<AdminAuditTable proposals={[]} />);

    expect(screen.getByText("No se encontraron solicitudes")).toBeInTheDocument();
  });
});
