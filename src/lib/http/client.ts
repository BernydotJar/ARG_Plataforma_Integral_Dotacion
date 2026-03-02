"use client";

import type { ApiError } from "@/lib/types/app";

export class ApiRequestError extends Error {
  status: number;
  details?: string;
  requestId?: string;

  constructor(message: string, status: number, details?: string, requestId?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

export const apiFetch = async <T>(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    let payload: ApiError | null = null;
    try {
      payload = (await response.json()) as ApiError;
    } catch {
      payload = null;
    }

    const requestId = payload?.requestId || response.headers.get("x-request-id") || undefined;
    const baseMessage = payload?.error || "Error inesperado en la solicitud";
    const message = requestId ? `${baseMessage} (ref: ${requestId})` : baseMessage;

    throw new ApiRequestError(
      message,
      response.status,
      payload?.details,
      requestId,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
