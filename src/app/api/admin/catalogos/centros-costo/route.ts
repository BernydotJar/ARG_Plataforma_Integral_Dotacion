import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { createCentroCosto, listCentrosCosto } from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

const createCentroCostoSchema = z.object({
  sedeId: z.string().min(2).optional(),
  codigo: z.string().min(2),
  nombre: z.string().min(3),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal"]);
    if ("response" in auth) return auth.response;

    const data = await listCentrosCosto(auth.user);
    return jsonOk({ data });
  } catch (error) {
    return jsonError("No se pudieron cargar centros de costo", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin"]);
    if ("response" in auth) return auth.response;

    const payload = createCentroCostoSchema.parse(await request.json());
    const data = await createCentroCosto(auth.user, payload);

    return jsonOk({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Datos inválidos para crear centro de costo", 400, error.message);
    }

    return jsonError("No se pudo crear centro de costo", 500, error instanceof Error ? error.message : undefined);
  }
}
