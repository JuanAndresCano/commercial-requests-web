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
  applicant: "Ana Gómez",
  kam: "Andrea Martínez",
  productLeader: "Carlos Mendoza",
  node: "Inteligencia Artificial y Tecnologías Digitales",
  status: "en-experto",
  type: "Capacitación",
  urgency: "alta",
  createdAt: "2026-10-01T10:00:00Z",
  statusUpdatedAt: "2026-10-02T10:00:00Z",
  negotiationRounds: [],
};

describe("ReassignLeaderDialog (UI-003)", () => {
  it("does not render dialog content when request is null", () => {
    render(<ReassignLeaderDialog request={null} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByText("Reasignar Líder de Producto")).not.toBeInTheDocument();
  });

  it("warns that reassigning from En Experto restarts the flow in Nueva (prototype rule)", () => {
    render(<ReassignLeaderDialog request={sampleRequest} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText(/La solicitud volverá a la fase "Nueva"/i)).toBeInTheDocument();
    expect(screen.getByText(/reinicie la asignación de docente/i)).toBeInTheDocument();
  });

  it("does not announce a restart when the request is still Nueva", () => {
    render(
      <ReassignLeaderDialog
        request={{ ...sampleRequest, status: "nueva" }}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/si no corresponde a tu área temática/i)).toBeInTheDocument();
    expect(screen.queryByText(/La solicitud volverá a la fase "Nueva"/i)).not.toBeInTheDocument();
  });

  it("displays current request details in summary panel", () => {
    render(<ReassignLeaderDialog request={sampleRequest} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText("PROP-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Programa en Analítica de Datos")).toBeInTheDocument();
    expect(screen.getByText("Bancolombia")).toBeInTheDocument();
    expect(screen.getByText("Carlos Mendoza")).toBeInTheDocument();
  });
});
