import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { listMovimientos, updateMovimientoEstado } from "@/lib/dataverse/repository";
import { MOVIMIENTO_STATUSES } from "@/lib/dataverse/types";
import { jsonError, jsonOk } from "@/lib/http/route";

const updateSchema = z.object({
  estado: z.enum(MOVIMIENTO_STATUSES),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiUser(request);
    if ("response" in auth) return auth.response;

    const { id } = await context.params;
    const all = await listMovimientos(auth.user);
    const found = all.find((entry) => entry.id === id);

    if (!found) {
      return jsonError("Movimiento no encontrado", 404);
    }

    return jsonOk({ data: found });
  } catch (error) {
    return jsonError(
      "No se pudo obtener el movimiento",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "OperarioBodega"]);
    if ("response" in auth) return auth.response;

    const payload = updateSchema.parse(await request.json());
    const { id } = await context.params;
    const updated = await updateMovimientoEstado(auth.user, id, payload.estado);

    if (!updated) {
      return jsonError("Movimiento no encontrado", 404);
    }

    return jsonOk({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Payload inválido", 400, error.message);
    }

    return jsonError(
      "No se pudo actualizar el movimiento",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}
