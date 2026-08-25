import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export type Person = {
  id: number;
  name: string;
  slug: string;
  photoUrl: string | null;
  bio: string | null;
  bornDate: string | null;
  nationality: string | null;
  roleIds: number[];
  createdAt: string;
  updatedAt: string;
};

export type PersonsPage = { persons: Person[]; total: number };

export type ListPersonsParams = {
  limit?: number;
  offset?: number;
  search?: string;
  order?: "asc" | "desc";
  orderBy?: "name" | "createdAt";
};

export type PersonInput = {
  name: string;
  photoUrl?: string;
  bio?: string;
  bornDate?: string;
  nationality?: string;
  roleIds?: number[];
};

export const getPersons = (params: ListPersonsParams = {}) =>
  apiGet<PersonsPage>("/content/person", params as Record<string, unknown>);

export const createPerson = (body: PersonInput) =>
  apiPost<{ person: Person }>("/content/person/create", body as Record<string, unknown>);

export const updatePerson = (id: number, body: Partial<PersonInput>) =>
  apiPatch<{ person: Person }>(`/content/person/${id}/update`, body as Record<string, unknown>);

export const deletePerson = (id: number) => apiDelete(`/content/person/${id}`);
