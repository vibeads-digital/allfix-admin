import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export type Role = {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RolesPage = { roles: Role[]; total: number };

export type ListRolesParams = {
  limit?: number;
  offset?: number;
  status?: "active" | "inactive" | "all";
  search?: string;
  order?: "asc" | "desc";
  orderBy?: "name" | "createdAt";
};

export const getRoles = (params: ListRolesParams = {}) =>
  apiGet<RolesPage>("/content/role", params as Record<string, unknown>);

export const createRole = (body: { name: string; slug?: string; isActive?: boolean }) =>
  apiPost<{ role: Role }>("/content/role/create", body);

export const updateRole = (
  id: number,
  body: { name?: string; slug?: string; isActive?: boolean },
) => apiPatch<{ role: Role }>(`/content/role/${id}/update`, body);

export const setRoleStatus = (id: number, isActive: boolean) =>
  apiPatch<{ role: Role }>(`/content/role/${id}/status`, { isActive });

export const deleteRole = (id: number) => apiDelete(`/content/role/${id}`);
