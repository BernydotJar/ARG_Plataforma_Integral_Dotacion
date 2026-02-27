import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { getPedidoDetail, setPedidoStatus } from "@/lib/dataverse/repository";
import { triggerSapEnviarPedidoFlow } from "@/lib/flows/triggers";
import { jsonError, jsonOk } from "@/lib/http/route";

const schema = z.object({
  pedidoId: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "UsuarioPedidos"]);
    if ("response" in auth) return auth.response;

    const payload = schema.parse(await request.json());
    const detail = await getPedidoDetail(auth.user, payload.pedidoId);

    if (!detail) {
      return jsonError("Pedido no encontrado", 404);
    }

    const flowResult = await triggerSapEnviarPedidoFlow(auth.user, detail.pedido.sedeId, {
      pedidoId: detail.pedido.id,
      codigoPedido: detail.pedido.codigo,
      empleado: detail.pedido.empleadoNombre,
      sedeId: detail.pedido.sedeId,
      detalle: detail.detalles,
      solicitadoPor: auth.user.email || auth.user.name,
    });

    const updated = await setPedidoStatus(
      auth.user,
      detail.pedido.id,
      "EnviadoSAP",
      "SAP",
      `Pedido enviado a SAP. Tracking: ${flowResult.trackingId}`,
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
      "No se pudo enviar el pedido a SAP",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}
