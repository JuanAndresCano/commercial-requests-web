import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReassignLeaderDialog } from "./ReassignLeaderDialog";
import type { RequestItem } from "@/lib/mock-data";

const sampleRequest: RequestItem = {
  id: "REQ-2026-0001",
  code: "PROP-2026-0001",
  title: "Programa en Analítica de Datos",
  company: "Bancolombia",
  contact: "Ana Gómez",
  kam: "Andrea Martínez",
  productLeader: "Carlos Mendoza",
  node: "Inteligencia Artificial y Tecnologías Digitales",
  status: "en-experto",
  type: "Capacitación",
  urgency: "alta",
  createdAt: "2026-10-01T10:00:00Z",
  statusUpdatedAt: "2026-10-02T10:00:00Z",
  assignments: [],
  attachments: [],
  negotiationRounds: [],
};

describe("ReassignLeaderDialog (UI-003)", () => {
  it("does not render dialog content when request is null", () => {
    render(<ReassignLeaderDialog request={null} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByText("Reasignar Líder de Producto")).not.toBeInTheDocument();
  });

  it("renders accurate description without claiming to reset status to Nueva or clear professor", () => {
    render(<ReassignLeaderDialog request={sampleRequest} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    // Accurate description
    expect(screen.getByText(/manteniendo intactos su estado actual y los datos registrados/i)).toBeInTheDocument();

    // Outdated misleading warning should NOT be present
    expect(screen.queryByText(/La solicitud volverá a la fase "Nueva"/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reinicie la asignación de docente/i)).not.toBeInTheDocument();
  });

  it("displays current request details in summary panel", () => {
    render(<ReassignLeaderDialog request={sampleRequest} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText("REQ-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Programa en Analítica de Datos")).toBeInTheDocument();
    expect(screen.getByText("Bancolombia")).toBeInTheDocument();
    expect(screen.getByText("Carlos Mendoza")).toBeInTheDocument();
  });
});
