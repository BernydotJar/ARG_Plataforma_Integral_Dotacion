"use client";

import { PublicClientApplication, type AccountInfo } from "@azure/msal-browser";

import { publicEnv } from "@/lib/config/public-env";

let msalApp: PublicClientApplication | null = null;

const getRedirectUri = (): string => {
  if (publicEnv.entraRedirectUri) return publicEnv.entraRedirectUri;
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/login`;
};

const getMsal = (): PublicClientApplication => {
  if (msalApp) return msalApp;

  msalApp = new PublicClientApplication({
    auth: {
      clientId: publicEnv.entraClientId,
      authority: `https://login.microsoftonline.com/${publicEnv.entraTenantId}`,
      redirectUri: getRedirectUri(),
    },
    cache: {
      cacheLocation: "sessionStorage",
    },
  });

  return msalApp;
};

export const loginWithEntra = async (): Promise<{ idToken: string; account: AccountInfo | null }> => {
  const client = getMsal();
  await client.initialize();

  const result = await client.loginPopup({
    scopes: ["openid", "profile", "email"],
    prompt: "select_account",
  });

  return {
    idToken: result.idToken,
    account: result.account,
  };
};

export const logoutFromEntra = async (): Promise<void> => {
  const client = getMsal();
  await client.initialize();
  const account = client.getActiveAccount() || client.getAllAccounts()[0] || undefined;

  await client.logoutPopup({
    account,
    mainWindowRedirectUri: "/login",
  });
};
