import { describe, expect, it } from "vitest";

import { jsonError, jsonOk, parseSearchParams } from "@/lib/http/route";

describe("jsonOk", () => {
  it("devuelve el payload con encabezado x-request-id", async () => {
    const response = jsonOk({ hello: "world" });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(await response.json()).toEqual({ hello: "world" });
  });

  it("respeta el requestId provisto", () => {
    const response = jsonOk({ ok: true }, undefined, "req-fijo-123");
    expect(response.headers.get("x-request-id")).toBe("req-fijo-123");
  });
});

describe("jsonError", () => {
  it("incluye error, requestId y status", async () => {
    const response = jsonError("No autorizado", 403);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("No autorizado");
    expect(body.requestId).toBeTruthy();
    expect(response.headers.get("x-request-id")).toBe(body.requestId);
  });

  it("incluye details solo cuando se proveen", async () => {
    const withDetails = await jsonError("Error", 400, "detalle").json();
    expect(withDetails.details).toBe("detalle");

    const withoutDetails = await jsonError("Error", 400).json();
    expect(withoutDetails).not.toHaveProperty("details");
  });
});

describe("parseSearchParams", () => {
  it("extrae los query params de una URL", () => {
    const params = parseSearchParams("http://localhost/api/pedidos?estado=Pendiente&sede=SEDE-1");
    expect(params.get("estado")).toBe("Pendiente");
    expect(params.get("sede")).toBe("SEDE-1");
  });
});
