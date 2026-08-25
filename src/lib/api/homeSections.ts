import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export type HomeSectionType =
  | "hero"
  | "trending"
  | "new_release"
  | "continue_watching"
  | "for_you"
  | "collection"
  | "category"
  | "collections"
  | "categories"
  | "all";

export type HomeSectionSortBy =
  | "title_asc"
  | "title_desc"
  | "release_year_desc"
  | "release_year_asc"
  | "created_at_desc"
  | "created_at_asc";

export type HomeSection = {
  id: number;
  type: HomeSectionType;
  title: string;
  collectionId: number | null;
  collectionTitle: string | null;
  genreId: number | null;
  genreName: string | null;
  collectionIds: number[];
  collectionTitles: string[];
  genreIds: number[];
  genreNames: string[];
  sortBy: HomeSectionSortBy | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const getSections = () =>
  apiGet<{ sections: HomeSection[] }>("/home/sections/admin").then((r) => r.sections);

export const createSection = (body: {
  type: HomeSectionType;
  title: string;
  collectionId?: number;
  genreId?: number;
  collectionIds?: number[];
  genreIds?: number[];
  sortBy?: HomeSectionSortBy;
}) => apiPost<{ section: HomeSection }>("/home/sections/create", body as Record<string, unknown>);

export const updateSection = (
  id: number,
  body: {
    type?: HomeSectionType;
    title?: string;
    collectionId?: number | null;
    genreId?: number | null;
    collectionIds?: number[];
    genreIds?: number[];
    sortBy?: HomeSectionSortBy;
  },
) => apiPatch<{ section: HomeSection }>(`/home/sections/${id}/update`, body as Record<string, unknown>);

export const setSectionStatus = (id: number, isActive: boolean) =>
  apiPatch<{ section: HomeSection }>(`/home/sections/${id}/status`, { isActive });

export const reorderSection = (id: number, displayOrder: number) =>
  apiPatch<{ section: HomeSection }>(`/home/sections/${id}/reorder`, { displayOrder });

export const deleteSection = (id: number) => apiDelete(`/home/sections/${id}`);
