import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireRequestProtection } from "@/lib/auth/api-auth";
import { verifyOperarioCaptcha } from "@/lib/auth/captcha";
import { checkAuthRateLimit, registerAuthAttempt } from "@/lib/auth/rate-limit";
import {
  createCsrfToken,
  CSRF_COOKIE_NAME,
  getCsrfCookieOptions,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth/session";
import { env, isDemoMode, isTurnstileConfigured } from "@/lib/config/env";
import { getMockDb } from "@/lib/dataverse/mock-store";
import { jsonError } from "@/lib/http/route";

const bodySchema = z.object({
  identificacion: z.string().min(2),
  password: z.string().min(4),
  captchaToken: z.string().optional(),
});

const getRemoteIp = (request: Request): string | undefined => {
  const forwarded = request.headers.get("x-forwarded-for")?.trim();
  if (!forwarded) return undefined;
  return forwarded.split(",")[0]?.trim() || undefined;
};

const getRateLimitKey = (request: Request, identificacion: string): string => {
  const ip = getRemoteIp(request) || "unknown-ip";
  return `${ip}:${identificacion.trim().toLowerCase()}`;
};

export async function POST(request: NextRequest) {
  const protection = requireRequestProtection(request, { requireCsrfToken: false });
  if (protection) return protection;

  if (!isDemoMode() || !env.demoLoginEnabled) {
    return jsonError("Ingreso operario disponible solo en entorno demo/piloto", 403);
  }

  try {
    const body = bodySchema.parse(await request.json());
    const rateKey = getRateLimitKey(request, body.identificacion);
    const preCheck = checkAuthRateLimit(rateKey);

    if (!preCheck.allowed) {
      return jsonError(
        "Demasiados intentos de acceso. Intenta nuevamente más tarde.",
        429,
        preCheck.retryAfterMs ? `retryAfterMs=${preCheck.retryAfterMs}` : undefined,
      );
    }

    if (env.operarioCaptchaRequired && !isTurnstileConfigured()) {
      return jsonError("Captcha requerido pero no configurado", 503);
    }

    const captchaValidation = await verifyOperarioCaptcha(body.captchaToken, getRemoteIp(request));
    if (!captchaValidation.ok || (env.operarioCaptchaRequired && captchaValidation.bypassed)) {
      registerAuthAttempt(rateKey, false);
      return jsonError("Validación de seguridad fallida. Intenta de nuevo.", 401, captchaValidation.details);
    }

    if (body.password !== env.demoOperarioPassword) {
      registerAuthAttempt(rateKey, false);
      return jsonError("Credenciales inválidas", 401);
    }

    const empleado = getMockDb().empleados.find((entry) => entry.identificacion === body.identificacion.trim());
    if (!empleado) {
      registerAuthAttempt(rateKey, false);
      return jsonError("Operario no encontrado", 404);
    }

    registerAuthAttempt(rateKey, true);

    const token = await signSessionToken({
      id: `operario-${empleado.id}`,
      name: empleado.nombreCompleto,
      email: `${empleado.identificacion}@operario.argos.local`,
      roles: ["UsuarioFinal"],
      sedeIds: [empleado.sedeId],
      preferredSedeId: empleado.sedeId,
    });

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8);
    const csrfToken = createCsrfToken();

    const response = NextResponse.json({
      ok: true,
      mode: "demo-operario",
      user: {
        id: `operario-${empleado.id}`,
        name: empleado.nombreCompleto,
        role: "UsuarioFinal",
        sedeId: empleado.sedeId,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(expiresAt));
    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions(expiresAt));

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Datos inválidos para login operario", 400, error.message);
    }

    return jsonError("No se pudo iniciar sesión operario", 500, error instanceof Error ? error.message : undefined);
  }
}
