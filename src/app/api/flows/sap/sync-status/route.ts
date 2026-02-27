import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { getPedidoDetail, setPedidoStatus } from "@/lib/dataverse/repository";
import { PEDIDO_STATUSES } from "@/lib/dataverse/types";
import { triggerSapSyncStatusFlow } from "@/lib/flows/triggers";
import { jsonError, jsonOk } from "@/lib/http/route";

const schema = z.object({
  pedidoId: z.string().optional(),
  sapDocumentId: z.string().optional(),
  estadoSap: z.enum(PEDIDO_STATUSES).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "UsuarioPedidos"]);
    if ("response" in auth) return auth.response;

    const payload = schema.parse(await request.json());

    let pedidoSede = auth.user.preferredSedeId || auth.user.sedeIds[0] || "SEDE-CENTRAL";
    if (payload.pedidoId) {
      const detail = await getPedidoDetail(auth.user, payload.pedidoId);
      if (!detail) {
        return jsonError("Pedido no encontrado", 404);
      }
      pedidoSede = detail.pedido.sedeId;
    }

    const flowResult = await triggerSapSyncStatusFlow(auth.user, pedidoSede, {
      pedidoId: payload.pedidoId,
      sapDocumentId: payload.sapDocumentId,
      estadoSap: payload.estadoSap,
      triggeredBy: auth.user.email || auth.user.name,
    });

    let updatedPedido = null;
    if (payload.pedidoId && payload.estadoSap) {
      updatedPedido = await setPedidoStatus(
        auth.user,
        payload.pedidoId,
        payload.estadoSap,
        "SAP Sync",
        `Estado sincronizado desde SAP: ${payload.estadoSap}`,
      );
    }

    return jsonOk({
      data: {
        flow: flowResult,
        pedido: updatedPedido,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Solicitud inválida", 400, error.message);
    }

    return jsonError(
      "No se pudo ejecutar la sincronización SAP",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}
