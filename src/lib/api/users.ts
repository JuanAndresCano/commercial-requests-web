import { apiRequest } from "./client";

export interface DirectoryUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
}

export interface PendingUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  azureOid: string | null;
  createdAt: string;
}

export interface DirectoryAdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  azureOid: string | null;
  roles: string[];
  createdAt: string;
}

export interface PreRegisterUserPayload {
  email: string;
  roleCode: "KAM" | "PRODUCT_LEADER";
  firstName?: string;
  lastName?: string;
}

export const usersApi = {
  /** Filter active users by role code (e.g. ?role=PROFESSOR or ?role=PRODUCT_LEADER). */
  findByRole: (role: string) => apiRequest<DirectoryUser[]>(`/users?role=${encodeURIComponent(role)}`),

  /** Lists all pending user requests in the approval queue (Admin only). */
  getPendingUsers: () => apiRequest<PendingUser[]>("/users/pending"),

  /** Lists all active users with their assigned roles (Admin only). */
  getUserDirectory: () => apiRequest<DirectoryAdminUser[]>("/users/directory"),

  /** Pre-registers a new collaborator or approves a pending request (Admin only). */
  preRegisterUser: (payload: PreRegisterUserPayload) =>
    apiRequest<{
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      roles: string[];
      status: "PRE_REGISTERED" | "APPROVED";
    }>("/users/pre-register", {
      method: "POST",
      body: payload,
    }),

  /** Approves a pending user request and assigns their operational role (Admin only). */
  approveUser: (userId: string, roleCode: "KAM" | "PRODUCT_LEADER") =>
    apiRequest<{
      success: boolean;
      message: string;
      id: string;
      email: string;
      role: string;
    }>(`/users/${userId}/approve`, {
      method: "POST",
      body: { roleCode },
    }),

  /** Rejects an access request and revokes session capabilities (Admin only). */
  rejectUser: (userId: string) =>
    apiRequest<{
      success: boolean;
      message: string;
      id: string;
    }>(`/users/${userId}/reject`, {
      method: "POST",
    }),
};
