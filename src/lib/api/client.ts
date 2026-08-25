import axios, { AxiosError } from 'axios';

export class ApiError extends Error {
  status?: number;
  highlight?: string;
  constructor(message: string, status?: number, highlight?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.highlight = highlight;
  }
}

type ApiOk<T> = { success: true; message: string; data: T };
type ApiFail = {
  success: false;
  error: { type: string; message: string; highlight: string; details: unknown };
};

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

export const http = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
  withCredentials: true,
});

function unwrapError(err: unknown): never {
  if (err instanceof AxiosError && err.response) {
    const body = err.response.data as ApiFail;
    throw new ApiError(
      body?.error?.message ?? 'Something went wrong',
      err.response.status,
      body?.error?.highlight,
    );
  }
  throw new ApiError('Network error. Please check your connection.');
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
  try {
    const res = await http.get<ApiOk<T>>(path, { params });
    return res.data.data;
  } catch (err) {
    unwrapError(err);
  }
}

export async function apiPost<T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  try {
    const res = await http.post<ApiOk<T>>(path, body ?? {});
    return res.data.data;
  } catch (err) {
    unwrapError(err);
  }
}

export async function apiPatch<T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  try {
    const res = await http.patch<ApiOk<T>>(path, body ?? {});
    return res.data.data;
  } catch (err) {
    unwrapError(err);
  }
}

export async function apiPut<T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  try {
    const res = await http.put<ApiOk<T>>(path, body ?? {});
    return res.data.data;
  } catch (err) {
    unwrapError(err);
  }
}

export async function apiDelete<T>(path: string): Promise<T> {
  try {
    const res = await http.delete<ApiOk<T>>(path);
    return res.data.data;
  } catch (err) {
    unwrapError(err);
  }
}
