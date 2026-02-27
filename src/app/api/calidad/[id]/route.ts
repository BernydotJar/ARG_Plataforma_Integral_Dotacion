import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/auth/api-auth";
import { getInspeccionDetail } from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

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
    const detail = await getInspeccionDetail(auth.user, id);

    if (!detail) {
      return jsonError("Inspección no encontrada", 404);
    }

    return jsonOk({ data: detail });
  } catch (error) {
    return jsonError(
      "No se pudo obtener la inspección",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}
