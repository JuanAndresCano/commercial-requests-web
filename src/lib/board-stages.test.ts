import { describe, expect, it } from "vitest";
import type { RequestItem } from "@/lib/mock-data";
import {
  KAM_BOARD_STAGES,
  KAM_STAGE_LABELS,
  LEADER_BOARD_STAGES,
  countByStage,
  groupByStage,
  kamStageOf,
  leaderStageOf,
} from "./board-stages";

type StageSource = Pick<RequestItem, "status" | "professor" | "costing">;

const costing = (readyForKam: boolean): NonNullable<RequestItem["costing"]> => ({
  readyForKam,
  totalOfferedCop: 1,
  expectedMarginPercent: 0,
  marginAmountCop: 0,
  proCulturaTaxPercent: 0,
  proCulturaTaxAmount: 0,
});

describe("kamStageOf", () => {
  it("keeps a new request WITHOUT a professor in 'Entregada al líder'", () => {
    expect(kamStageOf({ status: "nueva" })).toBe("nueva");
    expect(kamStageOf({ status: "nueva", professor: "" })).toBe("nueva");
    expect(kamStageOf({ status: "nueva", professor: "   " })).toBe("nueva");
    expect(KAM_STAGE_LABELS.nueva).toBe("Entregada al líder");
  });

  it("moves a new request to 'En Proceso' as soon as it has a professor, though the real status stays nueva", () => {
    expect(kamStageOf({ status: "nueva", professor: "Dra. Paula Henao" })).toBe("en-experto");
    expect(KAM_STAGE_LABELS["en-experto"]).toBe("En Proceso");
  });

  it("keeps en-experto in 'En Proceso'", () => {
    expect(kamStageOf({ status: "en-experto", professor: "Dra. Paula Henao" })).toBe("en-experto");
  });

  it("shows en-costeo as 'En Proceso' until the leader sends it to the KAM", () => {
    expect(kamStageOf({ status: "en-costeo", costing: costing(false) })).toBe("en-experto");
    expect(kamStageOf({ status: "en-costeo" })).toBe("en-experto");
  });

  it("shows en-costeo as 'Lista para Entregar' once the leader sent it to the KAM", () => {
    expect(kamStageOf({ status: "en-costeo", costing: costing(true) })).toBe("en-costeo");
    expect(KAM_STAGE_LABELS["en-costeo"]).toBe("Lista para Entregar");
  });

  it("leaves delivered, rejected and cancelled untouched", () => {
    expect(kamStageOf({ status: "entregada" })).toBe("entregada");
    expect(kamStageOf({ status: "rechazada" })).toBe("rechazada");
    expect(kamStageOf({ status: "cancelada" })).toBe("cancelada");
  });

  it("exposes the four KAM columns in pipeline order", () => {
    expect(KAM_BOARD_STAGES).toEqual(["nueva", "en-experto", "en-costeo", "entregada"]);
  });
});

describe("leaderStageOf", () => {
  it("leaves a new request as 'nueva' for the leader, with or without professor", () => {
    expect(leaderStageOf({ status: "nueva" })).toBe("nueva");
    expect(leaderStageOf({ status: "nueva", professor: "Dra. Paula Henao" } as StageSource)).toBe("nueva");
  });

  it("leaves en-experto as is", () => {
    expect(leaderStageOf({ status: "en-experto" })).toBe("en-experto");
  });

  it("keeps en-costeo while the leader is still costing", () => {
    expect(leaderStageOf({ status: "en-costeo" })).toBe("en-costeo");
    expect(leaderStageOf({ status: "en-costeo", costing: costing(false) })).toBe("en-costeo");
  });

  it("derives 'enviada-kam' from en-costeo with readyForKam", () => {
    expect(leaderStageOf({ status: "en-costeo", costing: costing(true) })).toBe("enviada-kam");
  });

  it("does not derive 'enviada-kam' for other statuses, even with readyForKam set", () => {
    expect(leaderStageOf({ status: "entregada", costing: costing(true) })).toBe("entregada");
    expect(leaderStageOf({ status: "en-experto", costing: costing(true) })).toBe("en-experto");
  });

  it("exposes five leader columns with 'Enviada al KAM' between costing and delivered", () => {
    expect(LEADER_BOARD_STAGES.map((s) => s.id)).toEqual([
      "nueva",
      "en-experto",
      "en-costeo",
      "enviada-kam",
      "entregada",
    ]);
    expect(LEADER_BOARD_STAGES.find((s) => s.id === "nueva")?.title).toBe("Nueva");
    expect(LEADER_BOARD_STAGES.find((s) => s.id === "enviada-kam")?.title).toBe("Enviada al KAM");
    expect(LEADER_BOARD_STAGES.find((s) => s.id === "entregada")?.title).toBe("Entregada");
  });
});

describe("groupByStage / countByStage", () => {
  const items = [
    { id: "a", status: "nueva" as const },
    { id: "b", status: "nueva" as const, professor: "X" },
    { id: "c", status: "en-costeo" as const, costing: costing(true) },
    { id: "d", status: "en-costeo" as const, costing: costing(false) },
  ];

  it("groups by the KAM stage so each column matches its counter", () => {
    const grouped = groupByStage(items, kamStageOf);
    expect(grouped.nueva.map((i) => i.id)).toEqual(["a"]);
    expect(grouped["en-experto"].map((i) => i.id)).toEqual(["b", "d"]);
    expect(grouped["en-costeo"].map((i) => i.id)).toEqual(["c"]);
    expect(countByStage(items, kamStageOf)["en-experto"]).toBe(2);
  });

  it("groups by the leader stage, splitting 'Enviada al KAM' out of costing", () => {
    const grouped = groupByStage(items, leaderStageOf);
    expect(grouped.nueva.map((i) => i.id)).toEqual(["a", "b"]);
    expect(grouped["en-costeo"].map((i) => i.id)).toEqual(["d"]);
    expect(grouped["enviada-kam"].map((i) => i.id)).toEqual(["c"]);
    expect(countByStage(items, leaderStageOf)["enviada-kam"]).toBe(1);
  });
});
