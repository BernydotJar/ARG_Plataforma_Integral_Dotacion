import "server-only";

import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { env } from "@/lib/config/env";
import { normalizeRoles } from "@/lib/auth/roles";
import type { AppRole, AppUser } from "@/lib/types/app";

export const SESSION_COOKIE_NAME = "argos_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type EntraIdTokenClaims = JWTPayload & {
  name?: string;
  preferred_username?: string;
  email?: string;
  roles?: string[];
  groups?: string[];
  oid?: string;
  tid?: string;
  extension_Sede?: string | string[];
  sede?: string | string[];
  extension_sede?: string | string[];
};

const getSessionSecret = (): Uint8Array => new TextEncoder().encode(env.appSessionSecret);

const resolveRolesFromClaims = (claims: EntraIdTokenClaims): AppRole[] => {
  const roleClaims = Array.isArray(claims.roles) ? claims.roles : [];
  const groupClaims = Array.isArray(claims.groups) ? claims.groups : [];

  const groupMappedRoles = Object.entries(env.roleGroupMap)
    .filter(([, groupId]) => Boolean(groupId) && groupClaims.includes(groupId))
    .map(([role]) => role);

  return normalizeRoles([...roleClaims, ...groupMappedRoles]);
};

const resolveSedeScope = (claims: EntraIdTokenClaims, roles: AppRole[]): string[] => {
  const fromClaim = [claims.sede, claims.extension_Sede, claims.extension_sede]
    .flatMap((value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return value.split(",");
    })
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (roles.includes("SuperAdmin")) {
    return ["*"];
  }

  if (fromClaim.length > 0) {
    return Array.from(new Set(fromClaim));
  }

  return env.defaultSedes;
};

export const verifyEntraIdToken = async (idToken: string): Promise<EntraIdTokenClaims> => {
  if (!env.entra.tenantId || !env.entra.clientId) {
    throw new Error("Config Entra incompleta: ENTRA_TENANT_ID y ENTRA_CLIENT_ID son requeridos");
  }

  const issuerV2 = `https://login.microsoftonline.com/${env.entra.tenantId}/v2.0`;
  const issuerSts = `https://sts.windows.net/${env.entra.tenantId}/`;

  const jwks = createRemoteJWKSet(
    new URL(`https://login.microsoftonline.com/${env.entra.tenantId}/discovery/v2.0/keys`),
  );

  const { payload } = await jwtVerify(idToken, jwks, {
    audience: env.entra.clientId,
    issuer: [issuerV2, issuerSts],
  });

  return payload as EntraIdTokenClaims;
};

export const buildAppUserFromClaims = (claims: EntraIdTokenClaims): AppUser => {
  const roles = resolveRolesFromClaims(claims);

  return {
    id: claims.oid || claims.sub || crypto.randomUUID(),
    tenantId: claims.tid,
    name: claims.name || claims.preferred_username || "Usuario ARGOS",
    email: claims.preferred_username || claims.email,
    roles,
    sedeIds: resolveSedeScope(claims, roles),
    preferredSedeId: resolveSedeScope(claims, roles)[0],
  };
};

export const signSessionToken = async (user: AppUser): Promise<string> => {
  const nowSeconds = Math.floor(Date.now() / 1000);

  return new SignJWT({
    user,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + SESSION_DURATION_SECONDS)
    .sign(getSessionSecret());
};

export const verifySessionToken = async (token: string): Promise<AppUser | null> => {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const user = (payload as JWTPayload & { user?: AppUser }).user;
    if (!user) return null;
    return user;
  } catch {
    return null;
  }
};

export const getSessionCookieOptions = (expiresAt?: Date) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  expires: expiresAt,
});

export const getServerSessionUser = async (): Promise<AppUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
};

export const requireServerSessionUser = async (): Promise<AppUser> => {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
};

export const getRequestSessionUser = async (request: NextRequest): Promise<AppUser | null> => {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
};
