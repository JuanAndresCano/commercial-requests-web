import { isReadyForKamHandoff, type RequestItem, type RequestStatus } from "@/lib/mock-data";

/**
 * Stages as the dashboards label and group them. The real pipeline is
 * `nueva → en-experto → en-costeo → entregada` and has no state beyond those;
 * "enviada-kam" is derived on the client, only for the leader's board.
 */
export type BoardStage = RequestStatus | "enviada-kam";

type KamStageSource = Pick<RequestItem, "status" | "professor" | "costing">;
type LeaderStageSource = Pick<RequestItem, "status" | "costing">;

/** The four columns of the KAM board, in pipeline order. */
export const KAM_BOARD_STAGES: RequestStatus[] = ["nueva", "en-experto", "en-costeo", "entregada"];

// Commercial labels for the KAM: same pipeline, without the internal academic
// coordination vocabulary. "nueva" reads "Entregada al líder" (the KAM already
// handed it over); the leader keeps seeing "Nueva".
export const KAM_STAGE_LABELS: Record<RequestStatus, string> = {
  nueva: "Entregada al líder",
  "en-experto": "En Proceso",
  "en-costeo": "Lista para Entregar",
  entregada: "Entregada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

/**
 * Stage the KAM perceives (single source of truth for KPI cards, table and Kanban).
 *
 * - `nueva` without an assigned professor stays "Entregada al líder".
 * - `nueva` WITH a professor is already "En Proceso" (the real status stays `nueva`).
 * - `en-costeo` the leader has not sent to the KAM yet is still "En Proceso".
 * - `en-costeo` sent to the KAM is "Lista para Entregar".
 */
export function kamStageOf(r: KamStageSource): RequestStatus {
  if (r.status === "nueva" && Boolean(r.professor?.trim())) return "en-experto";
  if (r.status === "en-costeo" && !isReadyForKamHandoff(r)) return "en-experto";
  return r.status;
}

/**
 * Stage the product leader perceives: the real status, except that an `en-costeo`
 * request already sent to the KAM (`costing.readyForKam`) is "Enviada al KAM", so
 * the leader can tell it apart from one still being costed. "Entregada" keeps
 * meaning delivered to the client.
 */
export function leaderStageOf(r: LeaderStageSource): BoardStage {
  return isReadyForKamHandoff(r) ? "enviada-kam" : r.status;
}

export interface LeaderBoardStage {
  id: BoardStage;
  title: string;
  description: string;
}

/** The five columns of the leader board, in pipeline order. */
export const LEADER_BOARD_STAGES: LeaderBoardStage[] = [
  {
    id: "nueva",
    title: "Nueva",
    description: "Pendientes por revisar alcance y asignar docente de planta o externo",
  },
  {
    id: "en-experto",
    title: "En proceso por experto",
    description: "Docente formulando temática, cronograma y propuesta técnica",
  },
  {
    id: "en-costeo",
    title: "En proceso de costeo",
    description: "Simulación financiera, tarifas y cálculo de margen antes de entrega",
  },
  {
    id: "enviada-kam",
    title: "Enviada al KAM",
    description: "Costeo confirmado; el KAM la revisa y la entrega al cliente",
  },
  {
    id: "entregada",
    title: "Entregada",
    description: "Propuestas entregadas por el KAM a la empresa cliente",
  },
];

const EMPTY_STAGES: Record<BoardStage, never[]> = {
  nueva: [],
  "en-experto": [],
  "en-costeo": [],
  "enviada-kam": [],
  entregada: [],
  rechazada: [],
  cancelada: [],
};

/** Groups items by the stage `stageOf` gives them (one bucket per stage, always present). */
export function groupByStage<T>(items: T[], stageOf: (item: T) => BoardStage): Record<BoardStage, T[]> {
  const grouped = Object.fromEntries(Object.keys(EMPTY_STAGES).map((k) => [k, [] as T[]])) as Record<BoardStage, T[]>;
  for (const item of items) grouped[stageOf(item)]?.push(item);
  return grouped;
}

/** Counts items per stage, with the same rule that places them in the columns. */
export function countByStage<T>(items: T[], stageOf: (item: T) => BoardStage): Record<BoardStage, number> {
  const grouped = groupByStage(items, stageOf);
  return Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])) as Record<BoardStage, number>;
}
