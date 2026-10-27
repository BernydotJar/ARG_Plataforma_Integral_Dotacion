import { describe, expect, it } from "vitest";

import { resolveWriteSede, SedeAccessError } from "@/lib/auth/sede-scope";
import type { AppUser } from "@/lib/types/app";

const user = (roles: AppUser["roles"], sedeIds: string[], preferredSedeId?: string): AppUser => ({
  id: "qa-user", name: "QA only", roles, sedeIds, preferredSedeId,
});

describe("RF-11/21/34 - sede scope resolved before writes", () => {
  it("allows an explicitly assigned AdminLocal site", () => {
    expect(resolveWriteSede(user(["AdminLocal"], ["sede-a"]), "sede-a")).toBe("sede-a");
  });

  it("never allows an AdminLocal to write another site", () => {
    expect(() => resolveWriteSede(user(["AdminLocal"], ["sede-a"]), "sede-b")).toThrow(SedeAccessError);
  });

  it("accepts a SuperAdmin explicit site, not wildcard as an entity ID", () => {
    expect(resolveWriteSede(user(["SuperAdmin"], ["*"]), "sede-b")).toBe("sede-b");
    expect(() => resolveWriteSede(user(["SuperAdmin"], ["*"]), "*")).toThrow(SedeAccessError);
  });

  it("fails closed for global roles without concrete site choice", () => {
    expect(() => resolveWriteSede(user(["SuperAdmin"], ["*"]))).toThrow(/explícita/);
  });

  it("uses only a confirmed one-site assignment", () => {
    expect(resolveWriteSede(user(["AdminLocal"], ["sede-a"]))).toBe("sede-a");
  });

  it("fails closed for ambiguous multi-site write without selection", () => {
    expect(() => resolveWriteSede(user(["AdminLocal"], ["sede-a", "sede-b"]))).toThrow(SedeAccessError);
  });

  it("honors an explicitly selected preferred site in the authorization set", () => {
    expect(resolveWriteSede(user(["AdminLocal"], ["sede-a", "sede-b"], "sede-b"))).toBe("sede-b");
  });

  it("does not accept a preferred site outside the assigned list", () => {
    expect(() => resolveWriteSede(user(["AdminLocal"], ["sede-a"], "sede-b"))).toThrow(SedeAccessError);
  });

  it("refuses empty, wildcard and whitespace-only requests", () => {
    for (const value of ["", "  ", "*"]) {
      expect(() => resolveWriteSede(user(["AdminLocal"], ["sede-a"]), value)).toThrow(SedeAccessError);
    }
  });

  it("does not treat a legacy role with wildcard as a SuperAdmin", () => {
    expect(() => resolveWriteSede(user(["OperarioBodega"], ["*"]), "sede-a")).toThrow(SedeAccessError);
  });

  it("rejects an identity with zero assigned sites instead of using the environment fallback", () => {
    expect(() => resolveWriteSede(user(["AdminLocal"], []))).toThrow(SedeAccessError);
  });
});
