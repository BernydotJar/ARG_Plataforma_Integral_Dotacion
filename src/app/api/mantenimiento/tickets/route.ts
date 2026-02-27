import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import { createTicket, listTickets } from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

const createSchema = z.object({
  sedeId: z.string().optional(),
  equipoNombre: z.string().min(2),
  prioridad: z.enum(["Baja", "Media", "Alta"]),
  descripcion: z.string().min(5),
  tecnicoAsignado: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if ("response" in auth) return auth.response;

    const searchParams = new URL(request.url).searchParams;
    const data = await listTickets(auth.user, {
      query: searchParams.get("q") || undefined,
      status: searchParams.get("status") || undefined,
      sedeId: searchParams.get("sedeId") || undefined,
    });

    return jsonOk({ data });
  } catch (error) {
    return jsonError("No se pudieron cargar los tickets", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "TecnicoMantenimiento"]);
    if ("response" in auth) return auth.response;

    const payload = createSchema.parse(await request.json());
    const ticket = await createTicket(auth.user, payload);

    return jsonOk({ data: ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Datos inválidos para ticket", 400, error.message);
    }

    return jsonError("No se pudo crear el ticket", 500, error instanceof Error ? error.message : undefined);
  }
}
