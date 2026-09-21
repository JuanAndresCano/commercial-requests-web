import { describe, it, expect } from "vitest";
import { openNegotiationRound, closeRoundForClientDelivery, rejectRoundWithObservations } from "@/lib/negotiation";
import type { NegotiationRound, ProposalCosting } from "@/lib/mock-data";

const NOW = "2026-01-15T10:00:00.000Z";

function makeCosting(overrides: Partial<ProposalCosting> = {}): ProposalCosting {
  return {
    marginAmountCop: 100_000,
    expectedMarginPercent: 30,
    proCulturaTaxPercent: 0,
    proCulturaTaxAmount: 0,
    totalOfferedCop: 1_000_000,
    readyForKam: false,
    ...overrides,
  };
}

function makeRound(overrides: Partial<NegotiationRound> = {}): NegotiationRound {
  return {
    id: "req-1-r1",
    roundNumber: 1,
    totalOfferedCop: 1_000_000,
    marginAmountCop: 100_000,
    expectedMarginPercent: 30,
    sentToKamAt: NOW,
    clientResponse: "pendiente",
    ...overrides,
  };
}

describe("openNegotiationRound", () => {
  it("abre la ronda 1 cuando no hay historial previo", () => {
    const req = {
      id: "req-1",
      costing: makeCosting(),
      participantes: "15 - 20",
      modalidad: "Virtual",
      horas: "40",
      type: "Capacitación" as const,
      necesidad: "Formación en liderazgo",
    };

    const result = openNegotiationRound(req, [], undefined, NOW);

    expect(result.negotiationRounds).toHaveLength(1);
    expect(result.negotiationRounds[0]).toMatchObject({
      id: "req-1-r1",
      roundNumber: 1,
      totalOfferedCop: 1_000_000,
      clientResponse: "pendiente",
      participantes: "15 - 20",
      modalidad: "Virtual",
    });
    expect(result.costing.readyForKam).toBe(true);
    expect(result.costing.costingSentAt).toBe(NOW);
  });

  it("numera correctamente la ronda 2 tras una ronda previa", () => {
    const req = {
      id: "req-1",
      costing: makeCosting({ totalOfferedCop: 1_200_000 }),
      type: "Consultoría" as const,
    };
    const previousRound = makeRound();

    const result = openNegotiationRound(req, [previousRound], "Ajuste por cambio de alcance", NOW);

    expect(result.negotiationRounds).toHaveLength(2);
    expect(result.negotiationRounds[1]).toMatchObject({
      id: "req-1-r2",
      roundNumber: 2,
      leaderNote: "Ajuste por cambio de alcance",
    });
  });

  it("descarta leaderNote vacía o solo espacios (queda undefined)", () => {
    const req = { id: "req-1", costing: makeCosting(), type: "Consultoría" as const };

    const result = openNegotiationRound(req, [], "   ", NOW);

    expect(result.negotiationRounds[0].leaderNote).toBeUndefined();
  });

  it("lanza error si no hay costing (no debería poder abrirse una ronda sin costeo)", () => {
    const req = { id: "req-1", costing: undefined, type: "Consultoría" as const };

    expect(() => openNegotiationRound(req, [], undefined, NOW)).toThrow();
  });
});

describe("closeRoundForClientDelivery", () => {
  it("cierra la última ronda pendiente con sentToClientAt", () => {
    const rounds = [makeRound()];

    const result = closeRoundForClientDelivery(rounds, NOW);

    expect(result[0].sentToClientAt).toBe(NOW);
  });

  it("cierra solo la última ronda pendiente, no las anteriores que también quedaron pendientes en el historial", () => {
    // Caso real advertido en el código: puede haber más de una ronda
    // "pendiente" en el historial (las que se reemplazaron sin llegar a
    // entregarse) — filtrar solo por clientResponse marcaría todas a la vez.
    const rounds = [
      makeRound({ id: "req-1-r1", roundNumber: 1, clientResponse: "pendiente" }),
      makeRound({ id: "req-1-r2", roundNumber: 2, clientResponse: "pendiente" }),
    ];

    const result = closeRoundForClientDelivery(rounds, NOW);

    expect(result[0].sentToClientAt).toBeUndefined();
    expect(result[1].sentToClientAt).toBe(NOW);
  });

  it("no toca una ronda ya rechazada aunque sea la última", () => {
    const rounds = [makeRound({ clientResponse: "rechazada", clientObservation: "faltó detalle" })];

    const result = closeRoundForClientDelivery(rounds, NOW);

    expect(result[0].sentToClientAt).toBeUndefined();
  });
});

describe("rejectRoundWithObservations", () => {
  it("marca la ronda vigente como rechazada con la observación del cliente", () => {
    const rounds = [makeRound({ sentToClientAt: NOW })];

    const result = rejectRoundWithObservations(rounds, makeCosting(), "Pidió cambiar la modalidad", NOW);

    expect(result.negotiationRounds[0]).toMatchObject({
      clientResponse: "rechazada",
      clientObservation: "Pidió cambiar la modalidad",
      clientRespondedAt: NOW,
    });
  });

  it("solo marca la última ronda pendiente cuando hay varias en el historial", () => {
    const rounds = [
      makeRound({ id: "req-1-r1", roundNumber: 1, clientResponse: "pendiente" }),
      makeRound({ id: "req-1-r2", roundNumber: 2, clientResponse: "pendiente", sentToClientAt: NOW }),
    ];

    const result = rejectRoundWithObservations(rounds, makeCosting(), "obs", NOW);

    expect(result.negotiationRounds[0].clientResponse).toBe("pendiente");
    expect(result.negotiationRounds[1].clientResponse).toBe("rechazada");
  });

  // Regresión del bug documentado en el commit 9f2b9e2: al devolver con
  // observaciones, el gate del Líder (readyForKam/costingSentAt) quedaba
  // con el valor del ciclo anterior y el botón "Enviar a cliente" del KAM
  // se re-habilitaba antes de que el Líder tocara nada.
  it("resetea readyForKam y costingSentAt del costeo tras devolver con observaciones", () => {
    const costing = makeCosting({ readyForKam: true, costingSentAt: "2026-01-10T00:00:00.000Z" });
    const rounds = [makeRound({ sentToClientAt: NOW })];

    const result = rejectRoundWithObservations(rounds, costing, "obs", NOW);

    expect(result.costing?.readyForKam).toBe(false);
    expect(result.costing?.costingSentAt).toBeUndefined();
  });

  it("no falla si no hay costing todavía (queda undefined)", () => {
    const rounds = [makeRound()];

    const result = rejectRoundWithObservations(rounds, undefined, "obs", NOW);

    expect(result.costing).toBeUndefined();
  });
});
