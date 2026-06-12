import { hasBackendApiConfig, isDemoMode } from "@/lib/config/env";
import { jsonOk } from "@/lib/http/route";

export const dynamic = "force-dynamic";

// Endpoint sin autenticación para health probes (Azure App Service / Container Apps).
// No expone secretos ni detalles internos; solo estado operativo básico.
export const GET = () =>
  jsonOk({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    mode: isDemoMode() ? "demo" : "backend",
    backendConfigured: hasBackendApiConfig(),
  });
