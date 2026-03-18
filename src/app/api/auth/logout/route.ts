import { NextResponse, type NextRequest } from "next/server";

import { requireRequestProtection } from "@/lib/auth/api-auth";
import {
  CSRF_COOKIE_NAME,
  getCsrfCookieOptions,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const protection = requireRequestProtection(request);
  if (protection) return protection;

  const expiredAt = new Date(0);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieOptions(expiredAt));
  response.cookies.set(CSRF_COOKIE_NAME, "", getCsrfCookieOptions(expiredAt));
  return response;
}
