import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { signSessionToken } from "@/lib/auth/session";
import type { AppRole, AppUser } from "@/lib/types/app";
import { GET, POST } from "./route";
import { GET as GET_ORDER } from "./[id]/route";
import { GET as GET_ATTACHMENTS } from "./[id]/adjuntos/route";

const makeUser = (role: AppRole): AppUser => ({
  id: "synthetic-" + role,
  name: "Usuario de QA sintético",
  roles: [role],
  sedeIds: ["SEDE-CENTRAL"],
});

async function requestFor(role: AppRole, method: "GET" | "POST", pathname: string) {
  const token = await signSessionToken(makeUser(role));
  return new NextRequest("http://localhost:3000" + pathname, {
    method,
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      cookie: "argos_session=" + token + "; argos_csrf=test-csrf-token",
      "x-csrf-token": "test-csrf-token",
      "content-type": "application/json",
    },
    ...(method === "POST" ? { body: JSON.stringify({}) } : {}),
  });
}

describe("RF-21/RF-22 order authorization boundary", () => {
  it("blocks UsuarioFinal from listing orders even with valid session", async () => {
    const response = await GET(await requestFor("UsuarioFinal", "GET", "/api/pedidos"));
    expect(response.status).toBe(403);
  });

  it("blocks UsuarioFinal from reading a specific order", async () => {
    const response = await GET_ORDER(
      await requestFor("UsuarioFinal", "GET", "/api/pedidos/p1"),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(response.status).toBe(403);
  });

  it("blocks UsuarioFinal from reading order attachments", async () => {
    const response = await GET_ATTACHMENTS(
      await requestFor("UsuarioFinal", "GET", "/api/pedidos/p1/adjuntos"),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(response.status).toBe(403);
  });

  it("blocks UsuarioFinal from creating an order", async () => {
    const response = await POST(await requestFor("UsuarioFinal", "POST", "/api/pedidos"));
    expect(response.status).toBe(403);
  });

  it("blocks UsuarioPedidos from mutating orders despite having read access", async () => {
    const response = await POST(await requestFor("UsuarioPedidos", "POST", "/api/pedidos"));
    expect(response.status).toBe(403);
  });

  it("blocks anonymous users from listing orders", async () => {
    const response = await GET(new NextRequest("http://localhost:3000/api/pedidos"));
    expect(response.status).toBe(401);
  });
});
