import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { listMovimientos, updateMovimientoEstado } from "@/lib/dataverse/repository";
import { triggerApprovalAjusteFlow } from "@/lib/flows/triggers";
import { jsonError, jsonOk } from "@/lib/http/route";

const schema = z.object({
  movimientoId: z.string().min(2),
  comentario: z.string().optional(),
});

const ALLOWED_AJUSTE_STATUSES = new Set(["Registrado", "PendienteAprobacion"]);

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "OperarioBodega"]);
    if ("response" in auth) return auth.response;

    const payload = schema.parse(await request.json());
    const movimiento = (await listMovimientos(auth.user)).find((entry) => entry.id === payload.movimientoId);

    if (!movimiento) {
      return jsonError("Movimiento no encontrado", 404);
    }

    if (movimiento.tipo !== "Ajuste") {
      return jsonError("Solo los movimientos de tipo Ajuste pueden enviarse a aprobación", 409);
    }

    if (movimiento.estado === "EnAprobacion") {
      return jsonOk({
        data: {
          movimiento,
          flow: null,
        },
        message: "El ajuste ya estaba en aprobación",
      });
    }

    if (!ALLOWED_AJUSTE_STATUSES.has(movimiento.estado || "Registrado")) {
      return jsonError(
        `Transición inválida: estado actual '${movimiento.estado}' no permite enviar a aprobación`,
        409,
      );
    }

    const flowResult = await triggerApprovalAjusteFlow(auth.user, movimiento.sedeId, {
      movimientoId: movimiento.id,
      tipo: movimiento.tipo,
      itemNombre: movimiento.itemNombre,
      cantidad: movimiento.cantidad,
      sedeId: movimiento.sedeId,
      comentario: payload.comentario,
      solicitadoPor: auth.user.email || auth.user.name,
    });

    const updated = await updateMovimientoEstado(auth.user, movimiento.id, "EnAprobacion");

    return jsonOk({
      data: {
        movimiento: updated,
        flow: flowResult,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Solicitud inválida", 400, error.message);
    }

    return jsonError(
      "No se pudo enviar el ajuste a aprobación",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}
