import { apiGet, apiPatch } from "./client";

export type UserAccountStatus = "active" | "suspended";

export type AdminUser = {
  id: number;
  fullname: string | null;
  email: string | null;
  phone: string | null;
  accountStatus: UserAccountStatus;
  createdAt: string;
  planName: string | null;
  deviceCount: number;
  watchSeconds: number;
};

export type AdminListUsersParams = {
  limit?: number;
  offset?: number;
  status?: UserAccountStatus | "all";
  planId?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  order?: "asc" | "desc";
  orderBy?: "createdAt" | "fullname";
};

export const adminListUsers = (params: AdminListUsersParams = {}) =>
  apiGet<{ users: AdminUser[]; total: number }>("/user/admin", params as Record<string, unknown>);

export const setUserStatus = (id: number, status: UserAccountStatus) =>
  apiPatch<{ user: { id: number; accountStatus: UserAccountStatus } }>(`/user/admin/${id}/status`, { status });
