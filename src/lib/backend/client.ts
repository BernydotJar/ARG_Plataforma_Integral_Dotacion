import "server-only";

import { env } from "@/lib/config/env";

const DEFAULT_TIMEOUT_MS = 10_000;

export class BackendApiError extends Error {
  status: number;
  details?: string;
  backendRequestId?: string;
  correlationId?: string;

  constructor(
    message: string,
    status: number,
    details?: string,
    backendRequestId?: string,
    correlationId?: string,
  ) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
    this.details = details;
    this.backendRequestId = backendRequestId;
    this.correlationId = correlationId;
  }
}

const buildUrl = (path: string): string => {
  const baseUrl = env.backend.baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

const buildHeaders = (headers: HeadersInit | undefined, correlationId: string): HeadersInit => ({
  "Content-Type": "application/json",
  "x-correlation-id": correlationId,
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

  const correlationId = crypto.randomUUID();

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...init,
      headers: buildHeaders(init.headers, correlationId),
      cache: "no-store",
      signal: AbortSignal.timeout(env.backend.timeoutMs || DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    throw new BackendApiError(
      `No se pudo conectar al backend API (corr: ${correlationId})`,
      502,
      error instanceof Error ? error.message : undefined,
      undefined,
      correlationId,
    );
  }

  if (!response.ok) {
    const backendRequestId = response.headers.get("x-request-id") || undefined;
    const text = await response.text();
    const details = backendRequestId ? `[backend-ref:${backendRequestId}] ${text}` : text;

    throw new BackendApiError(
      `Backend API error ${response.status} (corr: ${correlationId})`,
      response.status,
      details,
      backendRequestId,
      correlationId,
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
