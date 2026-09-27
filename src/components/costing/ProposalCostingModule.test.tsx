import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProposalCostingModule } from "@/components/costing/ProposalCostingModule";
import type { ProposalCosting, RequestItem } from "@/lib/mock-data";

function makeRequest(costing?: Partial<ProposalCosting>): RequestItem {
  return {
    id: "req-1",
    title: "Diplomado en liderazgo",
    applicant: "Cliente S.A.",
    type: "Capacitación",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "en-costeo",
    urgency: "media",
    company: "Cliente S.A.",
    node: "Inteligencia Artificial y Tecnologías Digitales",
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Andrea Martínez",
    costing: costing && {
      marginAmountCop: 0,
      expectedMarginPercent: 30,
      proCulturaTaxPercent: 0,
      proCulturaTaxAmount: 0,
      totalOfferedCop: 1_000_000,
      readyForKam: false,
      ...costing,
    },
  };
}

describe("ProposalCostingModule", () => {
  it("invalida readyForKam al editar el Valor Final después de haberlo marcado", () => {
    const onUpdateCosting = vi.fn();
    const request = makeRequest({ readyForKam: true, costingSentAt: "2026-01-10T00:00:00.000Z" });

    render(<ProposalCostingModule request={request} onUpdateCosting={onUpdateCosting} />);

    fireEvent.change(screen.getByLabelText(/Valor Final de la Propuesta/i), { target: { value: "1500000" } });

    expect(onUpdateCosting).toHaveBeenCalledWith(
      expect.objectContaining({ totalOfferedCop: 1_500_000, readyForKam: false, costingSentAt: undefined }),
    );
  });

  it("invalida readyForKam al editar el % de margen después de haberlo marcado", () => {
    const onUpdateCosting = vi.fn();
    const request = makeRequest({ readyForKam: true, costingSentAt: "2026-01-10T00:00:00.000Z" });

    render(<ProposalCostingModule request={request} onUpdateCosting={onUpdateCosting} />);

    fireEvent.click(screen.getByRole("button", { name: "35%" }));

    expect(onUpdateCosting).toHaveBeenCalledWith(
      expect.objectContaining({ expectedMarginPercent: 35, readyForKam: false }),
    );
  });

  it("NO invalida readyForKam al editar solo la nota de alcance", () => {
    const onUpdateCosting = vi.fn();
    const request = makeRequest({ readyForKam: true, costingSentAt: "2026-01-10T00:00:00.000Z" });

    render(<ProposalCostingModule request={request} onUpdateCosting={onUpdateCosting} />);

    fireEvent.click(screen.getByText(/Agregar nota de alcance/i));
    fireEvent.change(screen.getByLabelText(/Nota de alcance comercial/i), {
      target: { value: "Ajuste acordado con el cliente" },
    });

    expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ readyForKam: true }));
  });

  it("no deja bajar el Valor Final por debajo de 0", () => {
    const onUpdateCosting = vi.fn();
    const request = makeRequest({ totalOfferedCop: 500_000 });

    render(<ProposalCostingModule request={request} onUpdateCosting={onUpdateCosting} />);

    fireEvent.change(screen.getByLabelText(/Valor Final de la Propuesta/i), { target: { value: "-1000" } });

    expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ totalOfferedCop: 0 }));
  });

  it("clampa el % de margen entre 0 y 100", () => {
    const onUpdateCosting = vi.fn();
    const request = makeRequest({});

    render(<ProposalCostingModule request={request} onUpdateCosting={onUpdateCosting} />);

    const marginPercentInput = document.getElementById("margin-percent-input") as HTMLInputElement;
    fireEvent.change(marginPercentInput, { target: { value: "150" } });

    expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ expectedMarginPercent: 100 }));
  });
});
