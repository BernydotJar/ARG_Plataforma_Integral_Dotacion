import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/auth/api-auth";
import { deletePedidoAttachment, getPedidoDetail } from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

type RouteContext = {
  params: Promise<{
    id: string;
    attachmentId: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "UsuarioPedidos"]);
    if ("response" in auth) return auth.response;

    const { id, attachmentId } = await context.params;
    const detail = await getPedidoDetail(auth.user, id);
    if (!detail) {
      return jsonError("Pedido no encontrado", 404);
    }

    const deleted = await deletePedidoAttachment(auth.user, id, attachmentId);
    if (!deleted) {
      return jsonError("Adjunto no encontrado", 404);
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError("No se pudo eliminar el adjunto", 500, error instanceof Error ? error.message : undefined);
  }
}
