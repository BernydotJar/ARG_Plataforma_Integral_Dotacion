import { describe, expect, it } from "vitest";

import { canAccessSede, hasAnyRole, hasRole, normalizeRoles, scopeBySede } from "@/lib/auth/roles";
import type { AppUser } from "@/lib/types/app";

const buildUser = (overrides: Partial<AppUser> = {}): AppUser => ({
  id: "user-1",
  name: "Usuario Prueba",
  roles: ["UsuarioFinal"],
  sedeIds: ["SEDE-CENTRAL"],
  ...overrides,
});

describe("normalizeRoles", () => {
  it("acepta roles válidos sin importar mayúsculas", () => {
    expect(normalizeRoles(["superadmin", "ADMINLOCAL"])).toEqual(["SuperAdmin", "AdminLocal"]);
  });

  it("descarta roles desconocidos", () => {
    expect(normalizeRoles(["Hacker", "OperarioBodega"])).toEqual(["OperarioBodega"]);
  });

  it("elimina duplicados", () => {
    expect(normalizeRoles(["UsuarioPedidos", "usuariopedidos"])).toEqual(["UsuarioPedidos"]);
  });

  it("asigna UsuarioFinal cuando no hay roles válidos", () => {
    expect(normalizeRoles([])).toEqual(["UsuarioFinal"]);
    expect(normalizeRoles(["NoExiste"])).toEqual(["UsuarioFinal"]);
  });
});

describe("hasRole / hasAnyRole", () => {
  it("detecta rol presente y ausente", () => {
    const user = buildUser({ roles: ["AdminLocal"] });
    expect(hasRole(user, "AdminLocal")).toBe(true);
    expect(hasRole(user, "SuperAdmin")).toBe(false);
  });

  it("hasAnyRole acepta si al menos un rol coincide", () => {
    const user = buildUser({ roles: ["InspectorCalidad"] });
    expect(hasAnyRole(user, ["SuperAdmin", "InspectorCalidad"])).toBe(true);
    expect(hasAnyRole(user, ["SuperAdmin", "AdminLocal"])).toBe(false);
  });
});

describe("canAccessSede / scopeBySede", () => {
  it("comodín * otorga acceso a cualquier sede", () => {
    const user = buildUser({ sedeIds: ["*"] });
    expect(canAccessSede(user, "SEDE-NORTE")).toBe(true);
  });

  it("limita acceso a las sedes asignadas", () => {
    const user = buildUser({ sedeIds: ["SEDE-CENTRAL"] });
    expect(canAccessSede(user, "SEDE-CENTRAL")).toBe(true);
    expect(canAccessSede(user, "SEDE-NORTE")).toBe(false);
  });

  it("scopeBySede filtra elementos fuera del alcance del usuario", () => {
    const user = buildUser({ sedeIds: ["SEDE-CENTRAL"] });
    const items = [
      { id: "1", sedeId: "SEDE-CENTRAL" },
      { id: "2", sedeId: "SEDE-NORTE" },
    ];
    expect(scopeBySede(items, user)).toEqual([{ id: "1", sedeId: "SEDE-CENTRAL" }]);
  });

  it("scopeBySede devuelve todo para usuarios con comodín", () => {
    const user = buildUser({ sedeIds: ["*"] });
    const items = [
      { id: "1", sedeId: "SEDE-CENTRAL" },
      { id: "2", sedeId: "SEDE-NORTE" },
    ];
    expect(scopeBySede(items, user)).toEqual(items);
  });
});
