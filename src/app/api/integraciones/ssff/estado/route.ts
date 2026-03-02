import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/auth/api-auth";
import { jsonError, jsonOk } from "@/lib/http/route";
import { getSsffSyncOverview } from "@/lib/integrations/ssff";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "UsuarioPedidos"]);
    if ("response" in auth) return auth.response;

    const data = await getSsffSyncOverview();
    return jsonOk({ data }, undefined, requestId);
  } catch (error) {
    return jsonError(
      "No se pudo obtener estado de integración SSFF",
      500,
      error instanceof Error ? error.message : undefined,
      requestId,
    );
  }
}
