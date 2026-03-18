import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { getPedidoDetail, setPedidoStatus } from "@/lib/dataverse/repository";
import { triggerApprovalPedidoFlow } from "@/lib/flows/triggers";
import { jsonError, jsonOk } from "@/lib/http/route";

const schema = z.object({
  pedidoId: z.string().min(2),
  comentario: z.string().optional(),
});

const ALLOWED_SOURCE_STATUSES = new Set(["Borrador", "Rechazado"]);

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "UsuarioPedidos"]);
    if ("response" in auth) return auth.response;

    const payload = schema.parse(await request.json());
    const pedido = await getPedidoDetail(auth.user, payload.pedidoId);

    if (!pedido) {
      return jsonError("Pedido no encontrado", 404);
    }

    const currentStatus = pedido.pedido.estado || "Borrador";
    if (currentStatus === "EnAprobacion") {
      return jsonOk({
        data: {
          pedido: pedido.pedido,
          flow: null,
        },
        message: "El pedido ya estaba en aprobación",
      });
    }

    if (!ALLOWED_SOURCE_STATUSES.has(currentStatus)) {
      return jsonError(
        `Transición inválida: estado actual '${currentStatus}' no permite enviar a aprobación`,
        409,
      );
    }

    const flowResult = await triggerApprovalPedidoFlow(auth.user, pedido.pedido.sedeId, {
      pedidoId: pedido.pedido.id,
      codigoPedido: pedido.pedido.codigo,
      empleado: pedido.pedido.empleadoNombre,
      sedeId: pedido.pedido.sedeId,
      solicitadoPor: auth.user.email || auth.user.name,
      comentario: payload.comentario,
    });

    const updated = await setPedidoStatus(
      auth.user,
      pedido.pedido.id,
      "EnAprobacion",
      "Aprobación",
      `Pedido enviado a aprobación. Tracking: ${flowResult.trackingId}`,
    );

    return jsonOk({
      data: {
        pedido: updated,
        flow: flowResult,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Solicitud inválida", 400, error.message);
    }

    return jsonError(
      "No se pudo enviar el pedido a aprobación",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}
