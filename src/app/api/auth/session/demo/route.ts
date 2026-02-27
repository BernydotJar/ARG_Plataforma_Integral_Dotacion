import { NextResponse } from "next/server";

import { getSessionCookieOptions, SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/config/env";

export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Demo mode no habilitado" }, { status: 403 });
  }

  const token = await signSessionToken({
    id: "demo-user",
    name: "Usuario Demo ARGOS",
    email: "demo@argos.local",
    roles: ["SuperAdmin", "AdminLocal"],
    sedeIds: ["*"],
    preferredSedeId: "sede-centro",
  });

  const response = NextResponse.json({
    ok: true,
    mode: "demo",
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(new Date(Date.now() + 1000 * 60 * 60 * 8)));

  return response;
}
