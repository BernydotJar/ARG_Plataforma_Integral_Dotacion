import "server-only";

import { env } from "@/lib/config/env";

const DEFAULT_TIMEOUT_MS = 10_000;

export class BackendApiError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
    this.details = details;
  }
}

const buildUrl = (path: string): string => {
  const baseUrl = env.backend.baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

const buildHeaders = (headers: HeadersInit | undefined): HeadersInit => ({
  "Content-Type": "application/json",
  ...(env.backend.apiKey ? { "x-api-key": env.backend.apiKey } : {}),
  ...(env.backend.bearerToken ? { Authorization: `Bearer ${env.backend.bearerToken}` } : {}),
  ...(headers || {}),
});

export const backendApiFetch = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  if (!env.backend.baseUrl) {
    throw new BackendApiError("BACKEND_API_BASE_URL no está configurado", 500);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...init,
      headers: buildHeaders(init.headers),
      cache: "no-store",
      signal: AbortSignal.timeout(env.backend.timeoutMs || DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    throw new BackendApiError(
      "No se pudo conectar al backend API",
      502,
      error instanceof Error ? error.message : undefined,
    );
  }

  if (!response.ok) {
    const text = await response.text();
    throw new BackendApiError(
      `Backend API error ${response.status}`,
      response.status,
      text,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
};
