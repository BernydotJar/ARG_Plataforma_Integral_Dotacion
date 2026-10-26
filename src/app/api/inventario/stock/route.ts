import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/auth/api-auth";
import { INVENTORY_ROLES } from "@/lib/auth/inventory-permissions";
import { listInventario } from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request, INVENTORY_ROLES);
    if ("response" in auth) return auth.response;

    const data = await listInventario(auth.user);
    return jsonOk({ data });
  } catch (error) {
    return jsonError("No se pudo cargar inventario", 500, error instanceof Error ? error.message : undefined);
  }
}
