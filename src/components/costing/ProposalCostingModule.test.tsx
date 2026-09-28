import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { ProposalCostingModule } from "@/components/costing/ProposalCostingModule";
import type { ProposalCosting, RequestItem } from "@/lib/mock-data";

const AUTOSAVE_MS = 800;

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

const totalInput = () => screen.getByLabelText(/Valor Final de la Propuesta/i) as HTMLInputElement;
const percentInput = () => document.getElementById("margin-percent-input") as HTMLInputElement;
const amountInput = () => document.getElementById("margin-amount-input") as HTMLInputElement;
const typeInto = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

function setup(costing?: Partial<ProposalCosting>) {
  const onUpdateCosting = vi.fn();
  const view = render(<ProposalCostingModule request={makeRequest(costing)} onUpdateCosting={onUpdateCosting} />);
  const rerenderWith = (next?: Partial<ProposalCosting>) =>
    view.rerender(<ProposalCostingModule request={makeRequest(next)} onUpdateCosting={onUpdateCosting} />);
  return { onUpdateCosting, rerenderWith };
}

describe("ProposalCostingModule", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("pasted formats (es-CO)", () => {
    it('reads "$32.000.000" in the total as 32000000', () => {
      const { onUpdateCosting } = setup({ readyForKam: false });
      typeInto(totalInput(), "$32.000.000");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).toHaveBeenCalledTimes(1);
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ totalOfferedCop: 32_000_000 }));
    });

    it('reads "30%" in the margin percentage as 30', () => {
      const { onUpdateCosting } = setup();
      typeInto(percentInput(), "35%");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ expectedMarginPercent: 35 }));
    });

    it('reads "$9.000.000" in the margin amount as 9000000', () => {
      const { onUpdateCosting } = setup();
      typeInto(amountInput(), "$9.000.000");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ marginAmountCop: 9_000_000 }));
    });

    it("sends any number of decimals unrounded and previews them rounded", () => {
      const { onUpdateCosting } = setup();
      typeInto(totalInput(), "32.000.000,456");
      expect(screen.getByText(/Equivale a \$\s?32\.000\.000 COP/)).toBeInTheDocument();
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ totalOfferedCop: 32_000_000.456 }));
    });

    it("shows the preview line for what was typed before it is saved", () => {
      setup();
      typeInto(totalInput(), "$1.500.000");
      expect(screen.getByText(/Equivale a \$\s?1\.500\.000 COP/)).toBeInTheDocument();
    });

    it("renders text inputs, not number inputs", () => {
      setup();
      for (const input of [totalInput(), percentInput(), amountInput()]) {
        expect(input.type).toBe("text");
      }
    });
  });

  describe("invalid values", () => {
    it.each(["abc", "1.5", "-1000", "1,2,3"])("does not save %j in the total and says so", (raw) => {
      const { onUpdateCosting } = setup();
      typeInto(totalInput(), raw);
      wait(AUTOSAVE_MS);
      fireEvent.blur(totalInput());
      expect(onUpdateCosting).not.toHaveBeenCalled();
      expect(screen.getByText(/Valor no válido/i)).toBeInTheDocument();
    });

    it("does not clamp a negative total to 0 anymore: it refuses it", () => {
      const { onUpdateCosting } = setup({ totalOfferedCop: 500_000 });
      typeInto(totalInput(), "-1000");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).not.toHaveBeenCalled();
    });

    it.each(["150", "100,5", "-5", "abc"])("does not save %j as margin percentage", (raw) => {
      const { onUpdateCosting } = setup();
      typeInto(percentInput(), raw);
      wait(AUTOSAVE_MS);
      fireEvent.blur(percentInput());
      expect(onUpdateCosting).not.toHaveBeenCalled();
      expect(screen.getByText(/entre 0 y 100/i)).toBeInTheDocument();
    });

    it("does not save a margin amount that is not a valid amount", () => {
      const { onUpdateCosting } = setup();
      typeInto(amountInput(), "$abc");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).not.toHaveBeenCalled();
      expect(screen.getByText(/Valor no válido/i)).toBeInTheDocument();
    });

    it("does not save a valid field while another one is still invalid", () => {
      const { onUpdateCosting } = setup();
      typeInto(totalInput(), "xyz");
      typeInto(percentInput(), "40");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).not.toHaveBeenCalled();
    });

    it("saves once the invalid value is corrected", () => {
      const { onUpdateCosting } = setup();
      typeInto(totalInput(), "xyz");
      wait(AUTOSAVE_MS);
      typeInto(totalInput(), "2.000.000");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).toHaveBeenCalledTimes(1);
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ totalOfferedCop: 2_000_000 }));
    });
  });

  describe("fraction warning", () => {
    it.each([
      ["0,3", "30"],
      ["0.3", "30"],
      ["0,075", "7,5"],
    ])("warns that %j may mean %s %%", (raw, suggestion) => {
      setup();
      typeInto(percentInput(), raw);
      expect(screen.getByText(`¿quisiste decir ${suggestion} %?`)).toBeInTheDocument();
    });

    it("does not block: 0,3 is still saved literally", () => {
      const { onUpdateCosting } = setup();
      typeInto(percentInput(), "0,3");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ expectedMarginPercent: 0.3 }));
    });

    it.each(["0", "1", "30", "30%", ""])("does not warn for %j", (raw) => {
      setup();
      typeInto(percentInput(), raw);
      expect(screen.queryByText(/quisiste decir/i)).not.toBeInTheDocument();
    });
  });

  describe("autosave", () => {
    it("waits for the debounce: nothing before ~800 ms, one call at 800 ms", () => {
      const { onUpdateCosting } = setup();
      typeInto(totalInput(), "2000000");
      wait(AUTOSAVE_MS - 1);
      expect(onUpdateCosting).not.toHaveBeenCalled();
      wait(1);
      expect(onUpdateCosting).toHaveBeenCalledTimes(1);
    });

    it("does not send one request per keystroke: a burst of edits saves once, with the last value", () => {
      const { onUpdateCosting } = setup();
      for (const partial of ["2", "20", "200", "2.000", "2.000.0", "2.000.00", "2.000.000"]) {
        typeInto(totalInput(), partial);
        wait(100);
      }
      expect(onUpdateCosting).not.toHaveBeenCalled();
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).toHaveBeenCalledTimes(1);
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ totalOfferedCop: 2_000_000 }));
    });

    it("saves every field in one call when several change inside the same window", () => {
      const { onUpdateCosting } = setup();
      typeInto(totalInput(), "2.000.000");
      wait(300);
      typeInto(percentInput(), "35");
      wait(300);
      typeInto(amountInput(), "700.000");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).toHaveBeenCalledTimes(1);
      expect(onUpdateCosting).toHaveBeenCalledWith(
        expect.objectContaining({ totalOfferedCop: 2_000_000, expectedMarginPercent: 35, marginAmountCop: 700_000 }),
      );
    });

    it("saves on blur without waiting for the debounce, and does not save again afterwards", () => {
      const { onUpdateCosting } = setup();
      typeInto(percentInput(), "40");
      expect(onUpdateCosting).not.toHaveBeenCalled();
      fireEvent.blur(percentInput());
      expect(onUpdateCosting).toHaveBeenCalledTimes(1);
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ expectedMarginPercent: 40 }));
      wait(AUTOSAVE_MS * 2);
      expect(onUpdateCosting).toHaveBeenCalledTimes(1);
    });

    it("does nothing on blur when the field was not edited", () => {
      const { onUpdateCosting } = setup();
      fireEvent.blur(totalInput());
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).not.toHaveBeenCalled();
    });

    it.each([
      ["total", totalInput],
      ["margin percentage", percentInput],
      ["margin amount", amountInput],
    ])(
      "focusing and blurring the %s without changing it saves nothing, so readyForKam is not reset",
      (_name, field) => {
        const { onUpdateCosting } = setup({
          readyForKam: true,
          costingSentAt: "2026-01-10T00:00:00.000Z",
          expectedMarginPercent: 30,
          marginAmountCop: 5_000,
        });
        fireEvent.focus(field());
        fireEvent.blur(field());
        wait(AUTOSAVE_MS * 2);
        expect(onUpdateCosting).not.toHaveBeenCalled();
      },
    );

    it("tabbing through every field without typing saves nothing", () => {
      const { onUpdateCosting } = setup({ readyForKam: true, expectedMarginPercent: 30, marginAmountCop: 5_000 });
      for (const field of [totalInput, percentInput, amountInput]) {
        fireEvent.focus(field());
        fireEvent.blur(field());
      }
      wait(AUTOSAVE_MS * 2);
      expect(onUpdateCosting).not.toHaveBeenCalled();
    });

    it("retyping the same number in another format and leaving the field saves nothing", () => {
      const { onUpdateCosting } = setup({ totalOfferedCop: 32_000_000, expectedMarginPercent: 30 });
      typeInto(totalInput(), "$32.000.000");
      fireEvent.blur(totalInput());
      typeInto(percentInput(), "30%");
      fireEvent.blur(percentInput());
      wait(AUTOSAVE_MS * 2);
      expect(onUpdateCosting).not.toHaveBeenCalled();
    });

    it("does not save when the edit ends up equal to what is already saved", () => {
      const { onUpdateCosting } = setup({ totalOfferedCop: 1_000_000 });
      typeInto(totalInput(), "2.000.000");
      typeInto(totalInput(), "$1.000.000");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).not.toHaveBeenCalled();
    });

    it("has no Save button: saving is automatic", () => {
      setup();
      expect(screen.queryByRole("button", { name: /guardar/i })).not.toBeInTheDocument();
    });

    it("saves the preset chips right away", () => {
      const { onUpdateCosting } = setup();
      fireEvent.click(screen.getByRole("button", { name: "35%" }));
      expect(onUpdateCosting).toHaveBeenCalledTimes(1);
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ expectedMarginPercent: 35 }));
      expect(percentInput().value).toBe("35");
    });
  });

  describe("empty and zero margins", () => {
    it("sends an emptied margin as undefined (no margin), not as 0", () => {
      const { onUpdateCosting } = setup({ expectedMarginPercent: 30, marginAmountCop: 5_000 });
      typeInto(percentInput(), "");
      typeInto(amountInput(), "");
      wait(AUTOSAVE_MS);
      const saved = onUpdateCosting.mock.calls[0][0] as ProposalCosting;
      expect(saved.expectedMarginPercent).toBeUndefined();
      expect(saved.marginAmountCop).toBeUndefined();
    });

    it("sends an explicit 0 as 0", () => {
      const { onUpdateCosting } = setup({ expectedMarginPercent: 30, marginAmountCop: 5_000 });
      typeInto(percentInput(), "0");
      typeInto(amountInput(), "0");
      wait(AUTOSAVE_MS);
      const saved = onUpdateCosting.mock.calls[0][0] as ProposalCosting;
      expect(saved.expectedMarginPercent).toBe(0);
      expect(saved.marginAmountCop).toBe(0);
    });

    it("shows a margin the backend does not have as empty fields, not as 30 %", () => {
      setup({ expectedMarginPercent: undefined, marginAmountCop: undefined });
      expect(percentInput().value).toBe("");
      expect(amountInput().value).toBe("");
    });

    it("shows a stored 0 as 0", () => {
      setup({ expectedMarginPercent: 0, marginAmountCop: 0 });
      expect(percentInput().value).toBe("0");
      expect(amountInput().value).toBe("0");
    });

    it("keeps an empty total as 0", () => {
      const { onUpdateCosting } = setup({ totalOfferedCop: 500_000 });
      typeInto(totalInput(), "");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ totalOfferedCop: 0 }));
    });
  });

  describe("syncing with the saved costing", () => {
    it("shows the new saved values when the costing changes and nothing is being edited", () => {
      const { rerenderWith } = setup({ totalOfferedCop: 1_000_000, expectedMarginPercent: 30 });
      rerenderWith({ totalOfferedCop: 2_500_000, expectedMarginPercent: 12.5 });
      expect(totalInput().value).toBe("2500000");
      expect(percentInput().value).toBe("12,5");
    });

    it("does not overwrite what the user typed with an older save coming back", () => {
      const { rerenderWith } = setup({ totalOfferedCop: 1_000_000 });
      typeInto(amountInput(), "$9.000.000");
      rerenderWith({ totalOfferedCop: 1_000_000, marginAmountCop: 0, readyForKam: false });
      expect(amountInput().value).toBe("$9.000.000");
    });

    it("keeps the text as typed when the saved value echoes back the same number", () => {
      const { rerenderWith } = setup({ totalOfferedCop: 1_000_000 });
      typeInto(totalInput(), "$32.000.000");
      wait(AUTOSAVE_MS);
      rerenderWith({ totalOfferedCop: 32_000_000 });
      expect(totalInput().value).toBe("$32.000.000");
    });
  });

  describe("gate to the KAM", () => {
    it("invalida readyForKam al editar el Valor Final después de haberlo marcado", () => {
      const { onUpdateCosting } = setup({ readyForKam: true, costingSentAt: "2026-01-10T00:00:00.000Z" });
      typeInto(totalInput(), "1500000");
      wait(AUTOSAVE_MS);
      expect(onUpdateCosting).toHaveBeenCalledWith(
        expect.objectContaining({ totalOfferedCop: 1_500_000, readyForKam: false, costingSentAt: undefined }),
      );
    });

    it("invalida readyForKam al editar el % de margen después de haberlo marcado", () => {
      const { onUpdateCosting } = setup({ readyForKam: true, costingSentAt: "2026-01-10T00:00:00.000Z" });
      fireEvent.click(screen.getByRole("button", { name: "35%" }));
      expect(onUpdateCosting).toHaveBeenCalledWith(
        expect.objectContaining({ expectedMarginPercent: 35, readyForKam: false }),
      );
    });

    it("NO invalida readyForKam al editar solo la nota de alcance", () => {
      const { onUpdateCosting } = setup({ readyForKam: true, costingSentAt: "2026-01-10T00:00:00.000Z" });
      fireEvent.click(screen.getByText(/Agregar nota de alcance/i));
      typeInto(screen.getByLabelText(/Nota de alcance comercial/i), "Ajuste acordado con el cliente");
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ readyForKam: true }));
    });

    it("editing the note does not push a value still being typed", () => {
      const { onUpdateCosting } = setup({ totalOfferedCop: 1_000_000 });
      typeInto(totalInput(), "9.000.000");
      fireEvent.click(screen.getByText(/Agregar nota de alcance/i));
      typeInto(screen.getByLabelText(/Nota de alcance comercial/i), "Ajuste");
      expect(onUpdateCosting).toHaveBeenCalledWith(expect.objectContaining({ totalOfferedCop: 1_000_000 }));
      expect(onUpdateCosting).not.toHaveBeenCalledWith(expect.objectContaining({ totalOfferedCop: 9_000_000 }));
    });
  });
});
