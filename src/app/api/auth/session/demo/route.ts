import { NextResponse, type NextRequest } from "next/server";

import { requireRequestProtection } from "@/lib/auth/api-auth";
import {
  createCsrfToken,
  CSRF_COOKIE_NAME,
  getCsrfCookieOptions,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth/session";
import { env, isDemoMode } from "@/lib/config/env";

export async function POST(request: NextRequest) {
  const protection = requireRequestProtection(request, { requireCsrfToken: false });
  if (protection) return protection;

  if (!isDemoMode() || !env.demoLoginEnabled) {
    return NextResponse.json({ error: "Login demo no habilitado" }, { status: 403 });
  }

  const token = await signSessionToken({
    id: "demo-user",
    name: "Usuario Demo ARGOS",
    email: "demo@argos.local",
    roles: ["SuperAdmin", "AdminLocal"],
    sedeIds: ["*"],
    preferredSedeId: "sede-centro",
  });

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8);
  const csrfToken = createCsrfToken();

  const response = NextResponse.json({
    ok: true,
    mode: "demo",
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(expiresAt));
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions(expiresAt));

  return response;
}
