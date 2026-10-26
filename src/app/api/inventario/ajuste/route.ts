import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { resolveWriteSede, SedeAccessError } from "@/lib/auth/sede-scope";
import { INVENTORY_ROLES } from "@/lib/auth/inventory-permissions";
import { createMovimiento } from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

const createAjusteSchema = z.object({
  sedeId: z.string().optional(),
  itemNombre: z.string().min(2),
  bodegaNombre: z.string().min(2),
  ubicacionNombre: z.string().min(2),
  cantidad: z.number().int().positive(),
  motivo: z.string().min(3),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, INVENTORY_ROLES);
    if ("response" in auth) return auth.response;

    const payload = createAjusteSchema.parse(await request.json());
    const sedeId = resolveWriteSede(auth.user, payload.sedeId);
    const ajuste = await createMovimiento(auth.user, {
      ...payload,
      sedeId,
      tipo: "Ajuste",
    });

    return jsonOk({ data: ajuste }, { status: 201 });
  } catch (error) {
    if (error instanceof SedeAccessError) {
      return jsonError("Sede no autorizada", 403);
    }
    if (error instanceof z.ZodError) {
      return jsonError("Datos inválidos para ajuste", 400, error.message);
    }

    return jsonError("No se pudo crear el ajuste", 500, error instanceof Error ? error.message : undefined);
  }
}
