import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { createInspeccion, listInspecciones } from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

const createSchema = z.object({
  sedeId: z.string().optional(),
  inspector: z.string().min(2),
  lote: z.string().min(2),
  resultado: z.enum(["Conforme", "NoConforme"]),
  observacion: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if ("response" in auth) return auth.response;

    const searchParams = new URL(request.url).searchParams;
    const data = await listInspecciones(auth.user, {
      query: searchParams.get("q") || undefined,
      status: searchParams.get("status") || undefined,
      sedeId: searchParams.get("sedeId") || undefined,
    });

    return jsonOk({ data });
  } catch (error) {
    return jsonError(
      "No se pudieron cargar inspecciones",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "InspectorCalidad"]);
    if ("response" in auth) return auth.response;

    const payload = createSchema.parse(await request.json());
    const inspeccion = await createInspeccion(auth.user, payload);

    return jsonOk({ data: inspeccion }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Datos inválidos para inspección", 400, error.message);
    }

    return jsonError("No se pudo crear inspección", 500, error instanceof Error ? error.message : undefined);
  }
}
