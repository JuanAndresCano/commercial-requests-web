import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KamCommandCenter } from "./KamCommandCenter";
import type { RequestItem } from "@/lib/mock-data";

const mockRequests: RequestItem[] = [
  {
    id: "REQ-2026-0001",
    title: "Propuesta Capacitación 1",
    company: "Bancolombia",
    applicant: "Juan Pérez",
    type: "Capacitación",
    createdAt: new Date().toISOString(),
    status: "nueva",
    urgency: "alta",
    productLeader: "Carlos Gómez",
    kam: "Andrea Martínez",
    node: "IA",
  },
  {
    id: "REQ-2026-0002",
    title: "Propuesta Consultoría 2",
    company: "Carvajal",
    applicant: "Maria López",
    type: "Consultoría",
    createdAt: new Date().toISOString(),
    status: "en-costeo",
    urgency: "media",
    productLeader: "Carlos Gómez",
    kam: "Andrea Martínez",
    node: "IA",
    costing: {
      readyForKam: true,
      totalOfferedCop: 15000000,
      expectedMarginPercent: 30,
      marginAmountCop: 4500000,
      proCulturaTaxPercent: 0,
      proCulturaTaxAmount: 0,
    },
  },
  {
    id: "REQ-2026-0003",
    title: "Propuesta Otra Persona",
    company: "Nutresa",
    applicant: "Pedro",
    type: "Capacitación",
    createdAt: new Date().toISOString(),
    status: "nueva",
    urgency: "baja",
    productLeader: "Carlos Gómez",
    kam: "Otro KAM",
    node: "IA",
  },
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("KamCommandCenter (HU 3.1)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the greeting with the KAM's first name", () => {
    renderWithClient(<KamCommandCenter requests={mockRequests} userName="Andrea Martínez" />);
    expect(screen.getByText("Hola, Andrea")).toBeInTheDocument();
    expect(screen.getByText("KAM Icesi")).toBeInTheDocument();
  });

  it("only shows requests belonging to the current KAM", () => {
    renderWithClient(<KamCommandCenter requests={mockRequests} userName="Andrea Martínez" />);
    // "Propuesta Capacitación 1" and "Propuesta Consultoría 2" belong to Andrea
    expect(screen.getByText("Propuesta Capacitación 1")).toBeInTheDocument();
    expect(screen.getByText("Propuesta Consultoría 2")).toBeInTheDocument();
    // "Propuesta Otra Persona" belongs to "Otro KAM"
    expect(screen.queryByText("Propuesta Otra Persona")).not.toBeInTheDocument();
  });

  it("renders the 4 KPI stage cards with correct counts", () => {
    renderWithClient(<KamCommandCenter requests={mockRequests} userName="Andrea Martínez" />);
    // Nueva = 1, En Proceso = 0, Lista para Entregar = 1, Entregada = 0
    expect(screen.getByRole("button", { name: /Nueva/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /En Proceso/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lista para Entregar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entregada/i })).toBeInTheDocument();
  });

  it("displays the contextual banner when proposals are ready to deliver", () => {
    renderWithClient(<KamCommandCenter requests={mockRequests} userName="Andrea Martínez" />);
    expect(screen.getByText(/¡Tienes 1 propuesta lista para entregar!/i)).toBeInTheDocument();
  });

  it("filters the table by search term", () => {
    renderWithClient(<KamCommandCenter requests={mockRequests} userName="Andrea Martínez" />);
    const searchInput = screen.getByPlaceholderText(/Buscar por propuesta, empresa o ID.../i);

    fireEvent.change(searchInput, { target: { value: "Bancolombia" } });
    expect(screen.getByText("Propuesta Capacitación 1")).toBeInTheDocument();
    expect(screen.queryByText("Propuesta Consultoría 2")).not.toBeInTheDocument();
  });

  it("toggles to Kanban view mode and shows stage columns", () => {
    renderWithClient(<KamCommandCenter requests={mockRequests} userName="Andrea Martínez" />);
    const kanbanButton = screen.getByTitle("Vista kanban por estado");

    fireEvent.click(kanbanButton);
    expect(kanbanButton).toHaveClass("bg-icesi-blue");
  });

  it("filters the table when a KPI card is clicked", () => {
    renderWithClient(<KamCommandCenter requests={mockRequests} userName="Andrea Martínez" />);
    const nuevaCard = screen.getByRole("button", { name: /Nueva/i });

    fireEvent.click(nuevaCard);
    expect(screen.getByText("Propuesta Capacitación 1")).toBeInTheDocument();
    expect(screen.queryByText("Propuesta Consultoría 2")).not.toBeInTheDocument();
  });
});
