import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { CSRF_COOKIE_NAME, getRequestSessionUser } from "@/lib/auth/session";
import { hasAnyRole } from "@/lib/auth/roles";
import { env } from "@/lib/config/env";
import type { AppRole, AppUser } from "@/lib/types/app";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const normalizeOrigin = (value: string): string => value.trim().replace(/\/$/, "");

const resolveExpectedOrigins = (request: NextRequest): Set<string> => {
  const expected = new Set<string>();
  if (env.appOrigin) {
    expected.add(normalizeOrigin(env.appOrigin));
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) {
    const protoHeader = request.headers.get("x-forwarded-proto");
    const protocol = protoHeader?.split(",")[0]?.trim() || (process.env.NODE_ENV === "production" ? "https" : "http");
    expected.add(`${protocol}://${host}`.replace(/\/$/, ""));
  }

  return expected;
};

type RequestProtectionOptions = {
  requireCsrfToken?: boolean;
};

export const requireRequestProtection = (
  request: NextRequest,
  options: RequestProtectionOptions = {},
): NextResponse | null => {
  const method = request.method.toUpperCase();
  if (!MUTATING_METHODS.has(method)) return null;

  const origin = request.headers.get("origin");
  if (origin) {
    const normalizedOrigin = normalizeOrigin(origin);
    const expectedOrigins = resolveExpectedOrigins(request);
    if (expectedOrigins.size > 0 && !expectedOrigins.has(normalizedOrigin)) {
      return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
    }
  }

  if (options.requireCsrfToken ?? true) {
    const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const csrfHeader = request.headers.get("x-csrf-token")?.trim();

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return NextResponse.json({ error: "Token CSRF inválido" }, { status: 403 });
    }
  }

  return null;
};

export const requireApiUser = async (
  request: NextRequest,
  allowedRoles?: AppRole[],
): Promise<{ user: AppUser } | { response: NextResponse }> => {
  const protection = requireRequestProtection(request);
  if (protection) {
    return { response: protection };
  }

  const user = await getRequestSessionUser(request);
  if (!user) {
    return {
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasAnyRole(user, allowedRoles)) {
    return {
      response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }

  return { user };
};
