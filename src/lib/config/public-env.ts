export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "ARGOS - Plataforma Integral",
  entraTenantId: process.env.NEXT_PUBLIC_ENTRA_TENANT_ID || "",
  entraClientId: process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID || "",
  entraRedirectUri: process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI || "",
};

export const isEntraConfigured = (): boolean =>
  Boolean(publicEnv.entraTenantId && publicEnv.entraClientId);
