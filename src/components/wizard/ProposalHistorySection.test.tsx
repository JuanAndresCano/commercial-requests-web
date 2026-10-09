import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProposalHistorySection } from "./ProposalHistorySection";
import type { RequestItem } from "@/lib/mock-data";

function makeRequest(overrides: Partial<RequestItem>): RequestItem {
  return {
    id: "REQ-2026-0001",
    title: "Programa de liderazgo",
    applicant: "Ana Pérez",
    type: "Capacitación",
    createdAt: "2026-03-01T10:00:00.000Z",
    status: "entregada",
    urgency: "media",
    company: "Bancolombia",
    node: "Gestión de Innovación",
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Laura Gómez",
    totalCostCop: 12_000_000,
    ...overrides,
  };
}

const mockRequests: RequestItem[] = [
  makeRequest({
    id: "REQ-2026-0001",
    title: "Programa de liderazgo",
    status: "entregada",
    clientKamDocuments: [
      {
        id: "doc-1",
        name: "Propuesta_Bancolombia_v2.pdf",
        size: "2.4 MB",
        date: "26/03/2026",
        type: "pdf",
        category: "client_kam",
      },
    ],
  }),
  makeRequest({ id: "REQ-2026-0002", title: "Taller de analítica", status: "en-costeo" }),
  makeRequest({
    id: "REQ-2026-0003",
    title: "Consultoría logística",
    company: "Grupo Argos",
    companyNit: "890900266-3",
  }),
  makeRequest({ id: "REQ-2026-0004", title: "Mentoría directiva", company: "Grupo Éxito", companyNit: "890900608-9" }),
];

const useRequestsMock = vi.fn();
vi.mock("@/hooks/use-requests", () => ({
  useRequests: (...args: unknown[]) => useRequestsMock(...args),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ requests: mockRequests }),
}));

describe("ProposalHistorySection", () => {
  beforeEach(() => {
    useRequestsMock.mockReset();
    useRequestsMock.mockReturnValue({ data: undefined });
  });

  it("lists only the proposals that match the company being registered", () => {
    render(<ProposalHistorySection empresaNombre="Bancolombia" />);

    expect(screen.getByText("2 encontradas")).toBeInTheDocument();
    expect(screen.getByText("Programa de liderazgo")).toBeInTheDocument();
    expect(screen.getByText("Taller de analítica")).toBeInTheDocument();
    expect(screen.queryByText("Consultoría logística")).not.toBeInTheDocument();
  });

  it("filters the matches by delivered and in-progress status", () => {
    render(<ProposalHistorySection empresaNombre="Bancolombia" />);

    fireEvent.click(screen.getByRole("button", { name: /Entregadas \(1\)/ }));
    expect(screen.getByText("Programa de liderazgo")).toBeInTheDocument();
    expect(screen.queryByText("Taller de analítica")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /En Proceso \(1\)/ }));
    expect(screen.queryByText("Programa de liderazgo")).not.toBeInTheDocument();
    expect(screen.getByText("Taller de analítica")).toBeInTheDocument();
  });

  it("shows the empty state when the company has no registered proposals", () => {
    render(<ProposalHistorySection empresaNombre="Empresa Inexistente SAS" />);

    expect(screen.getByText(/No se encontraron propuestas registradas para/)).toBeInTheDocument();
    expect(screen.queryByText(/encontrada/)).not.toBeInTheDocument();
  });

  it("invites the KAM to search when there is no company name yet", () => {
    render(<ProposalHistorySection empresaNombre="" />);

    expect(screen.getByText(/Escribe en el buscador el NIT o el nombre exacto/)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Buscar empresa/), { target: { value: "  grupo ARGOS " } });
    expect(screen.getByText("Consultoría logística")).toBeInTheDocument();
  });

  it("does not bring other companies when searching a single word", () => {
    render(<ProposalHistorySection empresaNombre="" />);

    fireEvent.change(screen.getByPlaceholderText(/Buscar empresa/), { target: { value: "grupo" } });
    expect(screen.queryByText("Consultoría logística")).not.toBeInTheDocument();
    expect(screen.queryByText("Mentoría directiva")).not.toBeInTheDocument();
    expect(screen.getByText(/No se encontraron propuestas registradas para/)).toBeInTheDocument();
  });

  it("finds the antecedents by the exact NIT typed in the search box", () => {
    render(<ProposalHistorySection empresaNombre="" />);

    fireEvent.change(screen.getByPlaceholderText(/Buscar empresa/), { target: { value: "890.900.608-9" } });
    expect(screen.getByText("Mentoría directiva")).toBeInTheDocument();
    expect(screen.queryByText("Consultoría logística")).not.toBeInTheDocument();
  });

  it("uses the NIT of the wizard when the company name does not match", () => {
    render(<ProposalHistorySection empresaNombre="Argos Colombia" empresaNit="890900266-3" />);

    expect(screen.getByText("Consultoría logística")).toBeInTheDocument();
  });

  it("opens the detail modal of a proposal and closes it", () => {
    render(<ProposalHistorySection empresaNombre="Bancolombia" />);

    fireEvent.click(screen.getAllByRole("button", { name: /Ver detalle/ })[0]);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Programa de liderazgo")).toBeInTheDocument();
    expect(within(dialog).getByText("Tipo de Requerimiento")).toBeInTheDocument();
    expect(within(dialog).getByText("Propuesta_Bancolombia_v2.pdf")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the request code and the delivery date, not the internal id or a raw timestamp", () => {
    const fromApi = makeRequest({
      id: "0b8f7c3e-1111-4222-8333-444455556666",
      code: "REQ-2026-0142",
      title: "Diplomado en datos",
      company: "Carvajal Tecnología",
      deadline: "2026-10-23T15:50:56.277Z",
    });
    mockRequests.push(fromApi);
    try {
      render(<ProposalHistorySection empresaNombre="Carvajal Tecnología" />);

      expect(screen.getByText("REQ-2026-0142")).toBeInTheDocument();
      expect(screen.queryByText(/0b8f7c3e-1111/)).not.toBeInTheDocument();
      expect(screen.getByText(/Entrega: 2026-10-23$/)).toBeInTheDocument();
    } finally {
      mockRequests.pop();
    }
  });
});
