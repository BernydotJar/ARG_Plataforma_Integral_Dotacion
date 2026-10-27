import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { signSessionToken } from "@/lib/auth/session";
import type { AppRole, AppUser } from "@/lib/types/app";
import { GET as readStock } from "./stock/route";
import { GET as readMovements, POST as postMovement } from "./movimientos/route";
import { GET as readMovement, PATCH as patchMovement } from "./movimientos/[id]/route";
import { POST as postAdjustment } from "./ajuste/route";

const origin = "http://localhost:3000";
const rolesDenied: AppRole[] = ["UsuarioFinal", "UsuarioPedidos", "OperarioBodega"];

const mockUser = (role: AppRole): AppUser => ({
  id: "qa-inventory-" + role,
  name: "QA synthetic only",
  roles: [role],
  sedeIds: ["SEDE-CENTRAL"],
});

async function request(role: AppRole, method: "GET" | "POST" | "PATCH", pathname: string) {
  const token = await signSessionToken(mockUser(role));
  return new NextRequest(origin + pathname, {
    method,
    headers: {
      host: "localhost:3000",
      origin,
      cookie: "argos_session=" + token + "; argos_csrf=synthetic-csrf",
      "x-csrf-token": "synthetic-csrf",
      "content-type": "application/json",
    },
    ...(method !== "GET" ? { body: JSON.stringify({}) } : {}),
  });
}

const context = { params: Promise.resolve({ id: "movement-1" }) };

describe("Inventory domain RF-15/17/19 - no legacy role access", () => {
  for (const role of rolesDenied) {
    it(role + " cannot read stock", async () => {
      const result = await readStock(await request(role, "GET", "/api/inventario/stock"));
      expect(result.status).toBe(403);
      expect((await result.json()).error).toBe("No autorizado");
    });

    it(role + " cannot read inventory movements", async () => {
      const result = await readMovements(await request(role, "GET", "/api/inventario/movimientos"));
      expect(result.status).toBe(403);
    });

    it(role + " cannot create inventory movements", async () => {
      const result = await postMovement(await request(role, "POST", "/api/inventario/movimientos"));
      expect(result.status).toBe(403);
      expect((await result.json()).error).toBe("No autorizado");
    });

    it(role + " cannot create inventory adjustments", async () => {
      const result = await postAdjustment(await request(role, "POST", "/api/inventario/ajuste"));
      expect(result.status).toBe(403);
    });

    it(role + " cannot read a movement by ID", async () => {
      const result = await readMovement(
        await request(role, "GET", "/api/inventario/movimientos/movement-1"),
        context,
      );
      expect(result.status).toBe(403);
    });

    it(role + " cannot modify a movement by ID", async () => {
      const result = await patchMovement(
        await request(role, "PATCH", "/api/inventario/movimientos/movement-1"),
        context,
      );
      expect(result.status).toBe(403);
    });
  }

  it("rejects anonymous access to inventory stock", async () => {
    const result = await readStock(new NextRequest(origin + "/api/inventario/stock"));
    expect(result.status).toBe(401);
  });
});
