import { describe, expect, it } from "vitest";

import {
  buildAppUserFromClaims,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";
import type { AppUser } from "@/lib/types/app";

const buildUser = (overrides: Partial<AppUser> = {}): AppUser => ({
  id: "user-1",
  name: "Usuario Prueba",
  email: "usuario@example.com",
  roles: ["UsuarioFinal"],
  sedeIds: ["SEDE-CENTRAL"],
  preferredSedeId: "SEDE-CENTRAL",
  ...overrides,
});

describe("signSessionToken / verifySessionToken", () => {
  it("firma y verifica un token de sesión (roundtrip)", async () => {
    const user = buildUser();
    const token = await signSessionToken(user);
    const verified = await verifySessionToken(token);
    expect(verified).toEqual(user);
  });

  it("rechaza tokens manipulados", async () => {
    const token = await signSessionToken(buildUser());
    const [header, payload] = token.split(".");
    const tampered = `${header}.${payload}.firma-invalida`;
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rechaza tokens arbitrarios", async () => {
    expect(await verifySessionToken("no-es-un-jwt")).toBeNull();
  });

  it("rechaza un token firmado sin roles", async () => {
    const token = await signSessionToken(buildUser({ roles: [] }));
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("rechaza un token firmado sin sedes", async () => {
    const token = await signSessionToken(buildUser({ sedeIds: [] }));
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("rechaza un token firmado con AdminLocal y sede global", async () => {
    const token = await signSessionToken(buildUser({ roles: ["AdminLocal"], sedeIds: ["*"] }));
    expect(await verifySessionToken(token)).toBeNull();
  });
});

describe("buildAppUserFromClaims", () => {
  it("mapea claims básicos de Entra ID", () => {
    const user = buildAppUserFromClaims({
      oid: "oid-123",
      tid: "tenant-abc",
      name: "Ana Pérez",
      preferred_username: "ana.perez@empresa.com",
      roles: ["AdminLocal"],
      sede: "SEDE-CENTRAL",
    });

    expect(user.id).toBe("oid-123");
    expect(user.tenantId).toBe("tenant-abc");
    expect(user.name).toBe("Ana Pérez");
    expect(user.email).toBe("ana.perez@empresa.com");
    expect(user.roles).toEqual(["AdminLocal"]);
  });

  it("asigna comodín de sedes a SuperAdmin", () => {
    const user = buildAppUserFromClaims({
      oid: "oid-admin",
      roles: ["SuperAdmin"],
    });

    expect(user.sedeIds).toEqual(["*"]);
    expect(user.preferredSedeId).toBe("*");
  });

  it("usa las sedes del claim cuando existen", () => {
    const user = buildAppUserFromClaims({
      oid: "oid-1",
      roles: ["UsuarioPedidos"],
      sede: "SEDE-NORTE, SEDE-SUR",
    });

    expect(user.sedeIds).toEqual(["SEDE-NORTE", "SEDE-SUR"]);
    expect(user.preferredSedeId).toBe("SEDE-NORTE");
  });

  it("rechaza usuarios administrativos sin asignación de sedes", () => {
    expect(() => buildAppUserFromClaims({
      oid: "oid-2",
      roles: ["UsuarioPedidos"],
    })).toThrow(/sin sede autorizada/);
  });

  it("rechaza roles desconocidos sin otorgar UsuarioFinal", () => {
    expect(() => buildAppUserFromClaims({
      oid: "oid-3",
      roles: ["RolInexistente"],
      sede: "SEDE-CENTRAL",
    })).toThrow(/sin un rol autorizado/);
  });

  it("rechaza AdminLocal con wildcard sin SuperAdmin", () => {
    expect(() => buildAppUserFromClaims({
      oid: "oid-4",
      roles: ["AdminLocal"],
      sede: "*",
    })).toThrow(/acceso global implícito/);
  });

  it("rechaza identidad sin OID ni SUB", () => {
    expect(() => buildAppUserFromClaims({
      roles: ["SuperAdmin"],
    })).toThrow(/identificador estable/);
  });
});
