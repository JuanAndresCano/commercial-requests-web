/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  MOCK_REQUESTS,
  RequestItem,
  RequestStatus,
  PRODUCT_LEADERS,
  KAMS,
  PROFESSORS,
  ProposalCosting,
  ProposalDocument,
  ExternalProfessorData,
  calculateCosting,
} from "@/lib/mock-data";

export type UserRole = "kam" | "lider-nodo" | "lider-producto" | "profesor";

export interface User {
  role: UserRole;
  roleLabel: string;
  name: string;
  email: string;
  node?: string;
}

export const ROLE_CONFIGS: Record<UserRole, { label: string; defaultName: string; defaultEmail: string; node?: string }> = {
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
  assignProfessor: (id: string, professorName: string) => void;
  assignProfessorDetailed: (
    id: string,
    professorName: string,
    type: "planta" | "externo",
    externalData?: ExternalProfessorData
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
          // Merge with mock defaults if costing or docs are missing
          return parsed.map((item: RequestItem) => {
            const mock = MOCK_REQUESTS.find((m) => m.id === item.id);
            const costing = item.costing ?? mock?.costing ?? calculateCosting(item.type, 14000000, 30, item.totalCostCop);
            const clientKamDocuments = item.clientKamDocuments ?? mock?.clientKamDocuments ?? [];
            const internalCostingDocuments = item.internalCostingDocuments ?? mock?.internalCostingDocuments ?? [];
            return {
              ...item,
              costing,
              clientKamDocuments,
              internalCostingDocuments,
              professorType: item.professorType ?? mock?.professorType ?? "planta",
              externalProfessorData: item.externalProfessorData ?? mock?.externalProfessorData,
              totalCostCop: item.costing?.totalOfferedCop ?? item.totalCostCop ?? costing.totalOfferedCop,
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
    const costing = item.costing ?? calculateCosting(item.type, 14000000, 30);
    const newReq: RequestItem = {
      ...item,
      id: newId,
      createdAt: new Date().toISOString().split("T")[0],
      costing,
      clientKamDocuments: item.clientKamDocuments ?? [],
      internalCostingDocuments: item.internalCostingDocuments ?? [],
      totalCostCop: costing.totalOfferedCop,
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
        return updated;
      })
    );
  };

  const assignProfessor = (id: string, professorName: string) => {
    updateRequest(id, { professor: professorName, professorType: "planta" });
  };

  const assignProfessorDetailed = (
    id: string,
    professorName: string,
    type: "planta" | "externo",
    externalData?: ExternalProfessorData
  ) => {
    updateRequest(id, {
      professor: professorName,
      professorType: type,
      externalProfessorData: externalData,
    });
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
      })
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
      })
    );
  };

  const updateStatus = (id: string, status: RequestStatus) => {
    updateRequest(id, { status });
  };

  const resetData = () => {
    setRequests(MOCK_REQUESTS);
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(MOCK_REQUESTS));
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
