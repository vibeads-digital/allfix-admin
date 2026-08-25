import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client";

export type ContentType = "movie" | "series";
export type ContentStatus = "draft" | "published" | "archived";

export type ContentListItem = {
  id: number;
  title: string;
  slug: string;
  type: ContentType;
  status: ContentStatus;
  isFree: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isNewRelease: boolean;
  isComingSoon: boolean;
  releaseYear: number | null;
  ageRating: string | null;
  durationMinutes: number | null;
  posterUrl: string | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
  genreNames: string | null;
  languageNames: string | null;
};

export type ContentLanguageLink = { languageId: number; isPrimary: boolean };

export type ContentCastMember = {
  id: number;
  personId: number;
  personName: string;
  personPhotoUrl: string | null;
  roleId: number;
  roleName: string;
  characterName: string | null;
  displayOrder: number;
};

// Full row, including fields the lightweight list view omits (e.g. description),
// plus the genre/language/cast relations joined in by the server.
export type ContentDetail = ContentListItem & {
  description: string | null;
  logoUrl: string | null;
  genreIds: number[];
  languages: ContentLanguageLink[];
  cast: ContentCastMember[];
  mainVideoUrl: string | null;
  trailerUrl: string | null;
  mainVideoSourceId: number | null;
  trailerVideoSourceId: number | null;
};

export type CreateContentInput = {
  title: string;
  type: ContentType;
  description?: string;
  releaseYear?: number;
  ageRating?: string;
  isFree?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewRelease?: boolean;
  isComingSoon?: boolean;
  posterUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  logoUrl?: string | null;
  durationMinutes?: number;
};

export type Season = {
  id: number;
  contentId: number;
  seasonNumber: number;
  title: string | null;
  description: string | null;
  releaseYear: number | null;
  posterUrl: string | null;
  bannerUrl: string | null;
  isActive: boolean;
};

export type Episode = {
  id: number;
  seasonId: number;
  episodeNumber: number;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  thumbnailUrl: string | null;
  airDate: string | null;
  isFree: boolean;
  isActive: boolean;
};

export type AdminListContentParams = {
  limit?: number;
  offset?: number;
  type?: ContentType | "all";
  status?: ContentStatus | "all";
  genreId?: number;
  languageId?: number;
  search?: string;
  order?: "asc" | "desc";
  orderBy?: "createdAt" | "releaseYear" | "title";
};

export const adminListContent = (params: AdminListContentParams = {}) =>
  apiGet<{ contents: ContentListItem[]; total: number }>("/content/admin", params as Record<string, unknown>);

export const adminGetContent = (id: number) =>
  apiGet<{ content: ContentDetail }>(`/content/admin/${id}`).then((r) => r.content);

export const createContent = (body: CreateContentInput) =>
  apiPost<{ content: ContentListItem }>("/content/create", body as Record<string, unknown>);

export const updateContent = (id: number, body: Partial<Omit<CreateContentInput, "type">>) =>
  apiPatch<{ content: ContentListItem }>(`/content/${id}/update`, body as Record<string, unknown>);

export const setContentStatus = (id: number, status: ContentStatus) =>
  apiPatch<{ content: ContentListItem }>(`/content/${id}/status`, { status });

export const deleteContent = (id: number) => apiDelete(`/content/${id}`);

// ─── Genres / Languages / Cast ──────────────────────────────────────────────

export const setContentGenres = (contentId: number, genreIds: number[]) =>
  apiPut(`/content/${contentId}/genres`, { genreIds });

export const removeContentGenre = (contentId: number, genreId: number) =>
  apiDelete(`/content/${contentId}/genres/${genreId}`);

export const setContentLanguages = (contentId: number, languages: ContentLanguageLink[]) =>
  apiPut(`/content/${contentId}/languages`, { languages });

export const removeContentLanguage = (contentId: number, languageId: number) =>
  apiDelete(`/content/${contentId}/languages/${languageId}`);

