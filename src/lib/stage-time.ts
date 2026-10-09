import { KAM_BOARD_STAGES, KAM_STAGE_LABELS, LEADER_BOARD_STAGES, type BoardStage } from "@/lib/board-stages";
import type { RequestItem, RequestStatus } from "@/lib/mock-data";

/** Whose stages the "Tiempo por etapa" section lists (the labels differ, see board-stages). */
export type StageTimeRole = "kam" | "leader";

/** What the calculation reads from a request (all of it comes from the detail). */
export type StageTimeSource = Pick<RequestItem, "statusHistory" | "professorHistory" | "negotiationRounds">;

export interface StageTimeRow {
  stage: BoardStage;
  label: string;
  /** Whole days accumulated in the stage; `null` when the request never reached it. */
  days: number | null;
  /** The stage the request is in now. */
  current: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface Piece {
  stage: BoardStage;
  start: number;
  end: number;
}

/** First instant in [start, end) among `instants`, or `undefined`. */
function firstWithin(instants: number[], start: number, end: number): number | undefined {
  return instants.filter((t) => t >= start && t < end).sort((a, b) => a - b)[0];
}

/** Splits one stretch of a real status into the stage(s) the role sees (null: not a board stage). */
function piecesOf(
  status: RequestStatus,
  start: number,
  end: number,
  role: StageTimeRole,
  professorAt: number[],
  sentToKamAt: number[],
): Piece[] {
  const split = (marker: number | undefined, before: BoardStage, after: BoardStage): Piece[] =>
    marker === undefined
      ? [{ stage: before, start, end }]
      : [
          { stage: before, start, end: marker },
          { stage: after, start: marker, end },
        ];

  switch (status) {
    case "nueva":
      // The KAM sees "En Proceso" from the moment a professor is assigned (kamStageOf); the leader, "Nueva".
      return role === "kam"
        ? split(firstWithin(professorAt, start, end), "nueva", "en-experto")
        : [{ stage: "nueva", start, end }];
    case "en-experto":
      return [{ stage: "en-experto", start, end }];
    case "en-costeo":
      // Costing is still "En Proceso" for the KAM until the leader presses "Enviar a KAM"
      // (the round's `sentToKamAt`); the leader tells "En costeo" from "Enviada al KAM".
      return role === "kam"
        ? split(firstWithin(sentToKamAt, start, end), "en-experto", "en-costeo")
        : split(firstWithin(sentToKamAt, start, end), "en-costeo", "enviada-kam");
    case "entregada":
      return [{ stage: "entregada", start, end }];
    default:
      // Rejected and cancelled are not stages of the board.
      return [];
  }
}

/**
 * Days ACCUMULATED in each stage of the role, from the status history and the current date (the open
 * stretch counts up to `now`). A request the client returned adds its repeated stretches of the same stage.
 *
 * The milestones inside a status that the history does not record come from other data of the detail: the
 * professor assignment (KAM's "En Proceso") and the rounds' `sentToKamAt` ("Lista para Entregar" / "Enviada al
 * KAM"). Milliseconds are summed first and rounded down at the end.
 *
 * Returns `null` when there is no usable history (a mock request, or a backend that does not send it).
 */
export function getStageTimes(
  req: StageTimeSource,
  role: StageTimeRole,
  now: Date = new Date(),
): StageTimeRow[] | null {
  const history = (req.statusHistory ?? [])
    .map((entry, index) => ({ ...entry, at: Date.parse(entry.changedAt), index }))
    .filter((entry) => Number.isFinite(entry.at))
    .sort((a, b) => a.at - b.at || a.index - b.index);
  if (history.length === 0) return null;

  const professorAt = (req.professorHistory ?? []).map((e) => Date.parse(e.changedAt)).filter(Number.isFinite);
  const sentToKamAt = (req.negotiationRounds ?? []).map((r) => Date.parse(r.sentToKamAt)).filter(Number.isFinite);

  // The open stretch (the last status) runs up to now.
  const openEnd = Math.max(now.getTime(), history[history.length - 1].at);
  const pieces = history.flatMap((entry, i) => {
    const end = history[i + 1]?.at ?? openEnd;
    return piecesOf(entry.status, entry.at, end, role, professorAt, sentToKamAt);
  });

  const totalMs = new Map<BoardStage, number>();
  for (const piece of pieces) totalMs.set(piece.stage, (totalMs.get(piece.stage) ?? 0) + (piece.end - piece.start));
  const lastPiece = pieces[pieces.length - 1];
  const currentStage = lastPiece?.end === openEnd ? lastPiece.stage : undefined;

  const stages: { id: BoardStage; label: string }[] =
    role === "kam"
      ? KAM_BOARD_STAGES.map((id) => ({ id, label: KAM_STAGE_LABELS[id as RequestStatus] }))
      : LEADER_BOARD_STAGES.map((s) => ({ id: s.id, label: s.title }));

  return stages.map(({ id, label }) => ({
    stage: id,
    label,
    days: totalMs.has(id) ? Math.floor((totalMs.get(id) ?? 0) / DAY_MS) : null,
    current: id === currentStage,
  }));
}

/** Text of a stage's accumulated days: "—" when never reached, "menos de 1 día", "1 día", "N días". */
export function formatStageDays(days: number | null): string {
  if (days === null) return "—";
  if (days < 1) return "menos de 1 día";
  if (days === 1) return "1 día";
  return `${days} días`;
}
