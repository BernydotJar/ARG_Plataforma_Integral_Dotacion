import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { deletePedido, getPedidoDetail, updatePedido } from "@/lib/dataverse/repository";
import { PEDIDO_STATUSES } from "@/lib/dataverse/types";
import { jsonError, jsonOk } from "@/lib/http/route";

const updateSchema = z.object({
  observacion: z.string().optional(),
  prioridad: z.enum(["Baja", "Media", "Alta"]).optional(),
  estado: z.enum(PEDIDO_STATUSES).optional(),
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
    const detail = await getPedidoDetail(auth.user, id);

    if (!detail) {
      return jsonError("Pedido no encontrado", 404);
    }

    return jsonOk({ data: detail });
  } catch (error) {
    return jsonError("No se pudo obtener el pedido", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "UsuarioPedidos"]);
    if ("response" in auth) return auth.response;

    const { id } = await context.params;
    const payload = updateSchema.parse(await request.json());
    const updated = await updatePedido(auth.user, id, payload);

    if (!updated) {
      return jsonError("Pedido no encontrado", 404);
    }

    return jsonOk({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Payload inválido", 400, error.message);
    }

    return jsonError("No se pudo actualizar el pedido", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal"]);
    if ("response" in auth) return auth.response;

    const { id } = await context.params;
    const deleted = await deletePedido(auth.user, id);

    if (!deleted) {
      return jsonError("Pedido no encontrado", 404);
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError("No se pudo eliminar el pedido", 500, error instanceof Error ? error.message : undefined);
  }
}
