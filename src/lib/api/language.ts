import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export type Language = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LanguagesPage = { languages: Language[]; total: number };

export type ListLanguagesParams = {
  limit?: number;
  offset?: number;
  status?: "active" | "inactive" | "all";
  search?: string;
  order?: "asc" | "desc";
  orderBy?: "name" | "code" | "createdAt";
};

export const getLanguages = (params: ListLanguagesParams = {}) =>
  apiGet<LanguagesPage>("/content/language", params as Record<string, unknown>);

export const createLanguage = (body: { name: string; code: string; isActive?: boolean }) =>
  apiPost<{ language: Language }>("/content/language/create", body);

export const updateLanguage = (
  id: number,
  body: { name?: string; code?: string; isActive?: boolean },
) => apiPatch<{ language: Language }>(`/content/language/${id}/update`, body);

export const setLanguageStatus = (id: number, isActive: boolean) =>
  apiPatch<{ language: Language }>(`/content/language/${id}/status`, { isActive });

export const deleteLanguage = (id: number) => apiDelete(`/content/language/${id}`);
