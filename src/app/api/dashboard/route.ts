import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/auth/api-auth";
import { getDashboardData, getRuntimeModeLabel } from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if ("response" in auth) return auth.response;

    const data = await getDashboardData(auth.user);

    return jsonOk({
      ...data,
      runtimeMode: getRuntimeModeLabel(),
    });
  } catch (error) {
    return jsonError("No se pudo cargar el dashboard", 500, error instanceof Error ? error.message : undefined);
  }
}
