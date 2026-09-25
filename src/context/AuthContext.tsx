import React, { createContext, useContext, useState, useEffect } from "react";
import {
  MOCK_REQUESTS,
  RequestItem,
  RequestStatus,
  ProposalCosting,
  ProposalDocument,
  ExternalProfessorData,
} from "@/lib/mock-data";
import { assignProfessorWithHistory } from "@/lib/professor-assignment";

export type UserRole = "kam" | "lider-nodo" | "lider-producto" | "profesor";

export interface User {
  role: UserRole;
  roleLabel: string;
  name: string;
  email: string;
  node?: string;
}

export const ROLE_CONFIGS: Record<
  UserRole,
  { label: string; defaultName: string; defaultEmail: string; node?: string }
> = {
  kam: {
    label: "KAM",
    defaultName: "Andrea Martínez",
    defaultEmail: "andrea.martinez@icesi.edu.co",
  },
  "lider-producto": {
    label: "Líder de Producto",
    defaultName: "Juan Pablo Corrales Arenas",
    defaultEmail: "juanpablo.corrales@icesi.edu.co",
    node: "Inteligencia Artificial y Tecnologías Digitales",
  },
  "lider-nodo": {
    label: "Líder de Nodo",
    defaultName: "Carlos Riveros",
    defaultEmail: "carlos.riveros@icesi.edu.co",
    node: "Competitividad Organizacional, Economías Creativas",
  },
  profesor: {
    label: "Profesor",
    defaultName: "Dr. Ricardo Mejía",
    defaultEmail: "ricardo.mejia@icesi.edu.co",
  },
};

const STORAGE_KEY_USER = "icesi_auth_user_v3";
const STORAGE_KEY_REQUESTS = "icesi_requests_data_v3";

