import { NextResponse } from "next/server";

const withRequestId = (init: ResponseInit | undefined, requestId: string): ResponseInit => {
  const headers = new Headers(init?.headers);
  headers.set("x-request-id", requestId);

  return {
    ...(init || {}),
    headers,
  };
};

export const jsonOk = <T>(
  data: T,
  init?: ResponseInit,
  requestId = crypto.randomUUID(),
) => NextResponse.json(data, withRequestId(init, requestId));

export const jsonError = (
  error: string,
  status = 400,
  details?: string,
  requestId = crypto.randomUUID(),
) =>
  NextResponse.json(
    {
      error,
      ...(details ? { details } : {}),
      requestId,
    },
    withRequestId({ status }, requestId),
  );

export const readJson = async <T>(request: Request): Promise<T> => (await request.json()) as T;

export const parseSearchParams = (url: string): URLSearchParams => new URL(url).searchParams;
