import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { jsonError, jsonOk } from "@/lib/http/route";
import { triggerSsffSync } from "@/lib/integrations/ssff";

const schema = z.object({
  mode: z.enum(["manual", "retry"]).optional(),
  sinceDate: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "UsuarioPedidos"]);
    if ("response" in auth) return auth.response;

    const payload = schema.parse(await request.json());
    const data = await triggerSsffSync(auth.user, payload);

    return jsonOk({ data }, { status: 202 }, requestId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Payload inválido para sincronización SSFF", 400, error.message, requestId);
    }

    return jsonError(
      "No se pudo iniciar sincronización SSFF",
      500,
      error instanceof Error ? error.message : undefined,
      requestId,
    );
  }
}
