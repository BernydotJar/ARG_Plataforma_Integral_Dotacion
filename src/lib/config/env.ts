import "server-only";

const read = (key: string): string => process.env[key]?.trim() ?? "";

const toBoolean = (value: string, fallback = false): boolean => {
  if (!value) return fallback;
  return value.toLowerCase() === "true";
};

const toCsv = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

export const env = {
  appName: read("NEXT_PUBLIC_APP_NAME") || "ARGOS - Plataforma Integral",
  appSessionSecret: read("APP_SESSION_SECRET") || "argos-dev-session-secret-change-me",
  demoModeForced: toBoolean(read("DEMO_MODE"), false),
  entra: {
    tenantId: read("ENTRA_TENANT_ID") || read("NEXT_PUBLIC_ENTRA_TENANT_ID"),
    clientId: read("ENTRA_CLIENT_ID") || read("NEXT_PUBLIC_ENTRA_CLIENT_ID"),
  },
  dataverse: {
    tenantId: read("DATAVERSE_TENANT_ID") || read("ENTRA_TENANT_ID") || read("NEXT_PUBLIC_ENTRA_TENANT_ID"),
    clientId: read("DATAVERSE_CLIENT_ID"),
    clientSecret: read("DATAVERSE_CLIENT_SECRET"),
    url: read("DATAVERSE_URL"),
  },
  flow: {
    mode: read("FLOW_TRIGGER_MODE") || "http",
    apiKey: read("FLOW_API_KEY"),
    bearerToken: read("FLOW_BEARER_TOKEN"),
    approvalPedidoUrl: read("FLOW_APPROVAL_PEDIDO_URL"),
    approvalAjusteUrl: read("FLOW_APPROVAL_AJUSTE_URL"),
    sapEnviarPedidoUrl: read("FLOW_SAP_ENVIAR_PEDIDO_URL"),
    sapSyncStatusUrl: read("FLOW_SAP_SYNC_STATUS_URL"),
  },
  roleGroupMap: {
    SuperAdmin: read("ENTRA_GROUP_SUPERADMIN"),
    AdminLocal: read("ENTRA_GROUP_ADMINLOCAL"),
    UsuarioPedidos: read("ENTRA_GROUP_USUARIOPEDIDOS"),
    UsuarioFinal: read("ENTRA_GROUP_USUARIOFINAL"),
    OperarioBodega: read("ENTRA_GROUP_OPERARIOBODEGA"),
    InspectorCalidad: read("ENTRA_GROUP_INSPECTORCALIDAD"),
    TecnicoMantenimiento: read("ENTRA_GROUP_TECNICOMANTENIMIENTO"),
  },
  defaultSedes: toCsv(read("DEFAULT_SEDES") || "SEDE-CENTRAL"),
};

export const hasDataverseConfig = (): boolean =>
  Boolean(env.dataverse.tenantId && env.dataverse.clientId && env.dataverse.clientSecret && env.dataverse.url);

export const isDemoMode = (): boolean => {
  if (env.demoModeForced) return true;
  return !hasDataverseConfig();
};
