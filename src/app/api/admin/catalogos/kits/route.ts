import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { createKit, listKits } from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

const kitItemSchema = z.object({
  itemNombre: z.string().min(2),
  cantidad: z.number().int().min(1),
  obligatorio: z.boolean(),
});

const createKitSchema = z.object({
  sedeId: z.string().min(2).optional(),
  nombre: z.string().min(3),
  genero: z.enum(["Masculino", "Femenino", "Unisex"]),
  cargo: z.string().min(2),
  ciclo: z.string().min(2),
  items: z.array(kitItemSchema).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal"]);
    if ("response" in auth) return auth.response;

    const data = await listKits(auth.user);
    return jsonOk({ data });
  } catch (error) {
    return jsonError("No se pudieron cargar kits", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin"]);
    if ("response" in auth) return auth.response;

    const payload = createKitSchema.parse(await request.json());
    const data = await createKit(auth.user, payload);

    return jsonOk({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Datos inválidos para crear kit", 400, error.message);
    }

    return jsonError("No se pudo crear kit", 500, error instanceof Error ? error.message : undefined);
  }
}
