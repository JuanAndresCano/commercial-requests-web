import { apiRequest } from "./client";

export interface DirectoryUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
}

export const usersApi = {
  /** PRODUCT_LEADER / ADMIN only (backend restricts the whole controller). */
  findByRole: (role: string) => apiRequest<DirectoryUser[]>(`/users?role=${encodeURIComponent(role)}`),
};
