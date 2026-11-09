import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProposalDetail } from "@/lib/api/requests";
import { CommercialStatusPanel } from "./CommercialStatusPanel";

const proposal: Pick<ProposalDetail, "id" | "creator" | "workflow" | "commercialStatus" | "commercialStatusHistory"> = {
  id: "proposal-1",
  creator: { id: "kam-1", email: "kam@icesi.edu.co", firstName: "Diana", lastName: "Martínez" },
  workflow: {
    id: "workflow-1",
    proposalId: "proposal-1",
    currentStatusId: "delivered",
    currentStatus: { id: "delivered", code: "DELIVERED", name: "Delivered" },
    requestDate: null,
    proposalCreationDate: null,
    clientSentDate: null,
    clientApprovalDate: null,
    closingDate: null,
    deadline: null,
    currentStatusSince: null,
  },
  commercialStatus: "INVOICED",
  commercialStatusHistory: [
    {
      id: "change-1",
      previousStatus: "APPROVED_WITHOUT_CONTRACT",
      status: "INVOICED",
      changedAt: "2026-11-06T12:00:00Z",
      changedBy: { id: "kam-1", firstName: "Diana", lastName: "Martínez" },
    },
    {
      id: "change-0",
      previousStatus: null,
      status: "APPROVED_WITHOUT_CONTRACT",
      changedAt: "2026-11-05T12:00:00Z",
      changedBy: { id: "kam-1", firstName: null, lastName: null },
    },
  ],
};

function renderPanel(overrides: Partial<React.ComponentProps<typeof CommercialStatusPanel>> = {}) {
  return render(<CommercialStatusPanel proposal={proposal} role="kam" userEmail="kam@icesi.edu.co" {...overrides} />);
}

describe("Commercial follow-up history panel", () => {
  it("lists the persisted changes with names, author and date, and has no second selector", () => {
    renderPanel();
    expect(screen.getByRole("heading", { name: "Seguimiento comercial" })).toBeInTheDocument();
    expect(screen.getByText("Aprobación sin contrato → Facturada")).toBeInTheDocument();
    expect(screen.getByText("Sin etiqueta → Aprobación sin contrato")).toBeInTheDocument();
    expect(screen.getByText("Diana Martínez")).toBeInTheDocument();
    expect(screen.getByText("KAM")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("tells the owner where to change the tag when there is no history yet", () => {
    renderPanel({ proposal: { ...proposal, commercialStatusHistory: [] } });
    expect(screen.getByText(/Aún no hay cambios de etiqueta/)).toBeInTheDocument();
  });

  it("shows the same history, read-only, to the Product Leader", () => {
    renderPanel({ role: "lider-producto", userEmail: "lp@icesi.edu.co" });
    expect(screen.getByText("Aprobación sin contrato → Facturada")).toBeInTheDocument();
  });

  it.each(["administrador", "profesor"] as const)("is hidden from %s", (role) => {
    renderPanel({ role });
    expect(screen.queryByRole("heading", { name: "Seguimiento comercial" })).not.toBeInTheDocument();
  });

  it("is hidden from another KAM and before delivery", () => {
    const { rerender } = renderPanel({ userEmail: "other@icesi.edu.co" });
    expect(screen.queryByRole("heading", { name: "Seguimiento comercial" })).not.toBeInTheDocument();
    rerender(
      <CommercialStatusPanel proposal={{ ...proposal, workflow: null }} role="kam" userEmail="kam@icesi.edu.co" />,
    );
    expect(screen.queryByRole("heading", { name: "Seguimiento comercial" })).not.toBeInTheDocument();
  });
});
