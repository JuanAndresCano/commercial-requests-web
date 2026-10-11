import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KamCommandCenter } from "./KamCommandCenter";
import type { RequestItem, RequestType } from "@/lib/mock-data";

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

/** The board opens in Kanban; the table-based tests switch to the table view first, as the user would. */
const startInTableView = () => window.localStorage.setItem("icesi_kam_dashboard_view_v1", JSON.stringify("tabla"));

describe("KamCommandCenter (HU 3.1)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    startInTableView();
  });

  it("opens in the Kanban view when nothing was chosen in this session", () => {
    window.localStorage.clear();
    renderWithClient(<KamCommandCenter requests={mockRequests} userName="Andrea Martínez" />);
    expect(screen.getByTitle("Vista kanban por estado")).toHaveClass("bg-icesi-blue");
    expect(screen.getByRole("heading", { name: "En Proceso" })).toBeInTheDocument();
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
    // Entregada al líder (antes "Nueva") = 1, En Proceso = 0, Lista para Entregar = 1, Entregada = 0
    expect(screen.getByRole("button", { name: /^Entregada al líder/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /En Proceso/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lista para Entregar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Entregada(?! al líder)/i })).toBeInTheDocument();
  });

  it('labels the "nueva" stage as "Entregada al líder" for the KAM, in the card and in the table row', () => {
    renderWithClient(<KamCommandCenter requests={mockRequests} userName="Andrea Martínez" />);
    const row = screen.getByText("Propuesta Capacitación 1").closest("tr") as HTMLElement;
    expect(within(row).getByText("Entregada al líder")).toBeInTheDocument();
    expect(within(row).queryByText("Nueva")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Nueva\b/i })).not.toBeInTheDocument();
  });

  it("shows how long each request has been in its stage in the table rows", () => {
    const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString();
    const withAges: RequestItem[] = [
      { ...mockRequests[0], createdAt: daysAgo(3) },
      {
        ...mockRequests[1],
        createdAt: daysAgo(20),
        statusUpdatedAt: daysAgo(10),
        costing: { ...mockRequests[1].costing!, costingSentAt: daysAgo(2) },
      },
    ];
    renderWithClient(<KamCommandCenter requests={withAges} userName="Andrea Martínez" />);
    const nueva = screen.getByText("Propuesta Capacitación 1").closest("tr") as HTMLElement;
    const lista = screen.getByText("Propuesta Consultoría 2").closest("tr") as HTMLElement;
    expect(within(nueva).getByText("Lleva 3 días en esta etapa")).toBeInTheDocument();
    // "Lista para entregar" cuenta desde que el Líder envió el costeo, no desde el último cambio de estado.
    expect(within(lista).getByText("Lleva 2 días en esta etapa")).toBeInTheDocument();
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

  it("isolates a stage when its Kanban column header is clicked, and restores it on a second click", () => {
    renderWithClient(<KamCommandCenter requests={mockRequests} userName="Andrea Martínez" />);
    fireEvent.click(screen.getByTitle("Vista kanban por estado"));
    expect(screen.getByRole("heading", { name: "En Proceso" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Lista para Entregar\s*1$/ }));
    expect(screen.getByRole("heading", { name: "Lista para Entregar" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "En Proceso" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Entregada al líder" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Lista para Entregar\s*1$/ }));
    expect(screen.getByRole("heading", { name: "En Proceso" })).toBeInTheDocument();
  });

  it("filters the table when a KPI card is clicked", () => {
    renderWithClient(<KamCommandCenter requests={mockRequests} userName="Andrea Martínez" />);
    const nuevaCard = screen.getByRole("button", { name: /^Entregada al líder/i });

    fireEvent.click(nuevaCard);
    expect(screen.getByText("Propuesta Capacitación 1")).toBeInTheDocument();
    expect(screen.queryByText("Propuesta Consultoría 2")).not.toBeInTheDocument();
  });
});

describe("KamCommandCenter board filters (leader, company, type)", () => {
  const mk = (
    n: number,
    company: string,
    productLeader: string,
    type: RequestType,
    status: RequestItem["status"],
  ): RequestItem => ({
    id: `REQ-2026-01${n}`,
    title: `Propuesta ${n}`,
    company,
    applicant: "Contacto",
    type,
    createdAt: new Date().toISOString(),
    status,
    urgency: "media",
    productLeader,
    kam: "Andrea Martínez",
    node: "IA",
  });
  const dataset: RequestItem[] = [
    mk(1, "Bancolombia", "Carlos Gómez", "Capacitación", "nueva"),
    mk(2, "Carvajal", "Ana Ruiz", "Consultoría", "nueva"),
    mk(3, "Carvajal", "Carlos Gómez", "Capacitación", "en-experto"),
    mk(4, "Bancolombia", "Ana Ruiz", "Capacitación", "en-experto"),
  ];
  const pick = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

  beforeEach(() => {
    window.localStorage.clear();
    startInTableView();
  });

  it("derives the options from the loaded requests", () => {
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    expect(screen.getByRole("option", { name: "Ana Ruiz" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Carvajal" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Consultoría" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Mentoría" })).not.toBeInTheDocument();
  });

  it("filters the table by leader, company and type, combined with each other", () => {
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);

    pick("Filtrar por líder de producto", "Carlos Gómez");
    expect(screen.getByText("Propuesta 1")).toBeInTheDocument();
    expect(screen.getByText("Propuesta 3")).toBeInTheDocument();
    expect(screen.queryByText("Propuesta 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Propuesta 4")).not.toBeInTheDocument();

    pick("Filtrar por empresa", "Carvajal");
    expect(screen.getByText("Propuesta 3")).toBeInTheDocument();
    expect(screen.queryByText("Propuesta 1")).not.toBeInTheDocument();

    pick("Filtrar por tipo de solicitud", "Consultoría");
    expect(screen.queryByText("Propuesta 3")).not.toBeInTheDocument();
  });

  it("combines with the stage card and the text search", () => {
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    pick("Filtrar por empresa", "Carvajal");
    fireEvent.click(screen.getByRole("button", { name: /^Entregada al líder/i }));
    expect(screen.getByText("Propuesta 2")).toBeInTheDocument();
    expect(screen.queryByText("Propuesta 3")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Buscar por propuesta, empresa o ID.../i), {
      target: { value: "Bancolombia" },
    });
    expect(screen.queryByText("Propuesta 2")).not.toBeInTheDocument();
  });

  it("applies the filters in the Kanban view too", () => {
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    fireEvent.click(screen.getByTitle("Vista kanban por estado"));
    pick("Filtrar por líder de producto", "Ana Ruiz");
    expect(screen.getByText("Propuesta 2")).toBeInTheDocument();
    expect(screen.getByText("Propuesta 4")).toBeInTheDocument();
    expect(screen.queryByText("Propuesta 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Propuesta 3")).not.toBeInTheDocument();
  });

  it("shows an empty state with a clear-filters action when nothing matches", () => {
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    pick("Filtrar por líder de producto", "Ana Ruiz");
    pick("Filtrar por empresa", "Bancolombia");
    pick("Filtrar por tipo de solicitud", "Consultoría");

    expect(screen.getByText("No se encontraron solicitudes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    expect(screen.queryByText("No se encontraron solicitudes")).not.toBeInTheDocument();
    ["Propuesta 1", "Propuesta 2", "Propuesta 3", "Propuesta 4"].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Filtrar por empresa")).toHaveDisplayValue("Todas las empresas");
  });

  it("remembers the selection after leaving and coming back to the dashboard", () => {
    const first = renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    pick("Filtrar por empresa", "Carvajal");
    first.unmount();

    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    expect(screen.getByLabelText("Filtrar por empresa")).toHaveDisplayValue("Carvajal");
    expect(screen.queryByText("Propuesta 1")).not.toBeInTheDocument();
    expect(screen.getByText("Propuesta 2")).toBeInTheDocument();
  });

  it("ignores a stored selection that no longer exists in the data", () => {
    window.localStorage.setItem(
      "icesi_kam_dashboard_board_filters_v1",
      JSON.stringify({ productLeader: "", company: "Empresa Fantasma", type: "" }),
    );
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    expect(screen.getByText("Propuesta 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por empresa")).toHaveDisplayValue("Todas las empresas");
  });
});

describe("KamCommandCenter stage between 'create' and 'assign' (C-01)", () => {
  const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString();
  const base = (n: number, over: Partial<RequestItem>): RequestItem => ({
    id: `REQ-2026-02${n}`,
    title: `Solicitud ${n}`,
    company: "Bancolombia",
    applicant: "Contacto",
    type: "Capacitación",
    createdAt: daysAgo(4),
    status: "nueva",
    urgency: "media",
    productLeader: "Carlos Gómez",
    kam: "Andrea Martínez",
    node: "IA",
    ...over,
  });
  const dataset: RequestItem[] = [
    base(1, {}),
    base(2, { professor: "Dra. Paula Henao", professorType: "planta" }),
    base(3, { status: "en-costeo" }),
  ];

  beforeEach(() => {
    window.localStorage.clear();
    startInTableView();
  });

  it("shows 'Entregada al líder' without professor and 'En Proceso' with one, though both are nueva", () => {
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    const sinDocente = screen.getByText("Solicitud 1").closest("tr") as HTMLElement;
    const conDocente = screen.getByText("Solicitud 2").closest("tr") as HTMLElement;
    expect(within(sinDocente).getByText("Entregada al líder")).toBeInTheDocument();
    expect(within(conDocente).getByText("En Proceso")).toBeInTheDocument();
    expect(within(conDocente).queryByText("Entregada al líder")).not.toBeInTheDocument();
  });

  it("shows costing not yet sent to the KAM as 'En Proceso' too", () => {
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    const row = screen.getByText("Solicitud 3").closest("tr") as HTMLElement;
    expect(within(row).getByText("En Proceso")).toBeInTheDocument();
  });

  it("counts them in the KPI cards by the stage the KAM perceives", () => {
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    expect(screen.getByRole("button", { name: /^Entregada al líder\s*1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^En Proceso\s*2/ })).toBeInTheDocument();
  });

  it("filters the table by the perceived stage", () => {
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    fireEvent.click(screen.getByRole("button", { name: /^En Proceso\s*2/ }));
    expect(screen.queryByText("Solicitud 1")).not.toBeInTheDocument();
    expect(screen.getByText("Solicitud 2")).toBeInTheDocument();
    expect(screen.getByText("Solicitud 3")).toBeInTheDocument();
  });

  it("does not restart the time in stage when the professor is assigned", () => {
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    const sinDocente = screen.getByText("Solicitud 1").closest("tr") as HTMLElement;
    const conDocente = screen.getByText("Solicitud 2").closest("tr") as HTMLElement;
    expect(within(sinDocente).getByText("Lleva 4 días en esta etapa")).toBeInTheDocument();
    expect(within(conDocente).getByText("Lleva 4 días en esta etapa")).toBeInTheDocument();
  });

  it("places each request in the Kanban column of its perceived stage", () => {
    window.localStorage.clear();
    renderWithClient(<KamCommandCenter requests={dataset} userName="Andrea Martínez" />);
    const column = (name: string) => screen.getByRole("heading", { name }).closest("div.flex-col") as HTMLElement;
    expect(within(column("Entregada al líder")).getByText("Solicitud 1")).toBeInTheDocument();
    expect(within(column("En Proceso")).getByText("Solicitud 2")).toBeInTheDocument();
    expect(within(column("En Proceso")).getByText("Solicitud 3")).toBeInTheDocument();
  });
});

describe("KamCommandCenter total age and official number (C-13)", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const daysAgo = (d: number) => new Date(Date.now() - d * DAY - 60 * 60 * 1000).toISOString();

  beforeEach(() => {
    window.localStorage.clear();
    startInTableView();
  });

  it("shows the total days next to the days in the stage, and the official number only when there is one", () => {
    const items: RequestItem[] = [
      { ...mockRequests[0], createdAt: daysAgo(6) },
      { ...mockRequests[1], createdAt: daysAgo(20), officialNumber: "CP 2026-0169" },
    ];
    renderWithClient(<KamCommandCenter requests={items} userName="Andrea Martínez" />);
    const first = screen.getByText("Propuesta Capacitación 1").closest("tr") as HTMLElement;
    const second = screen.getByText("Propuesta Consultoría 2").closest("tr") as HTMLElement;
    expect(within(first).getByText("Total 6 días")).toBeInTheDocument();
    expect(within(first).queryByTitle("Número oficial")).not.toBeInTheDocument();
    expect(within(second).getByText("Total 20 días")).toBeInTheDocument();
    expect(within(second).getByText("CP 2026-0169")).toBeInTheDocument();
  });
});
