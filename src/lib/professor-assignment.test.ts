import { describe, it, expect } from "vitest";
import { canEditProfessor, assignProfessorWithHistory } from "@/lib/professor-assignment";

const NOW = "2026-01-15T10:00:00.000Z";

describe("canEditProfessor", () => {
  it("permite editar en 'nueva' y 'en-experto'", () => {
    expect(canEditProfessor("nueva")).toBe(true);
    expect(canEditProfessor("en-experto")).toBe(true);
  });

  it("bloquea la edición en 'en-costeo' y 'entregada'", () => {
    expect(canEditProfessor("en-costeo")).toBe(false);
    expect(canEditProfessor("entregada")).toBe(false);
  });
});

describe("assignProfessorWithHistory", () => {
  it("registra la primera asignación sin 'previousProfessor'", () => {
    const req = { id: "req-1", status: "nueva" as const, professorHistory: undefined };

    const result = assignProfessorWithHistory(req, "Dra. Paula Henao", "planta", undefined, "Laura Diaz", NOW);

    expect(result.professor).toBe("Dra. Paula Henao");
    expect(result.professorType).toBe("planta");
    expect(result.professorHistory).toHaveLength(1);
    expect(result.professorHistory[0]).toMatchObject({
      id: "req-1-doc1",
      previousProfessor: undefined,
      newProfessor: "Dra. Paula Henao",
      newProfessorType: "planta",
      changedBy: "Laura Diaz",
      changedAt: NOW,
      statusAtChange: "nueva",
    });
  });

  it("deja rastro del docente anterior al reemplazarlo, y numera la entrada siguiente", () => {
    const req = {
      id: "req-1",
      status: "en-costeo" as const,
      professor: "Dra. Paula Henao",
      professorType: "planta" as const,
      professorHistory: [
        {
          id: "req-1-doc1",
          newProfessor: "Dra. Paula Henao",
          newProfessorType: "planta" as const,
          changedBy: "Laura Diaz",
          changedAt: "2026-01-10T09:00:00.000Z",
          statusAtChange: "nueva" as const,
        },
      ],
    };

    const result = assignProfessorWithHistory(req, "Ing. Carlos Valencia", "externo", undefined, "Laura Diaz", NOW);

    expect(result.professorHistory).toHaveLength(2);
    expect(result.professorHistory[1]).toMatchObject({
      id: "req-1-doc2",
      previousProfessor: "Dra. Paula Henao",
      previousProfessorType: "planta",
      newProfessor: "Ing. Carlos Valencia",
      newProfessorType: "externo",
      statusAtChange: "en-costeo",
    });
    // La entrada anterior no se toca.
    expect(result.professorHistory[0]).toMatchObject({ id: "req-1-doc1", newProfessor: "Dra. Paula Henao" });
  });
});
