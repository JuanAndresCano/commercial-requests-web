import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KamCommandCenter } from "./KamCommandCenter";
import { ProductLeaderDashboard } from "./ProductLeaderDashboard";
import { mapProposalToRequestItem } from "@/lib/proposal-adapter";
import type { ProposalListItem } from "@/lib/api/requests";

vi.mock("@/hooks/use-reassign-proposal", () => ({
  useReassignProposal: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/use-nodes", () => ({ useNodes: () => ({ data: [], isLoading: false }) }));
vi.mock("@/hooks/use-product-leaders", () => ({ useProductLeaders: () => ({ data: [], isLoading: false }) }));

const NOTICE = "Cliente pidió ajustes";

/** A row of GET /requests or /requests/dashboard/prioritized: latest round only, three fields. */
function listItem(id: string, title: string, negotiationRounds: unknown): ProposalListItem {
  const item = {
    id,
    code: id,
    companyId: "c1",
    contactId: null,
    nodeId: "n1",
    title,
    generalDescription: null,
    creatorId: "u1",
    productLeaderId: "pl1",
    priority: "MEDIA",
    comments: null,
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-20T00:00:00.000Z",
    company: { id: "c1", name: "Carvajal S.A." },
    workflow: {
      currentStatus: { id: "st", code: "IN_COSTING", name: "IN_COSTING" },
      currentStatusSince: "2026-09-20T00:00:00.000Z",
      deadline: null,
    },
    program: { requestType: "CAPACITACION" },
    economics: [{ isCurrent: true, grossValue: "1000000", readyForKam: true, readyForKamAt: null }],
    productLeader: { id: "pl1", firstName: "Juan", lastName: "Corrales", email: "lp@icesi.edu.co" },
    assignments: [],
  } as unknown as ProposalListItem;
  if (negotiationRounds !== undefined) item.negotiationRounds = negotiationRounds as never;
  return item;
}

const RETURNED = [{ roundNumber: 2, clientResponse: "CHANGES_REQUESTED", clientNote: "Bajar el precio" }];
const REDELIVERED = [{ roundNumber: 3, clientResponse: "PENDING", clientNote: null }];

const proposals = [
  listItem("p-returned", "Propuesta devuelta", RETURNED),
  listItem("p-redelivered", "Propuesta reentregada", REDELIVERED),
  listItem("p-old-backend", "Propuesta sin rondas", undefined),
];
const requests = proposals.map((p) => mapProposalToRequestItem(p));

/** The strip is always rendered (invisible when it does not apply) to reserve the space. */
function noticeIsVisible(card: HTMLElement) {
  const strip = within(card).getByText(NOTICE).parentElement as HTMLElement;
  return strip.className.includes("bg-amber-100") && !strip.className.includes("invisible");
}

/** The card is the smallest ancestor of the title that holds a notice strip. */
function cardOf(title: string) {
  let el = screen.getByText(title).parentElement as HTMLElement;
  while (within(el).queryAllByText(NOTICE).length === 0) el = el.parentElement as HTMLElement;
  expect(within(el).getAllByText(NOTICE)).toHaveLength(1);
  return el;
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("returned-with-observations notice on the Kanban cards (HU 5.4)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the amber notice on the Leader's card only for the returned proposal, and still renders a list item without rounds", () => {
    renderWithProviders(
      <ProductLeaderDashboard
        requests={requests}
        user={{ name: "Juan Corrales", email: "lp@icesi.edu.co", roleLabel: "Líder de Producto" }}
        updateRequest={vi.fn()}
        updateStatus={vi.fn()}
      />,
    );

    expect(noticeIsVisible(cardOf("Propuesta devuelta"))).toBe(true);
    expect(noticeIsVisible(cardOf("Propuesta reentregada"))).toBe(false);
    expect(noticeIsVisible(cardOf("Propuesta sin rondas"))).toBe(false);
  });

  it("shows the amber notice on the KAM's Kanban card only for the returned proposal, and still renders a list item without rounds", () => {
    renderWithProviders(<KamCommandCenter requests={requests} userName="KAM Icesi" />);
    fireEvent.click(screen.getByLabelText("Vista kanban"));

    expect(noticeIsVisible(cardOf("Propuesta devuelta"))).toBe(true);
    expect(noticeIsVisible(cardOf("Propuesta reentregada"))).toBe(false);
    expect(noticeIsVisible(cardOf("Propuesta sin rondas"))).toBe(false);
  });
});
