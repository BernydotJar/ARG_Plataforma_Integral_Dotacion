import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { getTicketDetail, updateTicket } from "@/lib/dataverse/repository";
import { TICKET_STATUSES } from "@/lib/dataverse/types";
import { jsonError, jsonOk } from "@/lib/http/route";

const updateSchema = z.object({
  prioridad: z.enum(["Baja", "Media", "Alta"]).optional(),
  descripcion: z.string().min(5).optional(),
  tecnicoAsignado: z.string().optional(),
  estado: z.enum(TICKET_STATUSES).optional(),
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
    const detail = await getTicketDetail(auth.user, id);

    if (!detail) {
      return jsonError("Ticket no encontrado", 404);
    }

    return jsonOk({ data: detail });
  } catch (error) {
    return jsonError("No se pudo obtener el ticket", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "TecnicoMantenimiento"]);
    if ("response" in auth) return auth.response;

    const payload = updateSchema.parse(await request.json());
    const { id } = await context.params;
    const updated = await updateTicket(auth.user, id, payload);

    if (!updated) {
      return jsonError("Ticket no encontrado", 404);
    }

    return jsonOk({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Payload inválido", 400, error.message);
    }

    return jsonError("No se pudo actualizar el ticket", 500, error instanceof Error ? error.message : undefined);
  }
}
