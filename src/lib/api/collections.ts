import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { ContentType } from "./content";

export type Collection = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
};

export type CollectionItem = {
  itemId: number;
  contentId: number;
  title: string;
  slug: string;
  type: ContentType;
  description: string | null;
  posterUrl: string | null;
  bannerUrl: string | null;
  thumbnailUrl: string | null;
  logoUrl: string | null;
  releaseYear: number | null;
  ageRating: string | null;
  isFree: boolean;
  displayOrder: number;
};

export type ListCollectionsParams = {
  limit?: number;
  offset?: number;
  status?: "active" | "inactive" | "all";
  search?: string;
  order?: "asc" | "desc";
  orderBy?: "title" | "createdAt";
};

export const getCollections = (params: ListCollectionsParams = {}) =>
  apiGet<{ collections: Collection[]; total: number }>("/collection/admin", params as Record<string, unknown>);

export const createCollection = (body: { title: string; description?: string }) =>
  apiPost<{ collection: Collection }>("/collection/create", body as Record<string, unknown>);

export const updateCollection = (
  id: number,
  body: { title?: string; description?: string | null },
) => apiPatch<{ collection: Collection }>(`/collection/${id}/update`, body as Record<string, unknown>);

export const setCollectionStatus = (id: number, isActive: boolean) =>
  apiPatch<{ collection: Collection }>(`/collection/${id}/status`, { isActive });

export const deleteCollection = (id: number) => apiDelete(`/collection/${id}`);

export const getCollectionItems = (collectionId: number) =>
  apiGet<{ items: CollectionItem[] }>(`/collection/${collectionId}/items`).then((r) => r.items);

export const addCollectionItem = (collectionId: number, contentId: number) =>
  apiPost<{ item: { id: number } }>(`/collection/${collectionId}/items`, { contentId });

export const removeCollectionItem = (itemId: number) => apiDelete(`/collection/items/${itemId}`);

export const reorderCollectionItem = (itemId: number, displayOrder: number) =>
  apiPatch<{ item: { id: number; displayOrder: number } }>(`/collection/items/${itemId}/reorder`, { displayOrder });
