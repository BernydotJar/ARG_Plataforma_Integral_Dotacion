import { NextResponse } from "next/server";

export const jsonOk = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

export const jsonError = (error: string, status = 400, details?: string) =>
  NextResponse.json(
    {
      error,
      ...(details ? { details } : {}),
    },
    { status },
  );

export const readJson = async <T>(request: Request): Promise<T> => (await request.json()) as T;

export const parseSearchParams = (url: string): URLSearchParams => new URL(url).searchParams;
