import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditTeamDialog, suggestedLeaderIdFor } from "./EditTeamDialog";
import type { RequestItem } from "@/lib/mock-data";

const request: RequestItem = {
  id: "uuid-1",
  code: "REQ-2026-0001",
  title: "Programa en Analítica de Datos",
  company: "Bancolombia",
  applicant: "Ana Gómez",
  kam: "Diana Martínez",
  productLeader: "Laura Diaz",
  node: "Inteligencia Artificial y Tecnologías Digitales",
  status: "nueva",
  type: "Capacitación",
  urgency: "media",
  createdAt: "2026-10-01T10:00:00Z",
};

const nodeOptions = [
  { id: "n-ia", label: "Inteligencia Artificial y Tecnologías Digitales" },
  { id: "n-edu", label: "Innovación Educativa, Bienestar Social, Innovación Pública" },
];
const leaderOptions = [
  { id: "l-laura", label: "Laura Diaz" },
  { id: "l-diana", label: "Diana Carolina Romero Valencia" },
];

// Opening a Radix Select in jsdom leaves work running that slows the whole worker
// (see NewRequest.test.tsx); the selection logic is tested as a pure function instead.
const nodeSelect = () => document.getElementById("edit-team-node") as HTMLElement;
const leaderSelect = () => document.getElementById("edit-team-leader") as HTMLElement;
const saveButton = () => screen.getByText("Guardar cambios").closest("button") as HTMLButtonElement;

describe("suggestedLeaderIdFor (same node → leader catalogue as the creation wizard)", () => {
  it("returns the suggested leader of the chosen node", () => {
    expect(suggestedLeaderIdFor("n-edu", nodeOptions, leaderOptions)).toBe("l-diana");
  });

  it("returns nothing when the suggested leader is not in the directory or the node is unknown", () => {
    expect(suggestedLeaderIdFor("n-ia", nodeOptions, leaderOptions)).toBeUndefined();
    expect(suggestedLeaderIdFor("missing", nodeOptions, leaderOptions)).toBeUndefined();
    expect(suggestedLeaderIdFor("n-edu", undefined, leaderOptions)).toBeUndefined();
  });
});

describe("EditTeamDialog (KAM corrects node or leader)", () => {
  it("starts on the current node and leader, with nothing to save yet", () => {
    render(
      <EditTeamDialog
        request={request}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        nodeOptions={nodeOptions}
        leaderOptions={leaderOptions}
      />,
    );
    expect(screen.getByText("Cambiar nodo o líder")).toBeInTheDocument();
    expect(nodeSelect()).toHaveTextContent("Inteligencia Artificial y Tecnologías Digitales");
    expect(leaderSelect()).toHaveTextContent("Laura Diaz");
    expect(saveButton()).toBeDisabled();
  });

  it("keeps the selects disabled while the options load", () => {
    render(<EditTeamDialog request={request} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);
    expect(nodeSelect()).toBeDisabled();
    expect(saveButton()).toBeDisabled();
  });

  it("renders nothing while there is no request", () => {
    render(<EditTeamDialog request={null} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByText("Cambiar nodo o líder")).not.toBeInTheDocument();
  });
});

describe("EditTeamDialog when the request has no node (C-06)", () => {
  const noNode: RequestItem = { ...request, node: null };

  it("starts on Sin nodo with the current leader, and nothing to save yet", () => {
    render(
      <EditTeamDialog
        request={noNode}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        nodeOptions={nodeOptions}
        leaderOptions={leaderOptions}
      />,
    );
    expect(nodeSelect()).toHaveTextContent("Sin nodo");
    expect(leaderSelect()).toHaveTextContent("Laura Diaz");
    expect(saveButton()).toBeDisabled();
  });

  it("does not ask for a node before saving", () => {
    render(
      <EditTeamDialog
        request={noNode}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        nodeOptions={nodeOptions}
        leaderOptions={leaderOptions}
      />,
    );
    expect(screen.queryByText("Selecciona un nodo")).not.toBeInTheDocument();
  });
});
