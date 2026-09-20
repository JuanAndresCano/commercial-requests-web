import { RequestItem } from "@/lib/mock-data";

interface ReassignParams {
  newLeader: string;
  newNode?: string;
}

/**
 * Lógica compartida de reasignación de Líder de Producto (docs/11 —
 * Requisito 3). Antes vivía triplicada (RequestDetail, ProductLeaderDashboard
 * y una tercera copia muerta en Dashboard.tsx); se centraliza aquí para que
 * la regla de negocio no vuelva a divergir entre pantallas.
 *
 * Regla: si la solicitud reasignada estaba en "En proceso por experto", el
 * nuevo líder reinicia el flujo desde "Nueva" — incluida la asignación de
 * docente/profesor, que dejó de aplicar bajo el nuevo líder/nodo.
 */
export function useReassignRequest(
  updateRequest: (id: string, updates: Partial<RequestItem>) => void
) {
  return (request: RequestItem, { newLeader, newNode }: ReassignParams) => {
    const updates: Partial<RequestItem> = {
      productLeader: newLeader,
      node: newNode || request.node,
    };

    if (request.status === "en-experto") {
      updates.status = "nueva";
      updates.professor = undefined;
      updates.professorType = undefined;
      updates.externalProfessorData = undefined;
    }

    updateRequest(request.id, updates);
  };
}
