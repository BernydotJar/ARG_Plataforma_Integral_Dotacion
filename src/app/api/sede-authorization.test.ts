import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { signSessionToken } from "@/lib/auth/session";
import type { AppRole, AppUser } from "@/lib/types/app";
import { POST as postPedido } from "./pedidos/route";
import { POST as postMovimiento } from "./inventario/movimientos/route";
import { POST as postAjuste } from "./inventario/ajuste/route";

const origin = "http://localhost:3000";
const pedido = {
  sedeId: "sede-norte",
  empleadoNombre: "Persona QA Sintética",
  areaNombre: "Área de pruebas",
  prioridad: "Media",
  detalles: [{ itemNombre: "Camisa", talla: "M", cantidad: 1 }],
};
const movimiento = {
  sedeId: "sede-norte",
  tipo: "Ingreso",
  itemNombre: "Camisa",
  bodegaNombre: "Bodega QA",
  ubicacionNombre: "Estante QA",
  cantidad: 2,
};
const ajuste = {
  sedeId: "sede-norte",
  itemNombre: "Camisa",
  bodegaNombre: "Bodega QA",
  ubicacionNombre: "Estante QA",
  cantidad: 1,
  motivo: "Revisión de pruebas",
};

const user = (roles: AppRole[], sedeIds: string[], preferredSedeId?: string): AppUser => ({
  id: "synthetic-" + roles.join("-"),
  name: "QA only",
  roles,
  sedeIds,
  preferredSedeId,
});

async function request(session: AppUser, pathname: string, body: object) {
  const token = await signSessionToken(session);
  return new NextRequest(origin + pathname, {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin,
      cookie: "argos_session=" + token + "; argos_csrf=qa-csrf",
      "x-csrf-token": "qa-csrf",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("RF-11/21/34 - Reject cross-site mutations before repositories", () => {
  const local = user(["AdminLocal"], ["sede-centro"], "sede-centro");

  it("denies an order for a different site with a valid AdminLocal session and CSRF", async () => {
    const response = await postPedido(await request(local, "/api/pedidos", pedido));
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("Sede no autorizada");
  });

  it("denies an inventory movement for an unauthorized site", async () => {
    const response = await postMovimiento(
      await request(local, "/api/inventario/movimientos", movimiento),
    );
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("Sede no autorizada");
  });

  it("denies an inventory adjustment for an unauthorized site", async () => {
    const response = await postAjuste(await request(local, "/api/inventario/ajuste", ajuste));
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("Sede no autorizada");
  });

  it("disallows SuperAdmin writing to the global wildcard pseudo-site", async () => {
    const admin = user(["SuperAdmin"], ["*"], "*");
    const response = await postPedido(await request(admin, "/api/pedidos", { ...pedido, sedeId: "*" }));
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("Sede no autorizada");
  });

  it("does not assume a default site for SuperAdmin", async () => {
    const admin = user(["SuperAdmin"], ["*"], "*");
    const { sedeId: ignored, ...withoutSite } = pedido;
    void ignored;
    const response = await postPedido(await request(admin, "/api/pedidos", withoutSite));
    expect(response.status).toBe(403);
  });

  it("allows synthetic AdminLocal to create a correctly scoped order in demo QA", async () => {
    const response = await postPedido(
      await request(local, "/api/pedidos", { ...pedido, sedeId: "sede-centro" }),
    );
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.data.sedeId).toBe("sede-centro");
  });
});
