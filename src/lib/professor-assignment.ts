import {
  type ExternalProfessorData,
  type ProfessorAssignmentLogEntry,
  type RequestItem,
  type RequestStatus,
} from "@/lib/mock-data";

/**
 * Lógica pura de la asignación de docente/asesor, extraída de `AuthContext` y
 * `RequestDetail.tsx` para poder testearla sin montar componentes.
 *
 * Hallazgo (2026-09-25, probando en vivo): el docente se podía cambiar en
 * cualquier estado de la solicitud, sin dejar ningún registro — a diferencia
 * del costeo, que sí abre una ronda de negociación por cada cambio. Una vez
 * la solicitud sale de "En proceso por experto", el proceso ya avanzó
 * asumiendo ese docente (costeo, coordinación con el cliente); cambiarlo
 * después sin dejar rastro puede dejar al Líder o al KAM trabajando sobre un
 * supuesto que ya no es cierto. Regla aplicada: el campo se puede editar
 * mientras la solicitud esté en "nueva" o "en-experto"; una vez pasa a
 * "en-costeo" o "entregada" queda bloqueado, y todo cambio (en cualquier
 * momento en que fue posible) queda en `professorHistory`.
 */

/** El docente/asesor solo es editable antes de que el costeo arranque. */
export function canEditProfessor(status: RequestStatus): boolean {
  return status === "nueva" || status === "en-experto";
}

export interface AssignProfessorResult {
  professor: string;
  professorType: "planta" | "externo";
  externalProfessorData: ExternalProfessorData | undefined;
  professorHistory: ProfessorAssignmentLogEntry[];
}

/**
 * Construye el nuevo estado del docente/asesor asignado más su historial
 * actualizado. No decide si el cambio está permitido — eso es
 * `canEditProfessor`; quien llama (UI o defensa en el handler) debe
 * verificarlo antes.
 */
export function assignProfessorWithHistory(
  req: Pick<RequestItem, "id" | "status" | "professor" | "professorType" | "professorHistory">,
  professorName: string,
  type: "planta" | "externo",
  externalData: ExternalProfessorData | undefined,
  changedBy: string,
  now: string = new Date().toISOString(),
): AssignProfessorResult {
  const previousHistory = req.professorHistory ?? [];
  const entry: ProfessorAssignmentLogEntry = {
    id: `${req.id}-doc${previousHistory.length + 1}`,
    previousProfessor: req.professor,
    previousProfessorType: req.professorType,
    newProfessor: professorName,
    newProfessorType: type,
    changedBy,
    changedAt: now,
    statusAtChange: req.status,
  };

  return {
    professor: professorName,
    professorType: type,
    externalProfessorData: externalData,
    professorHistory: [...previousHistory, entry],
  };
}
