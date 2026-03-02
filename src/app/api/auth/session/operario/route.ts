import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyOperarioCaptcha } from "@/lib/auth/captcha";
import {
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth/session";
import { env, isDemoMode } from "@/lib/config/env";
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

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return jsonError("Ingreso operario disponible solo en entorno demo/piloto", 403);
  }

  try {
    const body = bodySchema.parse(await request.json());

    const captchaValidation = await verifyOperarioCaptcha(body.captchaToken, getRemoteIp(request));
    if (!captchaValidation.ok) {
      return jsonError("Validación de seguridad fallida. Intenta de nuevo.", 401, captchaValidation.details);
    }

    if (body.password !== env.demoOperarioPassword) {
      return jsonError("Credenciales inválidas", 401);
    }

    const empleado = getMockDb().empleados.find((entry) => entry.identificacion === body.identificacion.trim());
    if (!empleado) {
      return jsonError("Operario no encontrado", 404);
    }

    const token = await signSessionToken({
      id: `operario-${empleado.id}`,
      name: empleado.nombreCompleto,
      email: `${empleado.identificacion}@operario.argos.local`,
      roles: ["UsuarioFinal"],
      sedeIds: [empleado.sedeId],
      preferredSedeId: empleado.sedeId,
    });

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

    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      getSessionCookieOptions(new Date(Date.now() + 1000 * 60 * 60 * 8)),
    );

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Datos inválidos para login operario", 400, error.message);
    }

    return jsonError("No se pudo iniciar sesión operario", 500, error instanceof Error ? error.message : undefined);
  }
}
