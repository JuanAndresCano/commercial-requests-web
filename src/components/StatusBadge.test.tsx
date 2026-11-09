import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("commercial proposal phases agreed with Lina", () => {
  it("calls a delivered proposal a presentation without treating it as a client approval", () => {
    render(<StatusBadge status="entregada" />);
    expect(screen.getByText("Entregada")).toBeInTheDocument();
    expect(screen.queryByText(/aprobada/i)).not.toBeInTheDocument();
  });

  it("shows client-requested work as sustentation and adjustments while it returns to costing", () => {
    render(<StatusBadge status="en-costeo" pendingAdjustment />);
    expect(screen.getByText("Sustentación y ajustes")).toBeInTheDocument();
  });

  it("keeps first-time costing distinct from client adjustments", () => {
    render(<StatusBadge status="en-costeo" pendingAdjustment={false} />);
    expect(screen.getByText("En proceso de costeo")).toBeInTheDocument();
    expect(screen.queryByText("Sustentación y ajustes")).not.toBeInTheDocument();
  });

  it("returns to presentation after a new delivery even if an old observation is still present", () => {
    render(<StatusBadge status="entregada" pendingAdjustment={false} />);
    expect(screen.getByText("Entregada")).toBeInTheDocument();
    expect(screen.queryByText("Sustentación y ajustes")).not.toBeInTheDocument();
  });

  it("keeps the handoff visible while the adjusted proposal waits for the KAM", () => {
    render(<StatusBadge status="enviada-kam" pendingAdjustment />);
    expect(screen.getByText("Enviada al KAM")).toBeInTheDocument();
    expect(screen.getByText("Sustentación y ajustes")).toBeInTheDocument();
  });
});
