import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export type Genre = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GenresPage = { genres: Genre[]; total: number };

export type ListGenresParams = {
  limit?: number;
  offset?: number;
  status?: "active" | "inactive" | "all";
  search?: string;
  order?: "asc" | "desc";
  orderBy?: "name" | "createdAt";
};

export const getGenres = (params: ListGenresParams = {}) =>
  apiGet<GenresPage>("/content/genre", params as Record<string, unknown>);

export const createGenre = (body: { name: string; slug?: string; imageUrl?: string; isActive?: boolean }) =>
  apiPost<{ genre: Genre }>("/content/genre/create", body);

export const updateGenre = (
  id: number,
  body: { name?: string; slug?: string; imageUrl?: string | null; isActive?: boolean },
) => apiPatch<{ genre: Genre }>(`/content/genre/${id}/update`, body);

export const setGenreStatus = (id: number, isActive: boolean) =>
  apiPatch<{ genre: Genre }>(`/content/genre/${id}/status`, { isActive });

export const deleteGenre = (id: number) => apiDelete(`/content/genre/${id}`);
