import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { createPedido, listPedidos } from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

const detalleSchema = z.object({
  itemNombre: z.string().min(1),
  talla: z.string().min(1),
  cantidad: z.number().int().min(1),
});

const createPedidoSchema = z.object({
  sedeId: z.string().optional(),
  empleadoNombre: z.string().min(2),
  areaNombre: z.string().min(2),
  observacion: z.string().optional(),
  prioridad: z.enum(["Baja", "Media", "Alta"]),
  detalles: z.array(detalleSchema).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if ("response" in auth) return auth.response;

    const searchParams = new URL(request.url).searchParams;
    const data = await listPedidos(auth.user, {
      query: searchParams.get("q") || undefined,
      status: searchParams.get("status") || undefined,
      sedeId: searchParams.get("sedeId") || undefined,
    });

    return jsonOk({ data });
  } catch (error) {
    return jsonError("No se pudieron cargar los pedidos", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "UsuarioPedidos", "UsuarioFinal"]);
    if ("response" in auth) return auth.response;

    const payload = createPedidoSchema.parse(await request.json());
    const pedido = await createPedido(auth.user, payload);

    return jsonOk({ data: pedido }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Datos inválidos para crear pedido", 400, error.message);
    }

    return jsonError("No se pudo crear el pedido", 500, error instanceof Error ? error.message : undefined);
  }
}
