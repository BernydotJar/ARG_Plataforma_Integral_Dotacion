import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { requireApiUser, requireRequestProtection } from "@/lib/auth/api-auth";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { signSessionToken } from "@/lib/auth/session";
import type { AppUser } from "@/lib/types/app";

const ORIGIN = "http://localhost:3000";

const buildRequest = (options: {
  method?: string;
  origin?: string;
  csrfCookie?: string;
  csrfHeader?: string;
  sessionToken?: string;
}): NextRequest => {
  const headers = new Headers({ host: "localhost:3000" });
  if (options.origin) headers.set("origin", options.origin);
  if (options.csrfHeader) headers.set("x-csrf-token", options.csrfHeader);

  const cookieParts: string[] = [];
  if (options.csrfCookie) cookieParts.push(`${CSRF_COOKIE_NAME}=${options.csrfCookie}`);
  if (options.sessionToken) cookieParts.push(`${SESSION_COOKIE_NAME}=${options.sessionToken}`);
  if (cookieParts.length) headers.set("cookie", cookieParts.join("; "));

  return new NextRequest(`${ORIGIN}/api/test`, {
    method: options.method ?? "POST",
    headers,
  });
};

const buildUser = (overrides: Partial<AppUser> = {}): AppUser => ({
  id: "user-1",
  name: "Usuario Prueba",
  roles: ["UsuarioFinal"],
  sedeIds: ["SEDE-CENTRAL"],
  ...overrides,
});

describe("requireRequestProtection", () => {
  it("no aplica protección a métodos de lectura", () => {
    const result = requireRequestProtection(buildRequest({ method: "GET" }));
    expect(result).toBeNull();
  });

  it("rechaza orígenes no permitidos", async () => {
    const result = requireRequestProtection(
      buildRequest({ origin: "http://atacante.com", csrfCookie: "abc", csrfHeader: "abc" }),
    );
    expect(result?.status).toBe(403);
    expect((await result?.json()).error).toBe("Origen no permitido");
  });

  it("rechaza mutaciones sin token CSRF", async () => {
    const result = requireRequestProtection(buildRequest({ origin: ORIGIN }));
    expect(result?.status).toBe(403);
    expect((await result?.json()).error).toBe("Token CSRF inválido");
  });

  it("rechaza cuando el token CSRF del header no coincide con la cookie", () => {
    const result = requireRequestProtection(
      buildRequest({ origin: ORIGIN, csrfCookie: "abc", csrfHeader: "otro" }),
    );
    expect(result?.status).toBe(403);
  });

  it("permite mutaciones con origen y CSRF válidos", () => {
    const result = requireRequestProtection(
      buildRequest({ origin: ORIGIN, csrfCookie: "abc", csrfHeader: "abc" }),
    );
    expect(result).toBeNull();
  });
});

describe("requireApiUser", () => {
  it("devuelve 401 sin sesión", async () => {
    const result = await requireApiUser(
      buildRequest({ origin: ORIGIN, csrfCookie: "abc", csrfHeader: "abc" }),
    );
    expect("response" in result && result.response.status).toBe(401);
  });

  it("devuelve el usuario con sesión válida", async () => {
    const user = buildUser();
    const token = await signSessionToken(user);
    const result = await requireApiUser(
      buildRequest({ origin: ORIGIN, csrfCookie: "abc", csrfHeader: "abc", sessionToken: token }),
    );
    expect("user" in result && result.user).toEqual(user);
  });

  it("devuelve 403 cuando el rol no está permitido", async () => {
    const token = await signSessionToken(buildUser({ roles: ["UsuarioFinal"] }));
    const result = await requireApiUser(
      buildRequest({ origin: ORIGIN, csrfCookie: "abc", csrfHeader: "abc", sessionToken: token }),
      ["SuperAdmin"],
    );
    expect("response" in result && result.response.status).toBe(403);
  });

  it("permite el acceso cuando el usuario tiene un rol permitido", async () => {
    const user = buildUser({ roles: ["AdminLocal"] });
    const token = await signSessionToken(user);
    const result = await requireApiUser(
      buildRequest({ origin: ORIGIN, csrfCookie: "abc", csrfHeader: "abc", sessionToken: token }),
      ["AdminLocal", "SuperAdmin"],
    );
    expect("user" in result && result.user).toEqual(user);
  });
});
