import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  buildAppUserFromClaims,
  getRequestSessionUser,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifyEntraIdToken,
} from "@/lib/auth/session";
import { jsonError } from "@/lib/http/route";

const bodySchema = z.object({
  idToken: z.string().min(10),
});

export async function GET(request: NextRequest) {
  const user = await getRequestSessionUser(request);
  if (!user) {
    return jsonError("No autenticado", 401);
  }

  return NextResponse.json({
    user,
  });
}

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());

    const claims = await verifyEntraIdToken(body.idToken);
    const user = buildAppUserFromClaims(claims);
    const token = await signSessionToken(user);

    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(new Date(Date.now() + 1000 * 60 * 60 * 8)));
    return response;
  } catch (error) {
    return jsonError("No se pudo iniciar sesión", 401, error instanceof Error ? error.message : undefined);
  }
}
