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

const toNumber = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const DEFAULT_SESSION_SECRET = "argos-dev-session-secret-change-me";
const DEFAULT_DEMO_OPERARIO_PASSWORD = "Operario2026!";
const MIN_SESSION_SECRET_LENGTH = 32;

const resolvedNodeEnv = read("NODE_ENV") || process.env.NODE_ENV || "development";
const isProduction = resolvedNodeEnv === "production";

export const env = {
  appName: read("NEXT_PUBLIC_APP_NAME") || "ARGOS - Plataforma Integral",
  nodeEnv: resolvedNodeEnv,
  appOrigin: read("APP_ORIGIN"),
  appSessionSecret: read("APP_SESSION_SECRET") || DEFAULT_SESSION_SECRET,
  demoModeForced: toBoolean(read("DEMO_MODE"), false),
  demoLoginEnabled: toBoolean(read("DEMO_LOGIN_ENABLED"), false),
  demoOperarioPassword: read("DEMO_OPERARIO_PASSWORD") || DEFAULT_DEMO_OPERARIO_PASSWORD,
  operarioCaptchaRequired: toBoolean(read("OPERARIO_CAPTCHA_REQUIRED"), true),
  authRateLimit: {
    maxAttempts: toNumber(read("AUTH_MAX_ATTEMPTS"), 5),
    windowMs: toNumber(read("AUTH_WINDOW_MS"), 15 * 60 * 1000),
    lockMs: toNumber(read("AUTH_LOCK_MS"), 15 * 60 * 1000),
  },
  turnstile: {
    siteKey: read("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
    secretKey: read("TURNSTILE_SECRET_KEY"),
  },
  entra: {
    tenantId: read("ENTRA_TENANT_ID") || read("NEXT_PUBLIC_ENTRA_TENANT_ID"),
    clientId: read("ENTRA_CLIENT_ID") || read("NEXT_PUBLIC_ENTRA_CLIENT_ID"),
  },
  backend: {
    baseUrl: read("BACKEND_API_BASE_URL"),
    apiKey: read("BACKEND_API_KEY"),
    bearerToken: read("BACKEND_API_BEARER_TOKEN"),
    timeoutMs: toNumber(read("BACKEND_API_TIMEOUT_MS"), 10000),
  },
  flow: {
    mode: read("FLOW_TRIGGER_MODE") || "http",
    apiKey: read("FLOW_API_KEY"),
    bearerToken: read("FLOW_BEARER_TOKEN"),
    approvalPedidoUrl: read("FLOW_APPROVAL_PEDIDO_URL"),
    approvalAjusteUrl: read("FLOW_APPROVAL_AJUSTE_URL"),
    sapEnviarPedidoUrl: read("FLOW_SAP_ENVIAR_PEDIDO_URL"),
    sapSyncStatusUrl: read("FLOW_SAP_SYNC_STATUS_URL"),
    timeoutMs: toNumber(read("FLOW_TIMEOUT_MS"), 10000),
    retryCount: toNumber(read("FLOW_RETRY_COUNT"), 2),
    retryDelayMs: toNumber(read("FLOW_RETRY_DELAY_MS"), 1000),
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

export const hasBackendApiConfig = (): boolean => Boolean(env.backend.baseUrl);

export const isDemoMode = (): boolean => {
  if (env.demoModeForced) return true;
  return !hasBackendApiConfig();
};

const validateEnvironment = (): void => {
  const hasDefaultSecret = env.appSessionSecret === DEFAULT_SESSION_SECRET;
  const weakSecret = env.appSessionSecret.length < MIN_SESSION_SECRET_LENGTH;

  if (!isDemoMode() && (hasDefaultSecret || weakSecret)) {
    throw new Error(
      "APP_SESSION_SECRET debe estar configurado con al menos 32 caracteres en entornos no demo/producción",
    );
  }

  if (!isDemoMode() && env.demoOperarioPassword === DEFAULT_DEMO_OPERARIO_PASSWORD) {
    throw new Error(
      "DEMO_OPERARIO_PASSWORD usa valor por defecto; define una contraseña fuerte o deshabilita login de operario",
    );
  }

  if (isProduction && env.demoModeForced) {
    throw new Error("DEMO_MODE=true no está permitido en producción");
  }
};

validateEnvironment();

export const isTurnstileConfigured = (): boolean =>
  Boolean(env.turnstile.siteKey && env.turnstile.secretKey);