export const addContentCast = (
  contentId: number,
  body: { personId: number; roleId: number; characterName?: string; displayOrder?: number },
) => apiPost(`/content/${contentId}/cast`, body);

export const removeContentCast = (castId: number) => apiDelete(`/content/cast/${castId}`);

export const getSeasons = (contentId: number) =>
  apiGet<{ seasons: Season[] }>(`/content/${contentId}/seasons`).then((r) => r.seasons);

// Admin variants bypass the public published/isActive filters, so drafts and
// inactive seasons/episodes stay visible while managing them.
export const adminGetSeasons = (contentId: number) =>
  apiGet<{ seasons: Season[] }>(`/content/admin/${contentId}/seasons`).then((r) => r.seasons);

export type AdminEpisode = Episode & {
  mainVideoUrl: string | null;
  mainVideoSourceId: number | null;
};

export const adminGetEpisodes = (seasonId: number) =>
  apiGet<{ episodes: AdminEpisode[] }>(`/content/admin/seasons/${seasonId}/episodes`).then((r) => r.episodes);

export const createSeason = (
  contentId: number,
  body: {
    seasonNumber: number;
    title?: string;
    description?: string;
    releaseYear?: number;
    posterUrl?: string;
    bannerUrl?: string;
  },
) => apiPost<{ season: Season }>(`/content/${contentId}/seasons`, body);

export const updateSeason = (
  seasonId: number,
  body: {
    title?: string | null;
    description?: string | null;
    releaseYear?: number | null;
    posterUrl?: string | null;
    bannerUrl?: string | null;
    isActive?: boolean;
  },
) => apiPatch<{ season: Season }>(`/content/seasons/${seasonId}`, body);

export const deleteSeason = (seasonId: number) => apiDelete(`/content/seasons/${seasonId}`);

export const getEpisodes = (seasonId: number) =>
  apiGet<{ episodes: Episode[] }>(`/content/seasons/${seasonId}/episodes`).then((r) => r.episodes);

export const createEpisode = (
  seasonId: number,
  body: {
    episodeNumber: number;
    title: string;
    description?: string;
    durationMinutes?: number;
    thumbnailUrl?: string;
    airDate?: string;
    isFree?: boolean;
  },
) => apiPost<{ episode: Episode }>(`/content/seasons/${seasonId}/episodes`, body);

export const updateEpisode = (
  episodeId: number,
  body: {
    title?: string;
    description?: string | null;
    durationMinutes?: number | null;
    thumbnailUrl?: string | null;
    airDate?: string | null;
    isFree?: boolean;
    isActive?: boolean;
  },
) => apiPatch<{ episode: Episode }>(`/content/episodes/${episodeId}`, body);

export const deleteEpisode = (episodeId: number) => apiDelete(`/content/episodes/${episodeId}`);

export type VideoQuality = "sd" | "hd" | "fhd" | "2k" | "4k";
export type VideoSourceType = "main" | "trailer" | "teaser";

export type VideoSource = {
  id: number;
  contentId: number | null;
  episodeId: number | null;
  type: VideoSourceType;
  quality: VideoQuality;
  bunnyVideoId: string;
  hlsUrl: string;
  isActive: boolean;
};

export const attachExternalContentVideo = (
  contentId: number,
  body: { type: VideoSourceType; quality?: VideoQuality; hlsUrl: string; streamUrl?: string },
) => apiPost<{ source: VideoSource }>(`/content/${contentId}/videos/external`, body);

export const attachExternalEpisodeVideo = (
  episodeId: number,
  body: { type: VideoSourceType; quality?: VideoQuality; hlsUrl: string; streamUrl?: string },
) => apiPost<{ source: VideoSource }>(`/content/episodes/${episodeId}/videos/external`, body);

export const getVideoSourceStatus = (videoSourceId: number) =>
  apiGet<{ status: string; ready: boolean }>(`/content/videos/${videoSourceId}/status`);

export const deleteVideoSource = (videoSourceId: number) => apiDelete(`/content/videos/${videoSourceId}`);