interface AuthContextType {
  user: User;
  login: (role: UserRole, customName?: string, customEmail?: string) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  requests: RequestItem[];
  addRequest: (item: Omit<RequestItem, "id" | "createdAt">) => RequestItem;
  updateRequest: (id: string, updates: Partial<RequestItem>) => void;
  deleteRequest: (id: string) => void;
  assignProfessor: (id: string, professorName: string) => void;
  assignProfessorDetailed: (
    id: string,
    professorName: string,
    type: "planta" | "externo",
    externalData?: ExternalProfessorData,
  ) => void;
  updateCosting: (id: string, costing: ProposalCosting) => void;
  addDocument: (id: string, doc: ProposalDocument) => void;
  removeDocument: (id: string, docId: string, category: "client_kam" | "internal_costing") => void;
  updateStatus: (id: string, status: RequestStatus) => void;
  resetData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    const defaultCfg = ROLE_CONFIGS["kam"];
    return {
      role: "kam",
      roleLabel: defaultCfg.label,
      name: defaultCfg.defaultName,
      email: defaultCfg.defaultEmail,
      node: defaultCfg.node,
    };
  });

  const [requests, setRequests] = useState<RequestItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with any new mock requests not yet in local storage
          const existingIds = new Set(parsed.map((p: RequestItem) => p.id));
          const missingMocks = MOCK_REQUESTS.filter((m) => !existingIds.has(m.id));
          const combined = [...parsed, ...missingMocks];

          return combined.map((item: RequestItem) => {
            const mock = MOCK_REQUESTS.find((m) => m.id === item.id);
            // No se fabrica un costeo por defecto: si ni el registro guardado
            // ni el mock traen uno, la solicitud sigue sin costear.
            const costing = item.costing ?? mock?.costing;
            const clientKamDocuments = item.clientKamDocuments ?? mock?.clientKamDocuments ?? [];
            const internalCostingDocuments = item.internalCostingDocuments ?? mock?.internalCostingDocuments ?? [];
            return {
              ...item,
              costing,
              clientKamDocuments,
              internalCostingDocuments,
              professorType: item.professorType ?? mock?.professorType ?? "planta",
              externalProfessorData: item.externalProfessorData ?? mock?.externalProfessorData,
              totalCostCop: item.totalCostCop ?? costing?.totalOfferedCop,
            };
          });
        }
      }
    } catch {
      // Fallback
    }
    return MOCK_REQUESTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
    } catch {
      // Ignore storage errors
    }
  }, [requests]);

  const login = (role: UserRole, customName?: string, customEmail?: string) => {
    const config = ROLE_CONFIGS[role] ?? ROLE_CONFIGS["kam"];
    const newUser: User = {
      role,
      roleLabel: config.label,
      name: customName || config.defaultName,
      email: customEmail || config.defaultEmail,
      node: config.node,
    };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
  };

  const switchRole = (role: UserRole) => {
    login(role);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY_USER);
    const defaultCfg = ROLE_CONFIGS["kam"];
    setUser({
      role: "kam",
      roleLabel: defaultCfg.label,
      name: defaultCfg.defaultName,
      email: defaultCfg.defaultEmail,
    });
  };

  const addRequest = (item: Omit<RequestItem, "id" | "createdAt">): RequestItem => {
    const newId = `REQ-2026-${String(requests.length + 145).padStart(4, "0")}`;
    const newReq: RequestItem = {
      ...item,
      id: newId,
      createdAt: new Date().toISOString().split("T")[0],
      // Arranca el reloj de "tiempo en esta fase" desde el instante en que
      // se crea (siempre en "nueva").
      statusUpdatedAt: new Date().toISOString(),
      // El costeo es responsabilidad exclusiva del Líder de Producto — una
      // solicitud recién creada por el KAM nunca debe llegar con un precio
      // ya calculado. Se queda sin definir hasta que el Líder lo guarde.
      costing: item.costing,
      clientKamDocuments: item.clientKamDocuments ?? [],
      internalCostingDocuments: item.internalCostingDocuments ?? [],
      totalCostCop: item.totalCostCop,
    };
    setRequests((prev) => [newReq, ...prev]);
    return newReq;
  };

  const updateRequest = (id: string, updates: Partial<RequestItem>) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };
        if (updates.costing) {
          updated.totalCostCop = updates.costing.totalOfferedCop;
        }
        // Se marca automáticamente aquí (no en cada pantalla que cambia el
        // estado) para que "tiempo en esta fase" sea correcto sin importar
        // si el cambio vino de updateStatus, de "Entregar" o de "Devolver
        // con observaciones".
        if (updates.status && updates.status !== r.status) {
          updated.statusUpdatedAt = new Date().toISOString();
        }
        return updated;
      }),
    );
  };

  const deleteRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const assignProfessor = (id: string, professorName: string) => {
    updateRequest(id, { professor: professorName, professorType: "planta" });
  };

  const assignProfessorDetailed = (
    id: string,
    professorName: string,
    type: "planta" | "externo",
    externalData?: ExternalProfessorData,
  ) => {
    const current = requests.find((r) => r.id === id);
    if (!current) return;
    updateRequest(id, assignProfessorWithHistory(current, professorName, type, externalData, user.name));
  };

  const updateCosting = (id: string, costing: ProposalCosting) => {
    updateRequest(id, {
      costing,
      totalCostCop: costing.totalOfferedCop,
    });
  };

  const addDocument = (id: string, doc: ProposalDocument) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (doc.category === "client_kam") {
          return {
            ...r,
            clientKamDocuments: [doc, ...(r.clientKamDocuments ?? [])],
          };
        } else {
          return {
            ...r,
            internalCostingDocuments: [doc, ...(r.internalCostingDocuments ?? [])],
          };
        }
      }),
    );
  };

  const removeDocument = (id: string, docId: string, category: "client_kam" | "internal_costing") => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (category === "client_kam") {
          return {
            ...r,
            clientKamDocuments: (r.clientKamDocuments ?? []).filter((d) => d.id !== docId),
          };
        } else {
          return {
            ...r,
            internalCostingDocuments: (r.internalCostingDocuments ?? []).filter((d) => d.id !== docId),
          };
        }
      }),
    );
  };

  const updateStatus = (id: string, status: RequestStatus) => {
    updateRequest(id, { status });
  };

  const resetData = () => {
    setRequests(MOCK_REQUESTS);
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(MOCK_REQUESTS));

    // También limpia los filtros/vistas persistidas de los tableros
    // (usePersistentState) — si no, un filtro que quedó activo (ej. "Sin
    // docente") sigue ocultando todo después del reset, sin ninguna pista de
    // por qué, aunque los datos ya se hayan restablecido correctamente.
    const uiStatePrefixes = ["icesi_kam_dashboard_", "icesi_lp_dashboard_"];
    Object.keys(localStorage)
      .filter((key) => uiStatePrefixes.some((prefix) => key.startsWith(prefix)))
      .forEach((key) => localStorage.removeItem(key));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        switchRole,
        logout,
        requests,
        addRequest,
        updateRequest,
        deleteRequest,
        assignProfessor,
        assignProfessorDetailed,
        updateCosting,
        addDocument,
        removeDocument,
        updateStatus,
        resetData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
