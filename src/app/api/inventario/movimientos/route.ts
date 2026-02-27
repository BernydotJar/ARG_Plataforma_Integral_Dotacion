import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { createMovimiento, listMovimientos } from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

const createMovimientoSchema = z.object({
  sedeId: z.string().optional(),
  tipo: z.enum(["Ingreso", "Salida", "Ajuste"]),
  itemNombre: z.string().min(2),
  bodegaNombre: z.string().min(2),
  ubicacionNombre: z.string().min(2),
  cantidad: z.number().int().positive(),
  motivo: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if ("response" in auth) return auth.response;

    const searchParams = new URL(request.url).searchParams;
    const data = await listMovimientos(auth.user, {
      query: searchParams.get("q") || undefined,
      status: searchParams.get("status") || undefined,
      sedeId: searchParams.get("sedeId") || undefined,
    });

    return jsonOk({ data });
  } catch (error) {
    return jsonError(
      "No se pudieron cargar los movimientos",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "OperarioBodega"]);
    if ("response" in auth) return auth.response;

    const payload = createMovimientoSchema.parse(await request.json());
    const movimiento = await createMovimiento(auth.user, payload);

    return jsonOk({ data: movimiento }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Datos inválidos para movimiento", 400, error.message);
    }

    return jsonError("No se pudo crear el movimiento", 500, error instanceof Error ? error.message : undefined);
  }
}
